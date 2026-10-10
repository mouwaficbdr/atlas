'use client';

import { useEffect, useRef, useState } from 'react';
import ShareButton from './ShareButton';
import { useAppStore } from '@/lib/store';

export interface DescentStage {
  id: string;
  label: string;
}

interface DescentRailProps {
  stages: DescentStage[];
  countryName: string;
  shareUrl: string;
}

// Orbite basse (station spatiale) jusqu'au sol, en courbe : on perd vite de
// l'altitude au début, on se pose doucement à la fin.
const ORBIT_KM = 408;
const fr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const altitudeAt = (p: number) => ORBIT_KM * (1 - p) ** 3;
const formatAltitude = (km: number) => (km >= 1 ? `${fr.format(km)} km` : `${fr.format(km * 1000)} m`);

/**
 * Sommaire de la descente : rail à gauche avec altimètre sur grand écran,
 * mini-en-tête collant (nom et partage) sur mobile, une fois le titre passé.
 */
export default function DescentRail({ stages, countryName, shareUrl }: DescentRailProps) {
  const [current, setCurrent] = useState(stages[0]?.id);
  const [pastHero, setPastHero] = useState(false);
  const [landed, setLanded] = useState(false);
  const altRef = useRef<HTMLElement>(null);

  // La section courante pilote la caméra (#21) : l'altimètre devient vrai.
  const setDescentStage = useAppStore((s) => s.setDescentStage);
  useEffect(() => {
    setDescentStage(current ?? null);
  }, [current, setDescentStage]);
  useEffect(() => () => setDescentStage(null), [setDescentStage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
          if (entry.target.id === stages[0]?.id) setPastHero(!entry.isIntersecting);
        }
      },
      // Une section devient courante quand elle franchit le milieu de l'écran.
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const { id } of stages) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    // Au sol (pied de page), le rail s'efface.
    const end = document.getElementById('fin');
    const endObserver = new IntersectionObserver(([entry]) => setLanded(entry.isIntersecting));
    if (end) endObserver.observe(end);
    return () => {
      observer.disconnect();
      endObserver.disconnect();
    };
  }, [stages]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (altRef.current) altRef.current.textContent = formatAltitude(altitudeAt(p));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <nav className="cp-rail" aria-label="Sommaire de la fiche" data-landed={landed}>
        <p className="cp-rail__alt" aria-hidden="true">
          Altitude
          <strong ref={altRef}>{formatAltitude(ORBIT_KM)}</strong>
        </p>
        <ol>
          {stages.map((stage) => (
            <li key={stage.id}>
              <a href={`#${stage.id}`} aria-current={current === stage.id}>
                {stage.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="cp-minibar" data-visible={pastHero} aria-hidden={!pastHero}>
        <a href={`#${stages[0]?.id}`} className="cp-minibar__name" tabIndex={pastHero ? 0 : -1}>
          {countryName}
        </a>
        <ShareButton url={shareUrl} title={`${countryName} · atlas`} compact />
      </div>
    </>
  );
}
