import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastsFor } from '../contrasts';
import { frName } from '../fr-names';
import type { CountryData } from '../types';

const all = (
  JSON.parse(readFileSync(join(process.cwd(), 'public/data/countries-geo.json'), 'utf8')) as {
    features: Array<{ properties: CountryData }>;
  }
).features.map((f) => f.properties);
const byCode = (cca3: string) => all.find((c) => c.cca3 === cca3)!;
const sentence = (c: { lead: string; otherText: string; tail: string }) => c.lead + c.otherText + c.tail;

describe('frName', () => {
  it.each([
    ['Russie', 'la Russie'],
    ['Inde', 'l’Inde'],
    ['Yémen', 'le Yémen'],
    ['Mexique', 'le Mexique'],
    ['États-Unis', 'les États-Unis'],
    ['Cuba', 'Cuba'],
    ['Hongrie', 'la Hongrie'],
    ['Îles Marshall', 'les îles Marshall'],
    ['Sierra Leone', 'la Sierra Leone'],
  ])('%s → %s', (name, expected) => expect(frName(name).text).toBe(expected));
});

describe('contrastsFor', () => {
  it('trouve le contraste du Bangladesh face à la Russie', () => {
    expect(sentence(contrastsFor(byCode('BGD'), all)[0])).toBe(
      'Le Bangladesh compte plus d’habitants que la Russie, sur une surface 116 fois plus petite.',
    );
  });

  it('ne compare jamais deux fois au même pays ni avec la même tournure', () => {
    for (const c of all) {
      const picked = contrastsFor(c, all);
      expect(new Set(picked.map((p) => p.other.cca3)).size).toBe(picked.length);
      expect(new Set(picked.map((p) => p.kind)).size).toBe(picked.length);
    }
  });
});
