'use client';

import { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface LenisProviderProps {
  children: ReactNode;
}

/**
 * Instance Lenis unique pour toute l'app, synchronisée avec gsap.ticker et
 * exposée à ScrollTrigger via scrollerProxy. Toute animation pilotée par
 * ScrollTrigger (ex: CountryCard) profite de ce scroll fluide sans avoir à
 * créer sa propre instance Lenis.
 */
export default function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    // Lenis désactivé sur mobile (scroll natif) et si l'utilisateur demande
    // une réduction des animations (le scroll fluide est du motion).
    if (window.innerWidth < 768 || prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    ScrollTrigger.scrollerProxy(window, {
      scrollTop(value) {
        if (arguments.length) lenis.scrollTo(value as number, { immediate: true });
        return lenis.actualScroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: 'transform',
    });

    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
