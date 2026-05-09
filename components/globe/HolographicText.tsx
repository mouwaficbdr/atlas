import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
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

export default function HolographicText({ text, latlng, color = '#ffffff' }: HolographicTextProps) {
  const textRef = useRef<any>(null);

  // Convert lat/lng to 3D position on the sphere
  const position = projectPoint(latlng[0], latlng[1], 1.02);
  
  // The normal vector at this position on the sphere is exactly the normalized position
  const normal = new THREE.Vector3(...position).normalize();

  useEffect(() => {
    if (textRef.current) {
      // Orient the text to face strictly OUTWARD from the sphere
      // The text's Z axis should point along the normal
      textRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal
      );

      // Animate entry (emerging from the surface)
      const targetPos = projectPoint(latlng[0], latlng[1], 1.08); // Float slightly above
      gsap.fromTo(
        textRef.current.position,
        { x: position[0], y: position[1], z: position[2] },
        { x: targetPos[0], y: targetPos[1], z: targetPos[2], duration: 0.8, ease: 'back.out(1.5)' }
      );
      
      // Animate opacity/glow
      gsap.fromTo(
        textRef.current.material,
        { opacity: 0 },
        { opacity: 1, duration: 0.4 }
      );
    }
  }, [latlng[0], latlng[1], text]);

  useFrame(({ clock }) => {
    if (textRef.current) {
      // Subtle hovering animation
      const basePos = projectPoint(latlng[0], latlng[1], 1.08);
      const hoverOffset = Math.sin(clock.elapsedTime * 3) * 0.01;
      const currentNormal = normal.clone().multiplyScalar(hoverOffset);
      textRef.current.position.set(
        basePos[0] + currentNormal.x,
        basePos[1] + currentNormal.y,
        basePos[2] + currentNormal.z
      );
    }
  });

  return (
    <Text
      ref={textRef}
      fontSize={0.06}
      color={color}
      anchorX="center"
      anchorY="middle"
      transparent
      opacity={0}
      outlineWidth={0.005}
      outlineColor="#000000"
    >
      {text.toUpperCase()}
      <meshBasicMaterial attach="material" color={color} toneMapped={false} />
    </Text>
  );
}
