'use client';

import { useRef } from 'react';
import { View, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CurrencyCardProps {
  currencies: Record<string, { name: string; symbol: string }>;
}

function Coin({ symbol }: { symbol: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      {/* Pièce très fine */}
      <cylinderGeometry args={[1, 1, 0.1, 32]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
      {/* Symbole au recto */}
      <Text
        position={[0, 0.051, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1}
        color="#8B6508"
        font="https://fonts.gstatic.com/s/bebasneue/v9/JTUSjIg69CK48gW7PXoo9Wlhyw.woff"
      >
        {symbol}
      </Text>
      {/* Symbole au verso */}
      <Text
        position={[0, -0.051, 0]}
        rotation={[Math.PI / 2, Math.PI, 0]}
        fontSize={1}
        color="#8B6508"
        font="https://fonts.gstatic.com/s/bebasneue/v9/JTUSjIg69CK48gW7PXoo9Wlhyw.woff"
      >
        {symbol}
      </Text>
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
          <div style={{ position: 'relative', width: '200px', height: '200px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
            <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <ambientLight intensity={1.5} />
              <directionalLight position={[2, 5, 2]} intensity={2.5} />
              <Coin symbol={symbol || code} />
              <perspectiveCamera position={[0, 0, 3.5]} />
            </View>
          </div>
          <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-bebas-neue), sans-serif', fontSize: 'clamp(2rem, 4vw, 5rem)', marginTop: '2rem', textAlign: 'center', textTransform: 'uppercase', lineHeight: 0.9 }}>
            {name}
          </div>
          <div style={{ color: 'var(--text-accent)', fontSize: '1.5rem', fontFamily: 'var(--font-jetbrains-mono), monospace', marginTop: '0.5rem', opacity: 0.8 }}>
            {code}
          </div>
        </div>
      ))}
    </div>
  );
}
