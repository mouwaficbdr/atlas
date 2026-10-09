'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { filterCountries } from '@/lib/search-engine';
import type { CountryData, SearchResult } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

interface SearchPaletteProps {
  countries: CountryData[];
  onSelect: (cca3: string) => void;
}

export default function SearchPalette({
  countries,
  onSelect,
}: SearchPaletteProps) {
  const router = useRouter();
  const isOpen = useAppStore((state) => state.isSearchOpen);
  const setIsOpen = useAppStore((state) => state.setSearchOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus automatique à l'ouverture, quel que soit le déclencheur (balise
  // cliquée ou raccourci clavier).
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  // Cmd+K / Ctrl+K : raccourci global pour ouvrir la palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  // Filtrage instantané à chaque frappe
  useEffect(() => {
    if (query.trim()) {
      const filtered = filterCountries(query, countries);
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query, countries]);

  // Navigation clavier dans les résultats (Esc, ↑, ↓, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onSelect(results[selectedIndex].cca3);
      setIsOpen(false);
      setQuery('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="atlas-search"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Localiser un pays"
        className="atlas-search__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="atlas-search__eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          Localiser un pays
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Nom, capitale, région..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={
            results[selectedIndex] ? `sr-${results[selectedIndex].cca3}` : undefined
          }
          aria-autocomplete="list"
          className="atlas-search__input"
        />
        <div className="atlas-search__underline" aria-hidden="true" />

        <div
          id="search-results"
          role="listbox"
          aria-label="Résultats"
          className="atlas-search__results"
        >
          {results.length > 0 ? (
            results.map((result, idx) => (
              <div
                key={result.cca3}
                id={`sr-${result.cca3}`}
                role="option"
                aria-selected={idx === selectedIndex}
                className={`atlas-search__row${idx === selectedIndex ? ' atlas-search__row--active' : ''}`}
                onMouseEnter={() => {
                  setSelectedIndex(idx);
                  router.prefetch(`/pays/${result.cca3.toLowerCase()}`);
                }}
                onClick={() => {
                  onSelect(result.cca3);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <span className="atlas-search__marker" aria-hidden="true" />
                <Image
                  src={result.flagSvg}
                  alt=""
                  width={28}
                  height={18}
                  unoptimized
                  className="atlas-search__flag"
                />
                <span className="atlas-search__name">{result.name}</span>
                <span className="atlas-search__meta">
                  {result.region}
                  <span className="atlas-search__meta-sep">·</span>
                  {result.capital}
                </span>
              </div>
            ))
          ) : query.trim() ? (
            <div className="atlas-search__empty">
              Aucun résultat pour &quot;{query}&quot;
            </div>
          ) : (
            <div className="atlas-search__hint">
              193 États membres de l’ONU · tapez pour explorer
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .atlas-search {
          position: fixed;
          inset: 0;
          z-index: 9000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 16vh;
          background: rgba(5, 7, 14, 0.82);
          backdrop-filter: blur(8px);
          animation: atlas-search-fade 0.2s var(--ease-ui, ease) both;
        }
        .atlas-search__panel {
          width: 90%;
          max-width: 620px;
        }
        .atlas-search__eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.1rem;
          color: var(--text-accent, #4fc3f7);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .atlas-search__input {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 1.7rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          caret-color: var(--text-accent, #4fc3f7);
        }
        .atlas-search__input::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }
        .atlas-search__input:focus {
          outline: none;
        }
        .atlas-search__underline {
          position: relative;
          margin-top: 0.75rem;
          height: 1px;
          background: var(--border-subtle);
          overflow: hidden;
        }
        .atlas-search__underline::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, var(--text-accent, #4fc3f7), transparent);
          animation: atlas-search-scan 2.4s linear infinite;
        }
        .atlas-search__results {
          margin-top: 1.5rem;
          max-height: 50vh;
          overflow-y: auto;
        }
        .atlas-search__row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.7rem 0.25rem 0.7rem 1rem;
          cursor: pointer;
          border-radius: 4px;
        }
        .atlas-search__marker {
          position: absolute;
          left: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 0;
          background: var(--text-accent, #4fc3f7);
          box-shadow: 0 0 8px 1px rgba(79, 195, 247, 0.7);
          transition: height 0.15s var(--ease-ui, ease);
        }
        .atlas-search__row--active {
          background: rgba(79, 195, 247, 0.06);
        }
        .atlas-search__row--active .atlas-search__marker {
          height: 60%;
        }
        .atlas-search__row--active .atlas-search__name {
          color: var(--text-accent, #4fc3f7);
        }
        .atlas-search__flag {
          border-radius: 2px;
          flex-shrink: 0;
        }
        .atlas-search__name {
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 500;
          transition: color 0.15s var(--ease-ui, ease);
        }
        .atlas-search__meta {
          margin-left: auto;
          color: var(--text-muted);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .atlas-search__meta-sep {
          margin: 0 0.45rem;
          opacity: 0.5;
        }
        .atlas-search__empty,
        .atlas-search__hint {
          padding: 1.25rem 0.25rem;
          color: var(--text-muted);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @keyframes atlas-search-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes atlas-search-scan {
          from { transform: translateX(-120%); }
          to { transform: translateX(280%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .atlas-search { animation: none; }
          .atlas-search__underline::after { animation: none; }
        }
        @media (max-width: 640px) {
          .atlas-search__meta { display: none; }
        }
      ` }} />
    </div>
  );
}
