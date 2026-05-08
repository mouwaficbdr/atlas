'use client';

import { useRef } from 'react';
import Link from 'next/link';

interface NavigationProps {
  onSearchOpen: () => void;
}

export default function Navigation({ onSearchOpen }: NavigationProps) {
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '24px',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
      }}
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Logo / Home Link */}
      <Link
        href="/"
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'opacity 200ms ease-out',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
        }}
      >
        ATLAS°
      </Link>

      {/* Search Button */}
      <button
        ref={searchButtonRef}
        onClick={onSearchOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.backgroundColor = 'var(--bg-surface)';
          btn.style.borderColor = 'var(--border-default)';
          btn.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.backgroundColor = 'var(--bg-elevated)';
          btn.style.borderColor = 'var(--border-subtle)';
          btn.style.color = 'var(--text-muted)';
        }}
        aria-label="Ouvrir la palette de recherche (Cmd+K)"
        title="Cmd+K"
      >
        {/* Search Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>Rechercher</span>
        <kbd
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            marginLeft: '4px',
          }}
        >
          ⌘K
        </kbd>
      </button>
    </nav>
  );
}
