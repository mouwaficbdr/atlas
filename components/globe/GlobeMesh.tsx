'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { extractPalette } from '@/lib/color-extractor';
import type { GeoJSONFeature, CountryData } from '@/lib/types';
import CountryMesh from './CountryMesh';
import Tooltip from './Tooltip';

interface GlobeMeshProps {
  countries: CountryData[];
  onSelect: (cca3: string) => void;
}

export default function GlobeMesh({ countries, onSelect }: GlobeMeshProps) {
  const [features, setFeatures] = useState<GeoJSONFeature[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [hoveredCca3, setHoveredCca3] = useState<string | null>(null);

  useEffect(() => {
    loadGeoJSON().then((data) => setFeatures(data.features)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!features.length || !countries.length) return;

    const countryMap = new Map(countries.map((c) => [c.cca3, c]));

    features.forEach((feature) => {
      const cca3 = feature.properties.ISO_A3;
      const country = countryMap.get(cca3);
      if (!country) return;

      extractPalette(country.flags.svg, cca3)
        .then((palette) => {
          setColors((prev) => ({ ...prev, [cca3]: palette.primary }));
        })
        .catch(() => {
          setColors((prev) => ({ ...prev, [cca3]: '#4A5568' }));
        });
    });
  }, [features, countries]);

  const hoveredFeature = hoveredCca3
    ? features.find((f) => f.properties.ISO_A3 === hoveredCca3)
    : null;

  const hoveredCountry = hoveredCca3
    ? countries.find((c) => c.cca3 === hoveredCca3)
    : null;

  return (
    <group>
      {/* Sphère principale */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial color="#1a1a2e" shininess={10} />
      </mesh>

      {/* Pays */}
      {features.map((feature) => (
        <CountryMesh
          key={feature.properties.ISO_A3}
          feature={feature}
          color={colors[feature.properties.ISO_A3] ?? '#4A5568'}
          onSelect={onSelect}
          onHover={setHoveredCca3}
        />
      ))}

      {/* Tooltip au survol */}
      {hoveredFeature && hoveredCountry && (
        <Tooltip
          flagSvg={hoveredCountry.flags.svg}
          countryName={hoveredCountry.name.official}
          visible={true}
        />
      )}
    </group>
  );
}
