import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface HolographicTextProps {
  text: string;
  latlng: [number, number]; // [lat, lon]
  color?: string;
  /** S'efface seule après ce délai (ms) : étiquette du pays quitté (#22). */
  fadeOutAfter?: number;
}

export const projectPoint = (lat: number, lon: number, r: number = 1.05): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    -r * Math.sin(phi) * Math.sin(theta),
  ];
};

function makeTextTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Mesurer le texte d'abord pour déterminer la largeur nécessaire
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    const metrics = ctx.measureText(text.toUpperCase());
    const textWidth = metrics.width;

    // Définir la taille du canvas avec padding
    canvas.width = Math.max(256, Math.ceil(textWidth + 40));
    canvas.height = 64;

    // Redessiner avec la bonne taille
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), canvas.width / 2, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function HolographicText({ text, latlng, color = '#ffffff', fadeOutAfter }: HolographicTextProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const reducedMotion = useReducedMotion();
  const [lat, lon] = latlng;

  const position = useMemo(() => projectPoint(lat, lon, 1.02), [lat, lon]);
  const targetPosition = useMemo(() => projectPoint(lat, lon, 1.12), [lat, lon]);
  const normal = useMemo(() => new THREE.Vector3(...position).normalize(), [position]);
  // Vecteur de travail réutilisé dans useFrame pour éviter une allocation par frame.
  const hoverOffset = useRef(new THREE.Vector3());

  const { spriteMaterial, spriteScale } = useMemo(() => {
    const texture = makeTextTexture(text, color);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Calculer l'échelle en fonction de la largeur du canvas
    const aspectRatio = texture.image.width / texture.image.height;
    const baseHeight = 0.1;
    const scale: [number, number, number] = [baseHeight * aspectRatio, baseHeight, 1];

    return { spriteMaterial: material, spriteScale: scale };
  }, [text, color]);

  // Le texte/la couleur changeant recrée texture + matériau (useMemo ci-dessus) :
  // sans ce cleanup, chaque pays survolé laissait un CanvasTexture + un
  // SpriteMaterial orphelins côté GPU pour toute la session.
  useEffect(() => {
    return () => {
      spriteMaterial.map?.dispose();
      spriteMaterial.dispose();
    };
  }, [spriteMaterial]);

  useEffect(() => {
    if (!spriteRef.current) return;
    if (reducedMotion) {
      spriteRef.current.position.set(
        targetPosition[0],
        targetPosition[1],
        targetPosition[2],
      );
      spriteMaterial.opacity = 1;
      return () => {
        spriteMaterial.opacity = 0;
      };
    }
    spriteRef.current.position.set(position[0], position[1], position[2]);
    gsap.to(spriteRef.current.position, {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
      duration: 0.5,
      ease: 'power3.out',
    });
    gsap.to(spriteMaterial, { opacity: 1, duration: 0.3 });
    if (fadeOutAfter) gsap.to(spriteMaterial, { opacity: 0, duration: 0.8, delay: fadeOutAfter / 1000 });
    return () => {
      spriteMaterial.opacity = 0;
    };
  }, [position, targetPosition, spriteMaterial, reducedMotion, fadeOutAfter]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    if (spriteRef.current) {
      const offset = hoverOffset.current
        .copy(normal)
        .multiplyScalar(Math.sin(clock.elapsedTime * 3) * 0.005);
      spriteRef.current.position.set(
        targetPosition[0] + offset.x,
        targetPosition[1] + offset.y,
        targetPosition[2] + offset.z
      );
    }
  });

  return (
    <sprite ref={spriteRef} material={spriteMaterial} scale={spriteScale} />
  );
}
