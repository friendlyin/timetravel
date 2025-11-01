'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import type MapBrowserEvent from 'ol/MapBrowserEvent';

export type GeoCoordinate = {
  lon: number;
  lat: number;
};

type GeoCoordinateSelectorProps = {
  value: GeoCoordinate | null;
  onChange: (coordinate: GeoCoordinate) => void;
};

export function GeoCoordinateSelector({
  value,
  onChange,
}: GeoCoordinateSelectorProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerSourceRef = useRef<VectorSource<Point> | null>(null);

  const markerStyle = useMemo(
    () =>
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: '#2563eb' }),
          stroke: new Stroke({ color: '#1d4ed8', width: 2 }),
        }),
      }),
    [],
  );

  useEffect(() => {
    if (mapRef.current || !mapElementRef.current) {
      return;
    }

    const markerSource = new VectorSource<Point>();
    const markerLayer = new VectorLayer<VectorSource<Point>>({
      source: markerSource,
      style: markerStyle,
    });

    const mapInstance = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        maxZoom: 8,
      }),
      controls: [],
    });

    markerSourceRef.current = markerSource;
    mapRef.current = mapInstance;

    return () => {
      mapInstance.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current = null;
    };
  }, [markerStyle]);

  const handleMapClick = useCallback(
    (event: MapBrowserEvent<unknown>) => {
      const coordinate = toLonLat(event.coordinate);
      onChange({ lon: coordinate[0], lat: coordinate[1] });
    },
    [onChange],
  );

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) {
      return;
    }

    mapInstance.on('singleclick', handleMapClick);

    return () => {
      mapInstance.un('singleclick', handleMapClick);
    };
  }, [handleMapClick]);

  useEffect(() => {
    const markerSource = markerSourceRef.current;
    const mapInstance = mapRef.current;
    if (!markerSource || !mapInstance) {
      return;
    }

    markerSource.clear();

    if (value) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([value.lon, value.lat])),
      });
      markerSource.addFeature(feature);

      const view = mapInstance.getView();
      const nextCenter = fromLonLat([value.lon, value.lat]);
      view.setCenter(nextCenter);
      if (view.getZoom() < 4) {
        view.setZoom(4);
      }
    }
  }, [value]);

  const handleMapRef = useCallback((element: HTMLDivElement | null) => {
    mapElementRef.current = element;
    if (element && mapRef.current) {
      mapRef.current.setTarget(element);
    }
  }, []);

  return (
    <div className="flex h-64 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-700 dark:bg-slate-900">
      <div ref={handleMapRef} className="h-full w-full" />
    </div>
  );
}
