'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

import {
  GeoCoordinateSelector,
  type GeoCoordinate,
} from './GeoCoordinateSelector';
import type { SessionHistoryController } from '@/hooks/useSessionHistory';
import type { StartSessionRequest, ResolveLocationResponse } from '@/types/api.types';
import type { LocationResolutionResult } from '@/types/location.types';

const CONFIGURED_PROVIDER = (() => {
  const raw = process.env.NEXT_PUBLIC_LOCATION_PROVIDER;
  if (!raw) {
    return null;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === 'whg' || normalized === 'openai' ? normalized : null;
})();

const YEAR_MIN = 0;
const YEAR_MAX = 2000;

type BasicSessionsConfigurationProps = {
  sessionHistory: SessionHistoryController;
};

export function BasicSessionsConfiguration({
  sessionHistory,
}: BasicSessionsConfigurationProps) {
  const [coordinate, setCoordinate] = useState<GeoCoordinate | null>(null);
  const [year, setYear] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [locationResult, setLocationResult] =
    useState<LocationResolutionResult | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startSuccess, setStartSuccess] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const {
    sessions,
    selectedSessionId,
    isHydrated,
    startSession,
  } = sessionHistory;

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const isSessionFinalized = Boolean(activeSession?.sessionDataId);

  const isHistoryReady = isHydrated;
  const canConfigure = Boolean(activeSession) && !isSessionFinalized;
  const isFormInteractive = canConfigure && isHistoryReady;

  const locationLabel = useMemo(() => {
    if (!locationResult) {
      return null;
    }

    const parts = [
      locationResult.settlement,
      locationResult.area,
      locationResult.country,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length > 0));

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return locationResult.area ?? locationResult.provider.toUpperCase();
  }, [locationResult]);

  const isStartEnabled =
    isFormInteractive &&
    coordinate !== null &&
    selectedYear !== null &&
    locationResult !== null &&
    !isLocationLoading &&
    !locationError &&
    !isStarting;

  const yearLabel = useMemo(() => {
    if (selectedYear === null) {
      return 'Select a year';
    }
    if (year === 0) {
      return 'Year 0';
    }
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
  }, [selectedYear, year]);

  const handleYearChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!isFormInteractive) {
      return;
    }
    const nextYear = Number.parseInt(event.target.value, 10);
    setYear(nextYear);
  }, [isFormInteractive]);

  const commitYearSelection = useCallback(() => {
    setSelectedYear((previous) => {
      if (previous === year) {
        return previous;
      }
      return year;
    });
  }, [year]);

  const handleYearKeyUp = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
        case 'Home':
        case 'End':
        case 'PageUp':
        case 'PageDown':
        case 'Enter':
        case ' ':
        case 'Spacebar':
          commitYearSelection();
          break;
        default:
          break;
      }
    },
    [commitYearSelection],
  );

  const handleCoordinateChange = useCallback((nextCoordinate: GeoCoordinate) => {
    if (!isFormInteractive) {
      return;
    }
    setCoordinate(nextCoordinate);
    setLocationResult(null);
    setLocationError(null);
    setStartError(null);
    setStartSuccess(null);
  }, [isFormInteractive]);

  useEffect(() => {
    if (!activeSession) {
      setCoordinate(null);
      setYear(0);
      setSelectedYear(null);
      setLocationResult(null);
      setLocationError(null);
      setStartError(null);
      setStartSuccess(null);
      return;
    }

    if (!activeSession.sessionDataId) {
      setCoordinate(null);
      setYear(0);
      setSelectedYear(null);
      setLocationResult(null);
      setLocationError(null);
      setStartError(null);
      setStartSuccess(null);
    } else {
      setStartError(null);
      setStartSuccess(null);
    }
  }, [activeSession]);

  useEffect(() => {
    if (!isFormInteractive || !coordinate || selectedYear === null) {
      setLocationResult(null);
      setIsLocationLoading(false);
      return;
    }

    const abortController = new AbortController();
    let didCancel = false;

    async function fetchLocation() {
      setIsLocationLoading(true);
      setLocationError(null);

      try {
        const params = new URLSearchParams({
          lon: coordinate.lon.toString(),
          lat: coordinate.lat.toString(),
          year: selectedYear.toString(),
        });

        if (CONFIGURED_PROVIDER) {
          params.set('provider', CONFIGURED_PROVIDER);
        }

        const response = await fetch(
          `/api/location/resolve?${params.toString()}`,
          {
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to resolve location (status ${response.status})`,
          );
        }

        const payload = (await response.json()) as ResolveLocationResponse;

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? 'Location lookup failed');
        }

        if (!didCancel) {
          setLocationResult(payload.data);
        }
      } catch (error) {
        if (didCancel) {
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setLocationError(
          error instanceof Error
            ? error.message
            : 'Unknown error while resolving location',
        );
        setLocationResult(null);
      } finally {
        if (!didCancel) {
          setIsLocationLoading(false);
        }
      }
    }

    void fetchLocation();

    return () => {
      didCancel = true;
      abortController.abort();
    };
  }, [coordinate, isFormInteractive, selectedYear]);

  const handleStartSession = useCallback(() => {
    if (
      !isStartEnabled ||
      !coordinate ||
      selectedYear === null ||
      !locationResult ||
      !locationLabel
    ) {
      return;
    }

    const payload: StartSessionRequest = {
      year: selectedYear,
      coordinate: {
        lat: coordinate.lat,
        lon: coordinate.lon,
      },
      location: {
        label: locationLabel,
        area: locationResult.area,
        country: locationResult.country,
        settlement: locationResult.settlement,
        provider: locationResult.provider,
      },
    };

    setIsStarting(true);
    setStartError(null);
    setStartSuccess(null);

    void startSession(payload)
      .then((sessionId) => {
        setStartSuccess(`Session ${sessionId} created. Timeline updating…`);
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to start session';
        setStartError(message);
      })
      .finally(() => {
        setIsStarting(false);
      });
  }, [
    coordinate,
    isStartEnabled,
    locationLabel,
    locationResult,
    selectedYear,
    startSession,
  ]);

  return (
    <section className="flex w-full max-w-4xl flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Start a New Journey
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select a starting year and location to begin crafting a new timeline.
        </p>
      </header>

      {!activeSession && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Use the <span className="font-semibold">New</span> button in the session list to create a slot before configuring a journey.
        </div>
      )}

      {isSessionFinalized && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          This session already has a generated timeline. Create another session to start a new life.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Year
          </span>
          <input
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={year}
            onChange={handleYearChange}
            onPointerUp={commitYearSelection}
            onKeyUp={handleYearKeyUp}
            onBlur={commitYearSelection}
            disabled={!isFormInteractive}
            className={[
              'h-2 w-full appearance-none rounded-full bg-slate-200 accent-sky-500 dark:bg-slate-700 dark:accent-sky-400',
              isFormInteractive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
            ].join(' ')}
          />
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {YEAR_MIN}
              {YEAR_MIN >= 0 ? 'CE' : 'BCE'}
            </span>
            <span>{yearLabel}</span>
            <span>{`${YEAR_MAX} CE`}</span>
          </div>
        </label>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Location
          </span>
          <GeoCoordinateSelector
            value={coordinate}
            onChange={handleCoordinateChange}
            disabled={!isFormInteractive}
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {!isFormInteractive ? (
              <span>
                {activeSession
                  ? 'This session is locked because its story has already begun.'
                  : 'Select a session from the sidebar to configure a new journey.'}
              </span>
            ) : (
              <>
                {!coordinate && (
                  <span>
                    Select a point on the map to resolve the historical location.
                  </span>
                )}
                {coordinate && selectedYear === null && (
                  <span>
                    Select a year to fetch the historical place information.
                  </span>
                )}
                {coordinate &&
                  selectedYear !== null &&
                  isLocationLoading && <span>Resolving location details…</span>}
                {coordinate &&
                  selectedYear !== null &&
                  !isLocationLoading &&
                  locationError && (
                    <span className="text-rose-600 dark:text-rose-400">
                      {locationError}
                    </span>
                  )}
                {coordinate &&
                  selectedYear !== null &&
                  !isLocationLoading &&
                  !locationError &&
                  locationResult && (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-100">
                        {locationResult.area}
                      </span>
                      <span>
                        {locationResult.settlement ? (
                          <>
                            Settlement:{' '}
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {locationResult.settlement}
                            </span>
                          </>
                        ) : (
                          'Settlement: N/A'
                        )}
                      </span>
                      <span>
                        {locationResult.country ? (
                          <>
                            Country:{' '}
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {locationResult.country}
                            </span>
                          </>
                        ) : (
                          'Country: N/A'
                        )}
                      </span>
                      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                        Source: {locationResult.provider.toUpperCase()} · Confidence:{' '}
                        {Math.round(locationResult.confidence * 100)}%
                      </span>
                    </div>
                  )}
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isFormInteractive
              ? 'Click anywhere on the map to fix the origin point for this life.'
              : 'Start a fresh session to choose a new origin point.'}
          </p>
        </div>
      </div>

      {!isHistoryReady && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Loading session history…
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleStartSession}
            disabled={!isStartEnabled}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900',
              isStartEnabled
                ? 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-400 dark:bg-sky-500 dark:hover:bg-sky-600 dark:focus:ring-sky-300'
                : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
            ].join(' ')}
          >
            {isStarting ? 'Starting…' : 'Start session'}
          </button>
        </div>
        {(startError || startSuccess) && (
          <div
            className={[
              'rounded-lg border px-3 py-2 text-xs',
              startError
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
            ].join(' ')}
          >
            {startError ?? startSuccess}
          </div>
        )}
      </div>
    </section>
  );
}
