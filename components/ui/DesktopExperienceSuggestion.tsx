'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

export default function DesktopExperienceSuggestion() {
  const isMobile = useIsMobile();
  const [show, setShow] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile) return;

    // Use sessionStorage so it only shows once per session
    const hasSeen = sessionStorage.getItem('atlas_desktop_suggested');
    if (!hasSeen) {
      // Delay to let the initial loading screen complete
      const timer = setTimeout(() => {
        setShow(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  useEffect(() => {
    if (show && overlayRef.current && contentRef.current) {
      // Entrance Animation
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0, backdropFilter: 'blur(0px)' },
        { opacity: 1, backdropFilter: 'blur(15px)', duration: 1.2, ease: 'power2.out' }
      );

      gsap.fromTo(
        contentRef.current,
        { y: 60, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, delay: 0.3, ease: 'power3.out' }
      );
    }
  }, [show]);

  const handleDismiss = () => {
    if (overlayRef.current && contentRef.current) {
      gsap.to(contentRef.current, {
        y: 30, opacity: 0, scale: 0.9, duration: 0.5, ease: 'power2.in'
      });
      gsap.to(overlayRef.current, {
        opacity: 0, backdropFilter: 'blur(0px)', duration: 0.6, delay: 0.2, ease: 'power2.in',
        onComplete: () => {
          sessionStorage.setItem('atlas_desktop_suggested', 'true');
          setShow(false);
        }
      });
    }
  };

  if (!show) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999, // Above everything
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 5, 10, 0.75)',
        padding: '2rem',
      }}
    >
      <div
        ref={contentRef}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.03)',
        }}
      >
        <div style={{ marginBottom: '2rem', color: '#fff', opacity: 0.8 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          fontSize: '2.5rem',
          lineHeight: 1,
          letterSpacing: '0.05em',
          color: '#fff',
          marginBottom: '1rem',
          textTransform: 'uppercase'
        }}>
          L&apos;Expérience<br />Complète
        </h2>

        <p style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: '0.75rem',
          lineHeight: 1.7,
          color: 'var(--text-muted)',
          marginBottom: '2.5rem',
          opacity: 0.8
        }}>
          Pour profiter pleinement de l&apos;immersion 3D et des interactions visuelles d&apos;ATLAS°, nous vous recommandons de visiter ce site sur un écran d&apos;ordinateur.
        </p>

        <button
          onClick={handleDismiss}
          style={{
            background: 'var(--country-accent, #fff)',
            color: '#000',
            border: 'none',
            padding: '1rem 2rem',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            borderRadius: '2rem',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'var(--country-accent, #fff)';
          }}
        >
          Continuer sur mobile
        </button>
      </div>
    </div>
  );
}
