'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

const STORAGE_KEY = 'atlas_onboarding_v2';
const START_DELAY_MS = 1200;
const DRAG_THRESHOLD_PX = 24;

type Step = 0 | 1 | 2;

const STEPS: Array<{ glyph: 'drag' | 'hover' | 'click'; text: string }> = [
  { glyph: 'drag', text: 'Glissez pour faire tourner la Terre, molette pour zoomer' },
  { glyph: 'hover', text: 'Survolez un pays pour le nommer' },
  { glyph: 'click', text: 'Cliquez pour l’explorer, ou cherchez-le via l’étoile en haut à droite (⌘K)' },
];

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Sans persistance, le guidage réapparaîtra à la prochaine visite.
  }
}

/**
 * Guidage progressif, sans boîte ni modale : une ligne d'annotation qui
 * attend la fin de l'approche de la caméra, puis passe d'elle-même à
 * l'étape suivante quand le geste est fait. Toujours sautable, vu une fois.
 */
export default function GlobeOnboarding() {
  const introPhase = useAppStore((state) => state.introPhase);
  const hoveredCountry = useAppStore((state) => state.hoveredCountryCca3);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    if (introPhase !== 'done') return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      // localStorage indisponible : on guide quand même.
    }
    const timer = setTimeout(() => setVisible(true), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [introPhase]);

  // Étape 1 : rotation (glisser), zoom (molette) ou flèches du clavier.
  useEffect(() => {
    if (!visible || step !== 0) return;
    let origin: { x: number; y: number } | null = null;
    const controller = new AbortController();
    const done = () => setStep(1);
    const opts = { passive: true, signal: controller.signal };

    window.addEventListener('pointerdown', (e) => (origin = { x: e.clientX, y: e.clientY }), opts);
    window.addEventListener(
      'pointermove',
      (e) => {
        if (origin && e.buttons === 1 && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > DRAG_THRESHOLD_PX) done();
      },
      opts,
    );
    window.addEventListener('wheel', done, opts);
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key.startsWith('Arrow')) done();
      },
      opts,
    );
    return () => controller.abort();
  }, [visible, step]);

  // Étape 2 : un pays survolé. La dernière étape suffit à marquer le
  // guidage comme vu : le clic emmène sur une fiche, qui démonte ce composant.
  useEffect(() => {
    if (step === 1 && hoveredCountry) setStep(2);
  }, [step, hoveredCountry]);

  useEffect(() => {
    if (step === 2) markSeen();
  }, [step]);

  const skip = () => {
    markSeen();
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="guide">
      <ol className="guide__steps" aria-hidden="true">
        {STEPS.map((_, i) => (
          <li key={i} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} />
        ))}
      </ol>

      <p key={step} className="guide__hint" role="status" aria-live="polite">
        <Glyph kind={current.glyph} />
        <span>{current.text}</span>
      </p>

      <button type="button" className="guide__skip" onClick={skip}>
        Passer
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .guide {
          position: fixed;
          left: 50%;
          bottom: max(18px, 2.6vh);
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 1.4rem;
          max-width: calc(100vw - 2rem);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(232, 240, 255, 0.86);
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.9);
          animation: guide-in 0.8s var(--ease-signature, ease) both;
          pointer-events: none;
        }
        .guide__steps {
          display: flex;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .guide__steps li {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          border: 1px solid rgba(232, 240, 255, 0.35);
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .guide__steps li.is-done {
          background: rgba(212, 175, 55, 0.85);
          border-color: rgba(212, 175, 55, 0.85);
        }
        .guide__steps li.is-current {
          background: var(--text-accent, #4fc3f7);
          border-color: var(--text-accent, #4fc3f7);
          box-shadow: 0 0 8px rgba(79, 195, 247, 0.8);
        }
        .guide__hint {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 0;
          animation: guide-step 0.6s var(--ease-signature, ease) both;
        }
        .guide__glyph {
          flex-shrink: 0;
          color: var(--text-accent, #4fc3f7);
          overflow: visible;
        }
        .guide__skip {
          pointer-events: auto;
          border: none;
          background: none;
          padding: 0.4rem 0;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          color: rgba(232, 240, 255, 0.4);
          cursor: pointer;
          transition: color 0.2s var(--ease-ui, ease);
        }
        .guide__skip:hover,
        .guide__skip:focus-visible {
          color: rgba(232, 240, 255, 0.9);
          outline: none;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .glyph-drag-dot { animation: glyph-drag 2.4s var(--ease-signature, ease) infinite; }
        .glyph-pulse { transform-origin: 9px 9px; animation: glyph-pulse 1.8s ease-in-out infinite; }
        .glyph-press { transform-origin: 9px 9px; animation: glyph-press 1.6s ease-in-out infinite; }
        @keyframes guide-in {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes guide-step {
          from { opacity: 0; transform: translateY(5px); filter: blur(3px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes glyph-drag {
          0%, 15% { transform: translateX(-5px); opacity: 0; }
          30% { opacity: 1; }
          75% { transform: translateX(5px); opacity: 1; }
          100% { transform: translateX(5px); opacity: 0; }
        }
        @keyframes glyph-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(0.82); opacity: 1; }
        }
        @keyframes glyph-press {
          0%, 60%, 100% { transform: scale(1); }
          70% { transform: scale(0.6); }
        }
        @media (prefers-reduced-motion: reduce) {
          .guide, .guide__hint { animation: none; }
          .glyph-drag-dot, .glyph-pulse, .glyph-press { animation: none; }
        }
        @media (max-width: 760px) {
          .guide { flex-wrap: wrap; justify-content: center; gap: 0.7rem; text-align: center; }
        }
      ` }} />
    </div>
  );
}

function Glyph({ kind }: { kind: 'drag' | 'hover' | 'click' }) {
  const reticle = 'M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4';
  return (
    <svg className="guide__glyph" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
      {kind === 'drag' && (
        <>
          <path d="M2 11c3-4 11-4 14 0" opacity="0.45" />
          <circle className="glyph-drag-dot" cx="9" cy="8" r="1.8" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'hover' && <path className="glyph-pulse" d={reticle} />}
      {kind === 'click' && (
        <>
          <path d={reticle} opacity="0.6" />
          <circle className="glyph-press" cx="9" cy="9" r="2.2" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
