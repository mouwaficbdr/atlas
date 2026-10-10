'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { LoadingState } from '@/lib/types';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useAppStore } from '@/lib/store';
import { INTRO_DISTANCE, sphereScreenDiameter } from '@/lib/globe/intro';

interface LoadingScreenProps {
  loadingState: LoadingState;
  onRevealComplete: () => void;
}

const DOT_SIZE = 6;
const ORBIT_RADIUS = 58;
const ORBIT_CIRCUMFERENCE = 2 * Math.PI * ORBIT_RADIUS;

// Étapes réelles du chargement (voir PersistentLayout et GlobeScene).
function stepLabel(progress: number): string {
  if (progress < 45) return 'Relevé des frontières';
  if (progress < 70) return "Calcul de l'orbite";
  if (progress < 100) return 'Acquisition des images satellite';
  return 'Approche';
}

/**
 * « Pale Blue Dot » : la Terre n'est d'abord qu'un point bleu pâle, une
 * orbite se trace au rythme du vrai chargement. À la révélation, le voile
 * s'efface sur la vraie Terre WebGL, encore minuscule au loin, et la caméra
 * s'en approche (voir CameraTransition et lib/globe/intro.ts).
 */
export default function LoadingScreen({ loadingState, onRevealComplete }: LoadingScreenProps) {
  const reducedMotion = useReducedMotion();
  const setIntroPhase = useAppStore((state) => state.setIntroPhase);
  const rootRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onRevealComplete);
  onCompleteRef.current = onRevealComplete;
  const shouldReveal = loadingState.phase === 'revealing' && loadingState.minDurationElapsed;

  useEffect(() => {
    if (!shouldReveal) return;
    const done = () => onCompleteRef.current();

    if (reducedMotion) {
      setIntroPhase('done');
      const tween = gsap.to(rootRef.current, { opacity: 0, duration: 0.35, onComplete: done });
      return () => {
        tween.kill();
      };
    }

    // L'orbite se referme (transition CSS) ; le point grossit jusqu'à la
    // taille exacte de la vraie Terre vue de loin, puis le voile s'efface et
    // la caméra prend le relais.
    const earthPx = sphereScreenDiameter(INTRO_DISTANCE, window.innerHeight);
    const tl = gsap.timeline({ onComplete: done, delay: 0.35 });
    tl.to([hudRef.current, captionRef.current], { opacity: 0, scale: 1.2, duration: 0.45, ease: 'power2.in' }, 0)
      .to(sparkRef.current, { scale: earthPx / DOT_SIZE, duration: 0.5, ease: 'power2.inOut' }, 0.15)
      .call(() => setIntroPhase('flying'), [], 0.5)
      .to(rootRef.current, { backgroundColor: 'rgba(10, 10, 20, 0)', duration: 0.5, ease: 'power1.out' }, 0.5)
      .to(sparkRef.current, { opacity: 0, duration: 0.35, ease: 'power1.out' }, 0.6);
    return () => {
      tl.kill();
    };
  }, [shouldReveal, reducedMotion, setIntroPhase]);

  if (loadingState.phase === 'complete') return null;

  const progress = Math.min(100, Math.max(0, loadingState.progress));
  const label = stepLabel(progress);

  return (
    <div
      ref={rootRef}
      className="pbd"
      role="progressbar"
      aria-label="Chargement du globe"
      aria-valuetext={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      style={{ pointerEvents: shouldReveal ? 'none' : 'auto' }}
    >
      <div ref={sparkRef} aria-hidden="true">
        <div className="pbd__spark" />
      </div>

      <div ref={hudRef} className="pbd__hud" aria-hidden="true">
        <svg className="pbd__orbit" viewBox="-70 -70 140 140" width="140" height="140">
          <circle r={ORBIT_RADIUS} className="pbd__track" />
          <circle
            r={ORBIT_RADIUS}
            className="pbd__arc"
            strokeDasharray={ORBIT_CIRCUMFERENCE}
            strokeDashoffset={ORBIT_CIRCUMFERENCE * (1 - progress / 100)}
          />
          <g className="pbd__sat" style={{ transform: `rotate(${(progress / 100) * 360}deg)` }}>
            <circle cx={0} cy={-ORBIT_RADIUS} r={1.8} />
          </g>
        </svg>
      </div>

      <div ref={captionRef} className="pbd__caption">
        <span className="pbd__mark">atlas</span>
        <span key={label} className="pbd__step">
          {label}
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pbd {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          background-color: rgb(10, 10, 20);
          overflow: hidden;
        }
        .pbd > * {
          grid-area: 1 / 1;
        }
        .pbd__spark {
          width: ${DOT_SIZE}px;
          height: ${DOT_SIZE}px;
          border-radius: 50%;
          background: #eef9ff;
          box-shadow: 0 0 6px 1px rgba(140, 210, 255, 0.95), 0 0 22px 4px rgba(79, 195, 247, 0.35);
          animation: pbd-breathe 2.8s ease-in-out infinite;
        }
        .pbd__hud {
          width: 140px;
          height: 140px;
        }
        .pbd__orbit {
          overflow: visible;
          transform: rotate(-90deg);
        }
        .pbd__track {
          fill: none;
          stroke: rgba(255, 255, 255, 0.07);
          stroke-width: 1;
        }
        .pbd__arc {
          fill: none;
          stroke: var(--text-accent, #4fc3f7);
          stroke-width: 1.2;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.8s var(--ease-signature, ease);
        }
        .pbd__sat {
          transition: transform 0.8s var(--ease-signature, ease);
        }
        .pbd__sat circle {
          fill: #e9f7ff;
          filter: drop-shadow(0 0 3px rgba(79, 195, 247, 0.9));
        }
        .pbd__caption {
          align-self: center;
          margin-top: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.7rem;
          white-space: nowrap;
        }
        .pbd__mark {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.95rem;
          letter-spacing: 0.42em;
          margin-right: -0.42em;
          color: var(--text-primary);
          opacity: 0.9;
        }
        .pbd__step {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--text-muted);
          animation: pbd-step 0.5s var(--ease-ui, ease) both;
        }
        @keyframes pbd-breathe {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes pbd-step {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pbd__spark, .pbd__step { animation: none; }
          .pbd__arc, .pbd__sat { transition: none; }
        }
      ` }} />
    </div>
  );
}
