/**
 * Inclinaison du téléphone (#28) : décalages lissés dans [-1, 1], lus à
 * chaque image par le globe sans provoquer de rendu React. La position du
 * téléphone à l'activation sert de neutre.
 */

export const tilt = { x: 0, y: 0, active: false };

const RANGE_DEG = 25;
let neutral: { beta: number; gamma: number } | null = null;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function onOrientation(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return;
  neutral ??= { beta: e.beta, gamma: e.gamma };
  tilt.x = clamp((e.gamma - neutral.gamma) / RANGE_DEG);
  tilt.y = clamp((e.beta - neutral.beta) / RANGE_DEG);
}

type WithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

/** À appeler depuis un geste de l'utilisateur (exigence d'iOS). */
export async function enableTilt(): Promise<boolean> {
  if (typeof DeviceOrientationEvent === 'undefined') return false;
  const request = (DeviceOrientationEvent as WithPermission).requestPermission;
  if (request) {
    try {
      if ((await request()) !== 'granted') return false;
    } catch {
      return false;
    }
  }
  neutral = null;
  window.addEventListener('deviceorientation', onOrientation);
  tilt.active = true;
  return true;
}

export function disableTilt() {
  window.removeEventListener('deviceorientation', onOrientation);
  tilt.active = false;
  tilt.x = 0;
  tilt.y = 0;
}
