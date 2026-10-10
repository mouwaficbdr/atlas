'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Liens de partage illustrés (#34) : la page porte l'aperçu (métadonnées et
 * image, lues par les robots qui n'exécutent pas de JavaScript) puis renvoie
 * le visiteur vers la vraie vue.
 */
export default function ClientRedirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}
