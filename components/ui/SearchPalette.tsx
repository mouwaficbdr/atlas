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
        role="dialog"
        aria-modal="true"
        aria-label="Recherche de pays"
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
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={
            results[selectedIndex] ? `sr-${results[selectedIndex].cca3}` : undefined
          }
          aria-autocomplete="list"
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        />

        <div
          id="search-results"
          role="listbox"
          aria-label="Résultats"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {results.length > 0 ? (
            results.map((result, idx) => (
              <div
                key={result.cca3}
                id={`sr-${result.cca3}`}
                role="option"
                aria-selected={idx === selectedIndex}
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
                }}
                onClick={() => {
                  onSelect(result.cca3);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <Image
                  src={result.flagSvg}
                  alt={result.name}
                  width={32}
                  height={21}
                  unoptimized
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
