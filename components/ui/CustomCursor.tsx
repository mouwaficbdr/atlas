/**
 * CustomCursor — Curseur personnalisé animé via GSAP
 * Exigences : 10.1, 10.2, 10.3, 10.4, 10.5
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Détection desktop (pointer: fine)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsDesktop(mediaQuery.matches && navigator.maxTouchPoints === 0);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches && navigator.maxTouchPoints === 0);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isDesktop || !cursorRef.current) return;

    // Masquer le curseur natif
    document.body.style.cursor = 'none';

    const cursor = cursorRef.current;
    const quickSetter = gsap.quickSetter(cursor, 'css');

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      quickSetter({
        left: `${mouseX}px`,
        top: `${mouseY}px`,
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: '2px solid var(--text-accent)',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.2s, height 0.2s',
      }}
    />
  );
}
