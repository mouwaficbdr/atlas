'use client';

import { useState } from 'react';

interface ShareButtonProps {
  url: string;
}

export default function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const handleShare = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setShowFallback(true);
      }
    } else {
      setShowFallback(true);
    }
  };

  return (
    <div>
      <button
        onClick={handleShare}
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        {copied ? '✓ Lien copié !' : '🔗 Partager'}
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
