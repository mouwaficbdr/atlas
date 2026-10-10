import { describe, it, expect, beforeEach } from 'vitest';
import { clearLogbook, readLogbook, stamp } from '../logbook';

// localStorage minimal pour l'environnement node.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
} as Storage;

describe('carnet de vol', () => {
  beforeEach(() => store.clear());

  it('enregistre une escale une seule fois, avec sa première date', () => {
    const first = stamp(readLogbook(), 'BEN', new Date('2026-10-01T10:00:00Z'));
    const again = stamp(readLogbook(), 'BEN', new Date('2026-10-05T10:00:00Z'));
    expect(again).toEqual(first);
    expect(readLogbook()).toEqual([{ cca3: 'BEN', at: '2026-10-01T10:00:00.000Z' }]);
  });

  it('s’efface et résiste à un stockage corrompu', () => {
    stamp(readLogbook(), 'FRA');
    expect(clearLogbook()).toEqual([]);
    store.set('atlas.carnet', '{oups');
    expect(readLogbook()).toEqual([]);
  });
});
