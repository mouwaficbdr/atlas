'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CountryData, GeoJSONFeature } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { clearLogbook } from '@/lib/logbook';
import { loadGeoJSON } from '@/lib/geojson-loader';
import { drawLogbookMap } from '@/lib/logbook-map';
import { logbookUrl } from '@/lib/share-urls';

const frDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const escales = (n: number) => `${n} escale${n > 1 ? 's' : ''}`;

/** Famille réelle d'une police next/font, lue sur sa variable CSS. */
const fontOf = (variable: string, fallback: string) =>
  getComputedStyle(document.body).getPropertyValue(variable).trim() || fallback;

/** Image du carnet à partager : planisphère des escales et leur nombre. */
async function logbookImage(features: GeoJSONFeature[], explored: Set<string>, total: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, 1200, 630);
  drawLogbookMap(ctx, features, explored, 60, 150, 1080, 540);
  const display = fontOf('--font-bebas-neue', 'sans-serif');
  const mono = fontOf('--font-jetbrains-mono', 'monospace');
  ctx.fillStyle = '#f0f0f0';
  ctx.font = `64px ${display}`;
  ctx.fillText('CARNET DE VOL', 60, 100);
  ctx.font = `22px ${mono}`;
  ctx.fillStyle = '#ffd27a';
  ctx.fillText(`${escales(explored.size)} sur ${total} pays`, 60, 134);
  ctx.fillStyle = '#8d95a3';
  ctx.textAlign = 'right';
  ctx.fillText('atlas.mouwaficbdr.me', 1140, 100);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new File([blob!], 'carnet-atlas.png', { type: 'image/png' });
}

/**
 * Carnet de vol (#30) : les escales enregistrées sur l'appareil, leur
 * planisphère, le partage en image et l'effacement. Pas de série, pas de
 * rappel.
 */
export default function Logbook({ countries }: { countries: CountryData[] }) {
  const isOpen = useAppStore((s) => s.isLogbookOpen);
  const setOpen = useAppStore((s) => s.setLogbookOpen);
  const logbook = useAppStore((s) => s.logbook);
  const setLogbook = useAppStore((s) => s.setLogbook);
  const [features, setFeatures] = useState<GeoJSONFeature[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const explored = new Set(logbook.map((s) => s.cca3));

  useEffect(() => {
    if (!isOpen) return;
    setConfirmClear(false);
    setLinkCopied(false);
    closeRef.current?.focus();
    loadGeoJSON()
      .then((geo) => setFeatures(geo.features))
      .catch(() => setFeatures([]));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !features) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLogbookMap(ctx, features, new Set(logbook.map((s) => s.cca3)), 0, 0, canvas.width, canvas.height);
  }, [features, logbook, isOpen]);

  if (!isOpen) return null;

  const share = async () => {
    if (!features) return;
    setSharing(true);
    try {
      const file = await logbookImage(features, explored, countries.length);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mon carnet de vol · atlas' });
      } else {
        const url = URL.createObjectURL(file);
        const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    } finally {
      setSharing(false);
    }
  };

  const stamps = [...logbook].reverse();

  return (
    <div className="logbook" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logbook-title"
        className="logbook__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="logbook__head">
          <div>
            <h2 id="logbook-title" className="logbook__title">Carnet de vol</h2>
            <p className="logbook__count">
              {escales(logbook.length)} sur {countries.length}
            </p>
          </div>
          <button ref={closeRef} type="button" className="logbook__close" onClick={() => setOpen(false)} aria-label="Fermer le carnet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <canvas ref={canvasRef} className="logbook__map" width={720} height={360} aria-hidden="true" />

        {stamps.length === 0 ? (
          <p className="logbook__empty">
            Aucune escale pour l’instant : une fiche lue jusqu’au bout laisse un tampon dans ce carnet, gardé sur cet
            appareil seulement.
          </p>
        ) : (
          <ol className="logbook__list">
            {stamps.map((s) => {
              const c = countries.find((x) => x.cca3 === s.cca3);
              if (!c) return null;
              return (
                <li key={s.cca3}>
                  <Link href={`/pays/${s.cca3.toLowerCase()}`} onClick={() => setOpen(false)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.flags.svg} alt="" width={22} height={15} />
                    <span>{c.nameFr}</span>
                    <time dateTime={s.at}>{frDate.format(new Date(s.at))}</time>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        <div className="logbook__actions">
          {logbook.length > 0 && (
            <button type="button" className="logbook__btn logbook__btn--accent" onClick={share} disabled={sharing || !features}>
              {sharing ? 'Préparation…' : 'Partager en image'}
            </button>
          )}
          {logbook.length > 0 && (
            <button
              type="button"
              className="logbook__btn"
              onClick={() =>
                navigator.clipboard
                  .writeText(logbookUrl(logbook.map((s) => s.cca3)))
                  .then(() => setLinkCopied(true))
                  .catch(() => {})
              }
            >
              {linkCopied ? 'Lien copié' : 'Copier le lien'}
            </button>
          )}
          {logbook.length > 0 &&
            (confirmClear ? (
              <button
                type="button"
                className="logbook__btn"
                onClick={() => {
                  setLogbook(clearLogbook());
                  setConfirmClear(false);
                }}
              >
                Confirmer l’effacement
              </button>
            ) : (
              <button type="button" className="logbook__btn" onClick={() => setConfirmClear(true)}>
                Effacer le carnet
              </button>
            ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .logbook {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(5, 5, 12, 0.6);
          backdrop-filter: blur(6px);
        }
        .logbook__panel {
          width: min(760px, 100%);
          max-height: calc(100dvh - 2rem);
          overflow: auto;
          padding: clamp(1.2rem, 3vw, 2rem);
          background: #0a0a14;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #f0f0f0);
        }
        .logbook__head { display: flex; justify-content: space-between; align-items: start; gap: 1rem; margin-bottom: 1.2rem; }
        .logbook__title { margin: 0; font-family: var(--font-bebas-neue), sans-serif; font-weight: 400; font-size: 2.4rem; letter-spacing: 0.02em; line-height: 1; }
        .logbook__count { margin: 0.4rem 0 0; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.75rem; letter-spacing: 0.1em; color: #ffd27a; }
        .logbook__close { width: 40px; height: 40px; display: grid; place-items: center; background: none; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 50%; color: inherit; cursor: pointer; }
        .logbook__map { display: block; width: 100%; height: auto; margin-bottom: 1.2rem; }
        .logbook__empty { margin: 0 0 1rem; line-height: 1.6; color: var(--text-secondary, rgba(255, 255, 255, 0.75)); }
        .logbook__list { list-style: none; margin: 0 0 1.2rem; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 1px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.08); }
        .logbook__list a { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.6rem; padding: 0.6rem 0.8rem; background: #0a0a14; color: inherit; text-decoration: none; }
        .logbook__list a:hover, .logbook__list a:focus-visible { background: rgba(255, 255, 255, 0.05); }
        .logbook__list img { border-radius: 2px; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12); }
        .logbook__list time { font-family: var(--font-jetbrains-mono), monospace; font-size: 0.7rem; color: var(--text-muted, #8d95a3); }
        .logbook__actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .logbook__btn { padding: 0.65rem 1rem; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: inherit; background: none; border: 1px solid rgba(255, 255, 255, 0.18); cursor: pointer; }
        .logbook__btn:hover, .logbook__btn:focus-visible { border-color: #ffd27a; }
        .logbook__btn--accent { color: #0a0a14; background: #ffd27a; border-color: #ffd27a; }
        .logbook__btn:disabled { opacity: 0.6; cursor: progress; }
      ` }} />
    </div>
  );
}
