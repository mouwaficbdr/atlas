import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

/**
 * Register GSAP plugins.
 * Call this once at application startup (e.g. in RootLayout or a client component).
 * Safe to call multiple times — GSAP deduplicates registrations.
 */
export function registerGSAPPlugins(): void {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
}

export { gsap, ScrollTrigger, CustomEase };
