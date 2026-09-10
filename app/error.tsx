'use client';

import { useEffect } from 'react';
import OffMapScreen from '@/components/ui/OffMapScreen';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ATLAS] Erreur de rendu :', error);
  }, [error]);

  return (
    <OffMapScreen
      status="ERR"
      kicker="Relevé interrompu"
      headline="Signal perdu"
      message="Une erreur a interrompu le rendu de cette page. Relancez le relevé, ou revenez au globe si le problème persiste."
      onRetry={reset}
    />
  );
}
