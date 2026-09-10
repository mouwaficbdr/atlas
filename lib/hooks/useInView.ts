import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  /** Marge autour du viewport pour armer le montage en avance (défaut : 200px). */
  rootMargin?: string;
  /** Fraction visible requise pour déclencher (défaut : 0). */
  threshold?: number;
  /** Rester à true une fois l'élément vu, sans repasser à false (défaut : true). */
  once?: boolean;
}

/**
 * Indique si l'élément référencé est (ou a été) dans le viewport.
 *
 * Sert à ne monter les <Canvas> WebGL de section qu'au moment où ils
 * approchent l'écran, plutôt que de tous les instancier au montage de la
 * fiche pays (finding E1 / E2 : trop de contextes WebGL simultanés).
 */
export function useInView<T extends Element = HTMLDivElement>({
  rootMargin = '200px',
  threshold = 0,
  once = true,
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Repli sans IntersectionObserver : on monte tout de suite.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}
