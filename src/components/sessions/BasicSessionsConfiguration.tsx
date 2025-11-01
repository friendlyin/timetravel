'use client';

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import {
    GeoCoordinateSelector,
    type GeoCoordinate
} from './GeoCoordinateSelector'
import type { LocationResolutionResult } from '@/types/location.types'
import type { ResolveLocationResponse } from '@/types/api.types'

const CONFIGURED_PROVIDER = (() => {
    const raw = process.env.NEXT_PUBLIC_LOCATION_PROVIDER
    console.log({ PROVIDER: process.env.NEXT_PUBLIC_LOCATION_PROVIDER })
    if (!raw) {
        return null
    }
    const normalized = raw.trim().toLowerCase()
    return normalized === 'whg' || normalized === 'openai' ? normalized : null
})()

const YEAR_MIN = 0
const YEAR_MAX = 2000

export function BasicSessionsConfiguration() {
    const [coordinate, setCoordinate] = useState<GeoCoordinate | null>(null)
    const [year, setYear] = useState<number>(0)
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const [locationResult, setLocationResult] =
        useState<LocationResolutionResult | null>(null)
    const [isLocationLoading, setIsLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)

    const isStartEnabled = coordinate !== null && selectedYear !== null

    const yearLabel = useMemo(() => {
        if (selectedYear === null) {
            return 'Select a year'
        }
        if (year === 0) {
            return 'Year 0'
        }
        if (year < 0) {
            return `${Math.abs(year)} BCE`
        }
        return `${year} CE`
    }, [selectedYear, year])

    const handleYearChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const nextYear = Number.parseInt(event.target.value, 10)
            setYear(nextYear)
        },
        []
    )

    const commitYearSelection = useCallback(() => {
        setSelectedYear((previous) => {
            if (previous === year) {
                return previous
            }
            return year
        })
    }, [year])

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
                    commitYearSelection()
                    break
                default:
                    break
            }
        },
        [commitYearSelection]
    )

    const handleCoordinateChange = useCallback(
        (nextCoordinate: GeoCoordinate) => {
            setCoordinate(nextCoordinate)
            setLocationResult(null)
            setLocationError(null)
        },
        []
    )

    useEffect(() => {
        if (!coordinate || selectedYear === null) {
            setLocationResult(null)
            setIsLocationLoading(false)
            return
        }

        const abortController = new AbortController()
        let didCancel = false

        async function fetchLocation() {
            setIsLocationLoading(true)
            setLocationError(null)

            try {
                const params = new URLSearchParams({
                    lon: coordinate.lon.toString(),
                    lat: coordinate.lat.toString(),
                    year: selectedYear.toString()
                })

                if (CONFIGURED_PROVIDER) {
                    params.set('provider', CONFIGURED_PROVIDER)
                }

                const response = await fetch(
                    `/api/location/resolve?${params.toString()}`,
                    {
                        signal: abortController.signal
                    }
                )

                if (!response.ok) {
                    throw new Error(
                        `Failed to resolve location (status ${response.status})`
                    )
                }

                const payload =
                    (await response.json()) as ResolveLocationResponse

                if (!payload.success || !payload.data) {
                    throw new Error(payload.error ?? 'Location lookup failed')
                }

                if (!didCancel) {
                    setLocationResult(payload.data)
                }
            } catch (error) {
                if (didCancel) {
                    return
                }
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return
                }
                setLocationError(
                    error instanceof Error
                        ? error.message
                        : 'Unknown error while resolving location'
                )
                setLocationResult(null)
            } finally {
                if (!didCancel) {
                    setIsLocationLoading(false)
                }
            }
        }

        fetchLocation()

        return () => {
            didCancel = true
            abortController.abort()
        }
    }, [coordinate, selectedYear])

    const handleStartSession = useCallback(() => {
        if (!isStartEnabled || !coordinate || selectedYear === null) {
            return
        }

        // Logging the session bootstrap payload for now.
        // This will be replaced with actual session creation once the API is ready.
        console.log({
            lon: coordinate.lon,
            lat: coordinate.lat,
            year: selectedYear
        })
    }, [coordinate, isStartEnabled, selectedYear])

    return (
        <section className="flex w-full max-w-4xl flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <header className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Start a New Journey
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Select a starting year and location to begin crafting a new
                    timeline.
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
                        onPointerUp={commitYearSelection}
                        onKeyUp={handleYearKeyUp}
                        onBlur={commitYearSelection}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500 dark:bg-slate-700 dark:accent-sky-400"
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
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {!coordinate && (
                            <span>
                                Select a point on the map to resolve the
                                historical location.
                            </span>
                        )}
                        {coordinate && selectedYear === null && (
                            <span>
                                Select a year to fetch the historical place
                                information.
                            </span>
                        )}
                        {coordinate &&
                            selectedYear !== null &&
                            isLocationLoading && (
                                <span>Resolving location details…</span>
                            )}
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
                                        {locationResult.settlement && (
                                            <>
                                                Settlement:{' '}
                                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                                    {locationResult.settlement}
                                                </span>
                                            </>
                                        )}
                                        {!locationResult.settlement &&
                                            'Settlement: N/A'}
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
                                        Source:{' '}
                                        {locationResult.provider.toUpperCase()}{' '}
                                        · Confidence:{' '}
                                        {Math.round(
                                            locationResult.confidence * 100
                                        )}
                                        %
                                    </span>
                                </div>
                            )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Click anywhere on the map to fix the origin point for
                        this life.
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
                            : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                    ].join(' ')}
                >
                    Start session
                </button>
            </div>
        </section>
    )
}
