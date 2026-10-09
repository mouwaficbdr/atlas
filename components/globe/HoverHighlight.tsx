'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import earcut from 'earcut';
import type { GeoJSONFeature } from '@/lib/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

const FILL_RADIUS = 1.004;
const LINE_RADIUS = 1.006;
const FILL_OPACITY = 0.38;
// Arête max (en degrés) d'un triangle avant subdivision : un grand triangle
// plat (Russie, Canada) passerait sous la surface de la sphère en son
// milieu ; subdivisé, il en épouse la courbure.
const MAX_EDGE_DEG = 2;

function project(lon: number, lat: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), -r * Math.sin(phi) * Math.sin(theta)];
}

type LonLat = [number, number];

function subdivide(a: LonLat, b: LonLat, c: LonLat, out: number[], depth = 0) {
  const edge = Math.max(
    Math.hypot(a[0] - b[0], a[1] - b[1]),
    Math.hypot(b[0] - c[0], b[1] - c[1]),
    Math.hypot(c[0] - a[0], c[1] - a[1]),
  );
  if (edge <= MAX_EDGE_DEG || depth >= 5) {
    out.push(...project(a[0], a[1], FILL_RADIUS), ...project(b[0], b[1], FILL_RADIUS), ...project(c[0], c[1], FILL_RADIUS));
    return;
  }
  const ab: LonLat = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const bc: LonLat = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
  const ca: LonLat = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
  subdivide(a, ab, ca, out, depth + 1);
  subdivide(ab, b, bc, out, depth + 1);
  subdivide(ca, bc, c, out, depth + 1);
  subdivide(ab, bc, ca, out, depth + 1);
}

function polygonsOf(feature: GeoJSONFeature): number[][][][] {
  const coords = feature.geometry.coordinates;
  return feature.geometry.type === 'MultiPolygon' ? (coords as number[][][][]) : [coords as number[][][]];
}

/**
 * Surbrillance du seul pays survolé : remplissage teinté discret + contour
 * clair. Aucun pays n'est teinté au repos, la Terre réaliste reste lisible
 * (la couleur brute des drapeaux jurait avec la texture photo).
 */
export default function HoverHighlight({ feature, color }: { feature: GeoJSONFeature; color: string }) {
  const reducedMotion = useReducedMotion();
  const fillRef = useRef<THREE.MeshBasicMaterial>(null);
  const lineRef = useRef<THREE.LineBasicMaterial>(null);

  const { fill, outline } = useMemo(() => {
    const fillPositions: number[] = [];
    const linePositions: number[] = [];

    for (const polygon of polygonsOf(feature)) {
      const flat: number[] = [];
      const holes: number[] = [];
      polygon.forEach((ring, i) => {
        if (i > 0) holes.push(flat.length / 2);
        for (const [lon, lat] of ring) flat.push(lon, lat);
        for (let k = 0; k < ring.length - 1; k++) {
          linePositions.push(...project(ring[k][0], ring[k][1], LINE_RADIUS), ...project(ring[k + 1][0], ring[k + 1][1], LINE_RADIUS));
        }
      });
      const tris = earcut(flat, holes.length ? holes : undefined, 2);
      const pt = (i: number): LonLat => [flat[i * 2], flat[i * 2 + 1]];
      for (let i = 0; i < tris.length; i += 3) subdivide(pt(tris[i]), pt(tris[i + 1]), pt(tris[i + 2]), fillPositions);
    }

    const fillGeom = new THREE.BufferGeometry();
    fillGeom.setAttribute('position', new THREE.Float32BufferAttribute(fillPositions, 3));
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    return { fill: fillGeom, outline: lineGeom };
  }, [feature]);

  useEffect(
    () => () => {
      fill.dispose();
      outline.dispose();
    },
    [fill, outline],
  );

  useFrame((state, delta) => {
    const k = reducedMotion ? 1 : Math.min(1, delta * 10);
    if (fillRef.current) fillRef.current.opacity += (FILL_OPACITY - fillRef.current.opacity) * k;
    if (lineRef.current) lineRef.current.opacity += (1 - lineRef.current.opacity) * k;
    // En mode fiche, le canvas ne rend qu'à la demande : on relance tant que le fondu n'est pas fini.
    if (lineRef.current && lineRef.current.opacity < 0.99) state.invalidate();
  });

  return (
    <group renderOrder={11}>
      <mesh geometry={fill} renderOrder={11}>
        <meshBasicMaterial ref={fillRef} color={color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={outline} renderOrder={12}>
        <lineBasicMaterial ref={lineRef} color="#fff4d6" transparent opacity={0} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
