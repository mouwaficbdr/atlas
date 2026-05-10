'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

export default function GithubBadge() {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLAnchorElement>(null);
  const magneticRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Rotation infinie de l'anneau typographique
  useEffect(() => {
    if (isMobile || !ringRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(ringRef.current, {
        rotation: 360,
        duration: 25,
        repeat: -1,
        ease: 'none',
      });
    });
    return () => ctx.revert();
  }, [isMobile]);

  // Mécanique du Gravity Well
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !containerRef.current || !magneticRef.current || !logoRef.current) return;
    
    const { clientX, clientY } = e;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Distance de la souris par rapport au centre de la Hitbox
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Force d'attraction. 
    // 0.6 = le bouton se déplace de 60% vers le curseur.
    const pull = 0.5;

    // Déplacement de la "masse" principale
    gsap.to(magneticRef.current, {
      x: distanceX * pull,
      y: distanceY * pull,
      duration: 0.6,
      ease: 'power3.out',
    });

    // Effet de parallaxe interne fort sur le logo (effet de profondeur/viscosité)
    gsap.to(logoRef.current, {
      x: distanceX * 0.2,
      y: distanceY * 0.2,
      duration: 0.5,
      ease: 'power3.out',
    });
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    
    // Le trou noir s'active
    gsap.to(ringRef.current, {
      scale: 1.15,
      duration: 0.6,
      ease: 'power3.out'
    });
    
    gsap.to(magneticRef.current, {
      scale: 1.2,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      duration: 0.4,
      ease: 'power3.out'
    });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    
    // Retour élastique au centre
    gsap.to(magneticRef.current, {
      x: 0,
      y: 0,
      scale: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      duration: 1.2,
      ease: 'elastic.out(1, 0.3)'
    });

    gsap.to(logoRef.current, {
      x: 0,
      y: 0,
      duration: 1,
      ease: 'elastic.out(1, 0.3)'
    });

    // L'anneau se rétracte
    gsap.to(ringRef.current, {
      scale: 1,
      duration: 0.8,
      ease: 'power3.out'
    });
  };

  if (isMobile) {
    // Fallback simple pour mobile (un badge natif propre)
    return (
      <a
        href="https://github.com/mouwaficbdr/atlas"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          color: '#fff'
        }}
      >
        <GithubIcon />
      </a>
    );
  }

  return (
    <a
      ref={containerRef}
      href="https://github.com/mouwaficbdr/atlas"
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '240px', // Hitbox massive de 240x240px
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
        textDecoration: 'none',
        color: '#fff',
        cursor: 'none', // Le pointeur est caché, happé par la gravité
      }}
    >
      {/* Anneau SVG Typographique Rotatif */}
      <svg
        ref={ringRef}
        viewBox="0 0 200 200"
        style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          opacity: isHovered ? 0.9 : 0.3,
          pointerEvents: 'none',
          transition: 'opacity 0.4s ease',
        }}
      >
        <path
          id="textPath"
          d="M 100, 100 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0"
          fill="none"
        />
        <text
          fill="currentColor"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '14.5px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          <textPath href="#textPath" startOffset="0%">
            • OPEN SOURCE • GITHUB REPOSITORY 
          </textPath>
        </text>
      </svg>

      {/* Cœur du Trou Noir (Logo) */}
      <div
        ref={magneticRef}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          pointerEvents: 'none', // La hitbox gère l'event
        }}
      >
        <div ref={logoRef}>
          <GithubIcon />
        </div>
      </div>
    </a>
  );
}

function GithubIcon() {
  return (
    <svg
      height="26"
      viewBox="0 0 16 16"
      version="1.1"
      width="26"
      fill="currentColor"
    >
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27-.01-1.13-.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
    </svg>
  );
}
