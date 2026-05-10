'use client';

import { useEffect, useRef, useState } from 'react';
import { filterCountries } from '@/lib/search-engine';
import type { CountryData, SearchResult } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { getPreferredWikiTitle, prefetchWikiSummary } from '@/lib/wiki-summary';

interface SearchPaletteProps {
  countries: CountryData[];
  onSelect: (cca3: string) => void;
}

export default function SearchPalette({
  countries,
  onSelect,
}: SearchPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K — raccourci global pour ouvrir la palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 9000,
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher un pays..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        />

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.length > 0 ? (
            results.map((result, idx) => (
              <div
                key={result.cca3}
                style={{
                  padding: '12px 16px',
                  backgroundColor:
                    idx === selectedIndex ? 'var(--bg-surface)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={() => {
                  router.prefetch(`/pays/${result.cca3.toLowerCase()}`);
                  const c = countries.find((cc) => cc.cca3 === result.cca3);
                  if (!c) return;
                  const title = getPreferredWikiTitle(c);
                  if (!title) return;
                  prefetchWikiSummary(title);
                }}
                onClick={() => {
                  onSelect(result.cca3);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <img
                  src={result.flagSvg}
                  alt={result.name}
                  width={32}
                  height={21}
                />
                <div>
                  <div
                    style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  >
                    {result.name}
                  </div>
                  <div
                    style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
                  >
                    {result.region}
                  </div>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div
              style={{
                padding: '16px',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Aucun résultat pour &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
