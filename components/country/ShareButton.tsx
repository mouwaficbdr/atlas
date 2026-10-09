'use client';

import { useEffect, useState } from 'react';

interface ShareButtonProps {
  url: string;
  title?: string;
  /** Variante discrète (mini-en-tête mobile). */
  compact?: boolean;
}

export default function ShareButton({ url, title = 'atlas', compact = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Détecté après montage : navigator.share n'existe pas au rendu serveur et
  // varie selon l'appareil, on évite ainsi tout écart d'hydratation.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (err) {
        // L'utilisateur a fermé la feuille de partage : ce n'est pas une erreur.
        if (err instanceof Error && err.name === 'AbortError') return;
        // Autre échec : on bascule sur le presse-papiers.
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        setShowFallback(true);
        return;
      }
    }

    setShowFallback(true);
  };

  const label = canNativeShare
    ? 'Partager'
    : copied
      ? 'Lien copié'
      : 'Copier le lien';

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        className={compact ? 'share share--compact' : 'share'}
        data-copied={copied}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
        </svg>
        <span aria-live="polite">{label}</span>
      </button>
      <style dangerouslySetInnerHTML={{ __html: `
        .share {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          min-height: 44px;
          padding: 0.7rem 1.2rem;
          background: none;
          border: 1px solid var(--cp-line, rgba(255,255,255,0.15));
          border-radius: 99px;
          color: var(--text-primary);
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.3s var(--ease-ui), background 0.3s var(--ease-ui);
        }
        .share:hover { border-color: var(--country-primary, #fff); background: rgba(255,255,255,0.04); }
        .share[data-copied='true'] { color: var(--country-primary, #4fc3f7); }
        .share--compact { padding: 0.5rem 0.8rem; font-size: 0.62rem; }
      ` }} />
      {showFallback && (
        <input
          type="text"
          readOnly
          value={url}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.85rem',
          }}
        />
      )}
    </div>
  );
}
