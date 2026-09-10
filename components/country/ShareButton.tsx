'use client';

import { useEffect, useState } from 'react';

interface ShareButtonProps {
  url: string;
  title?: string;
}

export default function ShareButton({ url, title = 'ATLAS°' }: ShareButtonProps) {
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
        onClick={handleShare}
        style={{
          background: 'none',
          color: 'var(--country-accent, #fff)',
          border: 'none',
          borderBottom: '2px solid var(--country-accent, #fff)',
          padding: '0 0 5px 0',
          cursor: 'pointer',
          fontFamily: 'var(--font-bebas-neue), sans-serif',
          fontSize: '3rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: 1,
          opacity: copied ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = copied ? '0.5' : '1')}
      >
        {label}
      </button>
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
