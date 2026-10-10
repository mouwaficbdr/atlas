'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { readLogbook, stamp } from '@/lib/logbook';
import { useAppStore } from '@/lib/store';

const frDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Tampon du carnet de vol (#30) : arrivé au sol, la fiche s'imprime dans le
 * carnet (« Escale enregistrée »), une vraie fin de visite. Une escale déjà
 * faite rappelle simplement sa date.
 */
export default function FlightStamp({ cca3 }: { cca3: string }) {
  const setLogbook = useAppStore((s) => s.setLogbook);
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '0px', threshold: 0.6 });
  const [state, setState] = useState<{ fresh: boolean; at: string } | null>(null);

  useEffect(() => {
    if (!inView) return;
    const before = readLogbook();
    const known = before.find((s) => s.cca3 === cca3);
    const after = stamp(before, cca3);
    setLogbook(after);
    setState({ fresh: !known, at: (known ?? after[after.length - 1]).at });
  }, [inView, cca3, setLogbook]);

  return (
    <div ref={ref} className="stamp-slot">
      {state && (
        <p className="stamp" data-fresh={state.fresh}>
          <span className="stamp__title">{state.fresh ? 'Escale enregistrée' : 'Escale du carnet'}</span>
          <span className="stamp__meta">
            {cca3} · {frDate.format(new Date(state.at))}
          </span>
        </p>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .stamp-slot { min-height: 5.5rem; margin-top: 2.5rem; }
        .stamp {
          display: inline-grid;
          gap: 0.3rem;
          margin: 0;
          padding: 0.7rem 1.1rem;
          border: 2px solid #ffd27a;
          outline: 1px solid rgba(255, 210, 122, 0.5);
          outline-offset: 3px;
          border-radius: 4px;
          color: #ffd27a;
          font-family: var(--font-jetbrains-mono), monospace;
          text-transform: uppercase;
          transform: rotate(-6deg);
        }
        .stamp__title { font-size: 0.85rem; letter-spacing: 0.22em; }
        .stamp__meta { font-size: 0.7rem; letter-spacing: 0.14em; opacity: 0.8; }
        .stamp[data-fresh='true'] { animation: stamp-print 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
        @keyframes stamp-print {
          0% { opacity: 0; transform: rotate(-14deg) scale(1.6); }
          60% { opacity: 1; transform: rotate(-5deg) scale(0.96); }
          100% { transform: rotate(-6deg) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) { .stamp[data-fresh='true'] { animation: none; } }
      ` }} />
    </div>
  );
}
