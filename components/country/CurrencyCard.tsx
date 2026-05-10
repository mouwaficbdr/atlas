'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CurrencyCardProps {
  currencies: Record<string, { name: string; symbol: string }>;
}

function Coin() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1, 1, 0.1, 64]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

export default function CurrencyCard({ currencies }: CurrencyCardProps) {
  const entries = Object.entries(currencies);
  if (!entries.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
      {entries.map(([code, { name, symbol }]) => (
        <div key={code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Pièce 3D avec symbole en overlay HTML */}
          <div style={{ position: 'relative', width: '200px', height: '200px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
            <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <ambientLight intensity={1.5} />
              <directionalLight position={[2, 5, 2]} intensity={2.5} />
              <Coin />
              <perspectiveCamera position={[0, 0, 3.5]} />
            </Canvas>
            {/* Symbole monétaire en overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                fontSize: '3rem',
                fontFamily: 'var(--font-bebas-neue), sans-serif',
                color: '#8B6508',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {symbol || code}
            </div>
          </div>
          <div
            style={{
              color: 'rgba(0,0,0,0.85)',
              fontFamily: 'var(--font-bebas-neue), sans-serif',
              fontSize: 'clamp(2rem, 4vw, 5rem)',
              marginTop: '2rem',
              textAlign: 'center',
              textTransform: 'uppercase',
              lineHeight: 0.9,
            }}
          >
            {name}
          </div>
          <div
            style={{
              color: 'rgba(0,0,0,0.5)',
              fontSize: '1.5rem',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              marginTop: '0.5rem',
              letterSpacing: '0.1em',
            }}
          >
            {code}
          </div>
        </div>
      ))}
    </div>
  );
}
