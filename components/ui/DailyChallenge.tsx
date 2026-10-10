'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { CountryData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { KOPPEN } from '@/lib/koppen';
import { SITE_URL } from '@/lib/site-config';
import { MAX_GUESSES, clue, dailyCountry, dayKey, matchGuess, readGuesses, roundKm, saveGuesses, shareText } from '@/lib/daily';

const frDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Défi du jour (#31) : la caméra se pose sur un pays sans le nommer ; trois
 * essais, avec à chaque erreur la direction et la distance depuis la réponse
 * donnée, puis le climat, puis la capitale. Partie gardée sur l'appareil.
 */
export default function DailyChallenge({ countries }: { countries: CountryData[] }) {
  const introDone = useAppStore((s) => s.introPhase === 'done');
  const previewCca3 = useAppStore((s) => s.previewCca3);
  const setPreviewCca3 = useAppStore((s) => s.setPreviewCca3);
  const setChallenge = useAppStore((s) => s.setChallenge);
  const [day, setDay] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const today = dayKey(new Date());
    setDay(today);
    setGuesses(readGuesses(today));
    setChallenge(true);
    return () => setChallenge(false);
  }, [setChallenge]);

  const answer = useMemo(() => (day ? dailyCountry(countries, day) : null), [countries, day]);

  // Le globe se tourne vers le pays mystère et l'allume, sans le nommer.
  useEffect(() => {
    if (answer && introDone && previewCca3 !== answer.cca3) setPreviewCca3(answer.cca3);
  }, [answer, introDone, previewCca3, setPreviewCca3]);

  if (!day || !answer) return null;

  const tried = guesses.map((g) => countries.find((c) => c.cca3 === g)).filter(Boolean) as CountryData[];
  const won = guesses.includes(answer.cca3);
  const over = won || guesses.length >= MAX_GUESSES;
  const misses = tried.filter((g) => g.cca3 !== answer.cca3).length;
  const climate = answer.climate[0] ? KOPPEN[answer.climate[0].code]?.label : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const guess = matchGuess(input, countries);
    if (!guess) return setError('Pays inconnu : choisissez un nom de la liste.');
    if (guesses.includes(guess.cca3)) return setError('Déjà proposé.');
    const next = [...guesses, guess.cca3];
    setGuesses(next);
    saveGuesses(day, next);
    setInput('');
    setError('');
  };

  const share = async () => {
    const text = shareText(day, tried, answer, `${SITE_URL}/defi`);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      // Partage annulé : rien à faire.
    }
  };

  return (
    <section className="defi" aria-labelledby="defi-title">
      <p className="defi__kicker">Défi du jour · {frDay.format(new Date(`${day}T12:00:00Z`))}</p>
      <h1 id="defi-title" className="defi__title">
        {over ? (won ? `Trouvé : ${answer.nameFr}` : `C’était : ${answer.nameFr}`) : 'Quel est ce pays ?'}
      </h1>
      <p className="defi__lede">
        {over
          ? won
            ? `En ${guesses.length} essai${guesses.length > 1 ? 's' : ''} sur ${MAX_GUESSES}.`
            : 'Les trois essais sont passés ; un nouveau pays vous attend demain.'
          : `Le globe s’est posé sur lui. ${MAX_GUESSES - guesses.length} essai${MAX_GUESSES - guesses.length > 1 ? 's' : ''} restant${MAX_GUESSES - guesses.length > 1 ? 's' : ''}.`}
      </p>

      {tried.length > 0 && (
        <ol className="defi__guesses">
          {tried.map((g) => {
            if (g.cca3 === answer.cca3) {
              return (
                <li key={g.cca3} className="defi__guess defi__guess--ok">
                  <span>{g.nameFr}</span>
                  <span>trouvé</span>
                </li>
              );
            }
            const c = clue(g, answer);
            return (
              <li key={g.cca3} className="defi__guess">
                <span>{g.nameFr}</span>
                <span>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ transform: `rotate(${Math.round(c.bearing)}deg)` }}>
                    <path d="M12 3 L15 12 L12 10.4 L9 12 Z" fill="currentColor" />
                  </svg>
                  {roundKm(c.km)} km · {c.direction}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {!over && misses >= 1 && (
        <ul className="defi__hints">
          {climate && <li>Climat dominant : {climate}</li>}
          {misses >= 2 && <li>Capitale : {answer.capitalFr}</li>}
        </ul>
      )}

      {!over ? (
        <form className="defi__form" onSubmit={submit}>
          <input
            className="defi__input"
            list="defi-countries"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nom du pays"
            aria-label="Votre réponse"
            autoComplete="off"
          />
          <datalist id="defi-countries">
            {countries.map((c) => (
              <option key={c.cca3} value={c.nameFr} />
            ))}
          </datalist>
          <button type="submit" className="defi__btn defi__btn--accent">
            Proposer
          </button>
          {error && (
            <p className="defi__error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="defi__actions">
          <Link href={`/pays/${answer.cca3.toLowerCase()}`} className="defi__btn defi__btn--accent">
            Ouvrir la fiche
          </Link>
          <button type="button" className="defi__btn" onClick={share}>
            {copied ? 'Résultat copié' : 'Partager le résultat'}
          </button>
        </div>
      )}

      <Link href="/" className="defi__back">
        <span aria-hidden="true">←</span> Retour au globe
      </Link>

      <style dangerouslySetInnerHTML={{ __html: `
        .defi {
          position: fixed;
          z-index: 30;
          left: clamp(1rem, 4vw, 3rem);
          top: 50%;
          transform: translateY(-50%);
          width: min(26rem, calc(100vw - 2rem));
          padding: clamp(1.2rem, 3vw, 1.8rem);
          background: rgba(10, 10, 20, 0.86);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          color: var(--text-primary, #f0f0f0);
        }
        .defi__kicker { margin: 0; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: #ffd27a; }
        .defi__title { margin: 0.6rem 0 0.4rem; font-family: var(--font-bebas-neue), sans-serif; font-weight: 400; font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1; letter-spacing: 0.02em; }
        .defi__lede { margin: 0 0 1.2rem; line-height: 1.55; color: var(--text-secondary, rgba(255, 255, 255, 0.75)); }
        .defi__guesses { list-style: none; margin: 0 0 1rem; padding: 0; display: grid; gap: 1px; background: rgba(255, 255, 255, 0.08); }
        .defi__guess { display: flex; justify-content: space-between; gap: 1rem; padding: 0.6rem 0.8rem; background: #0a0a14; }
        .defi__guess span:last-child { display: inline-flex; align-items: center; gap: 0.4rem; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.75rem; color: #ffd27a; }
        .defi__guess--ok span:last-child { color: #7ee2a8; }
        .defi__hints { margin: 0 0 1rem; padding: 0 0 0 1rem; border-left: 2px solid #ffd27a; list-style: none; display: grid; gap: 0.3rem; font-size: 0.92rem; }
        .defi__form { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
        .defi__input { min-width: 0; padding: 0.7rem 0.8rem; font: inherit; color: inherit; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.18); }
        .defi__input:focus-visible { outline: 2px solid #ffd27a; outline-offset: 1px; }
        .defi__error { grid-column: 1 / -1; margin: 0; font-size: 0.85rem; color: #ff9b8a; }
        .defi__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .defi__btn { display: inline-flex; align-items: center; padding: 0.7rem 1rem; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; color: inherit; background: none; border: 1px solid rgba(255, 255, 255, 0.18); cursor: pointer; }
        .defi__btn--accent { color: #0a0a14; background: #ffd27a; border-color: #ffd27a; }
        .defi__back { display: inline-block; margin-top: 1.4rem; font-family: var(--font-jetbrains-mono), monospace; font-size: 0.72rem; letter-spacing: 0.1em; color: var(--text-muted, #8d95a3); text-decoration: none; }
        .defi__back:hover { color: var(--text-primary, #f0f0f0); }
        @media (max-width: 767px) {
          .defi { top: auto; bottom: 0; left: 0; right: 0; transform: none; width: auto; max-height: 62dvh; overflow: auto; border-width: 1px 0 0; }
        }
      ` }} />
    </section>
  );
}
