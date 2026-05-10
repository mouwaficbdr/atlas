'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

export default function GlobeOnboarding() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const clickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ne s'affiche que sur desktop
    if (isMobile) return;
    
    // Ne s'affiche qu'au tout premier chargement
    const hasSeen = sessionStorage.getItem('atlas_globe_onboarding');
    if (!hasSeen) {
      // Déclenchement peu après la fin du LoadingScreen (qui dure ~2.5s)
      const timer = setTimeout(() => {
        setShow(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  useEffect(() => {
    if (show && dragRef.current && clickRef.current) {
      const tl = gsap.timeline();
      
      // Setup initial
      gsap.set([dragRef.current, clickRef.current], { 
        y: '50%', 
        x: '-50%',
        opacity: 0, 
        filter: 'blur(10px)',
        scale: 0.95
      });

      // 1. Apparition de l'instruction de rotation
      tl.to(dragRef.current, {
        y: '0%',
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.2,
        ease: 'power3.out'
      })
      // Pause pour la lecture (augmentée de 1s)
      .to({}, { duration: 3.5 })
      // Disparition de l'instruction de rotation
      .to(dragRef.current, {
        y: '-50%',
        opacity: 0,
        filter: 'blur(10px)',
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.in'
      })
      
      // 2. Apparition de l'instruction de clic
      .to(clickRef.current, {
        y: '0%',
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
      }, "-=0.2") // Léger chevauchement
      // Pause pour la lecture (augmentée de 1s)
      .to({}, { duration: 4 })
      // Disparition de l'instruction de clic
      .to(clickRef.current, {
        y: '-50%',
        opacity: 0,
        filter: 'blur(10px)',
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('atlas_globe_onboarding', 'true');
          setShow(false);
        }
      });
    }
  }, [show]);

  if (!show) return null;

  const hintStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    bottom: '12vh',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    padding: '1rem 2rem',
    borderRadius: '40px',
    color: '#fff',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: '0.7rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
  };

  const iconStyle: React.CSSProperties = {
    color: 'var(--country-accent, #4A90D9)',
  };

  return (
    <div ref={containerRef} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50, // Au-dessus du canvas, sous les modales
      pointerEvents: 'none',
    }}>
      {/* Drag Hint */}
      <div ref={dragRef} style={hintStyle}>
        <div style={iconStyle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 9l-4 3 4 3"></path>
            <path d="M16 9l4 3-4 3"></path>
            <path d="M4 12h16"></path>
          </svg>
        </div>
        <span>Maintenez et glissez pour faire pivoter le globe</span>
      </div>

      {/* Click Hint */}
      <div ref={clickRef} style={hintStyle}>
        <div style={iconStyle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
          </svg>
        </div>
        <span>Sélectionnez un pays pour l'explorer</span>
      </div>
    </div>
  );
}
