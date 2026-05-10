import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface HolographicTextProps {
  text: string;
  latlng: [number, number]; // [lat, lon]
  color?: string;
}

const projectPoint = (lat: number, lon: number, r: number = 1.05): [number, number, number] => {
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

export default function HolographicText({ text, latlng, color = '#ffffff' }: HolographicTextProps) {
  const spriteRef = useRef<THREE.Sprite>(null);

  const position = useMemo(() => projectPoint(latlng[0], latlng[1], 1.02), [latlng]);
  const normal = useMemo(() => new THREE.Vector3(...position).normalize(), [position]);

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

  useEffect(() => {
    if (spriteRef.current) {
      const lat = latlng[0];
      const lon = latlng[1];
      const targetPos = projectPoint(lat, lon, 1.12);
      spriteRef.current.position.set(position[0], position[1], position[2]);

      gsap.to(spriteRef.current.position, {
        x: targetPos[0],
        y: targetPos[1],
        z: targetPos[2],
        duration: 0.8,
        ease: 'back.out(1.5)',
      });

      gsap.to(spriteMaterial, {
        opacity: 1,
        duration: 0.4,
      });
    }
    return () => {
      spriteMaterial.opacity = 0;
    };
  }, [latlng, position, spriteMaterial, text]);

  useFrame(({ clock }) => {
    if (spriteRef.current) {
      const basePos = projectPoint(latlng[0], latlng[1], 1.12);
      const hoverOffset = Math.sin(clock.elapsedTime * 3) * 0.005;
      const offsetVec = normal.clone().multiplyScalar(hoverOffset);
      spriteRef.current.position.set(
        basePos[0] + offsetVec.x,
        basePos[1] + offsetVec.y,
        basePos[2] + offsetVec.z
      );
    }
  });

  return (
    <sprite ref={spriteRef} material={spriteMaterial} scale={spriteScale} />
  );
}
