'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  GeoCoordinateSelector,
  type GeoCoordinate,
} from './GeoCoordinateSelector';

const YEAR_MIN = -4000;
const YEAR_MAX = 2000;

export function BasicSessionsConfiguration() {
  const [coordinate, setCoordinate] = useState<GeoCoordinate | null>(null);
  const [year, setYear] = useState<number>(0);
  const [hasSelectedYear, setHasSelectedYear] = useState<boolean>(false);

  const isStartEnabled = coordinate !== null && hasSelectedYear;

  const yearLabel = useMemo(() => {
    if (!hasSelectedYear) {
      return 'Select a year';
    }
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    if (year === 0) {
      return 'Year 0';
    }
    return `${year} CE`;
  }, [hasSelectedYear, year]);

  const handleYearChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextYear = Number.parseInt(event.target.value, 10);
      setYear(nextYear);
      setHasSelectedYear(true);
    },
    [],
  );

  const handleCoordinateChange = useCallback((nextCoordinate: GeoCoordinate) => {
    setCoordinate(nextCoordinate);
  }, []);

  const handleStartSession = useCallback(() => {
    if (!isStartEnabled || !coordinate) {
      return;
    }

    // Logging the session bootstrap payload for now.
    // This will be replaced with actual session creation once the API is ready.
    console.log({
      lon: coordinate.lon,
      lat: coordinate.lat,
      year,
    });
  }, [coordinate, isStartEnabled, year]);

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
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 dark:bg-slate-700 dark:accent-sky-400"
          />
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{`${Math.abs(YEAR_MIN)} BCE`}</span>
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
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click anywhere on the map to fix the origin point for this life.
          </p>
        </div>
      </div>

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
          Start session
        </button>
      </div>
    </section>
  );
}
