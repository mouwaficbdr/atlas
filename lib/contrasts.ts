import type { CountryData } from './types';
import { capitalize, frName } from './fr-names';

/**
 * Contrastes surprenants (#33) : comparaisons calculées uniquement sur la
 * population et la superficie vendorées, jamais de fait rédigé.
 */

export interface Contrast {
  kind: 'denser' | 'vaster' | 'twin';
  /** Texte avant le nom du pays comparé. */
  lead: string;
  /** Pays comparé, lié dans la fiche. */
  other: CountryData;
  /** Nom du pays comparé en contexte (« la Russie »). */
  otherText: string;
  /** Texte après. */
  tail: string;
}

const fr1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const fr0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
/** « 3,4 fois », « 116 fois ». */
const times = (r: number) => `${(r < 10 ? fr1 : fr0).format(r)} fois`;

// Comparer à des pays d'au moins un million d'habitants : un micro-État ne
// surprend personne.
const MIN_POPULATION = 1_000_000;
const MIN_RATIO = 3;

export function contrastsFor(country: CountryData, all: CountryData[], max = 2): Contrast[] {
  const me = frName(country.nameFr);
  const subject = capitalize(me.text);
  const pool = all.filter((c) => c.cca3 !== country.cca3 && c.population >= MIN_POPULATION && c.area > 0);
  const candidates: Array<Contrast & { score: number }> = [];

  // Plus d'habitants sur une surface bien plus petite.
  for (const o of pool) {
    const r = o.area / country.area;
    if (r >= MIN_RATIO && country.population > o.population) {
      candidates.push({
        kind: 'denser',
        score: Math.log(r),
        lead: `${subject} ${me.plural ? 'comptent' : 'compte'} plus d’habitants que `,
        other: o,
        otherText: frName(o.nameFr).text,
        tail: `, sur une surface ${times(r)} plus petite.`,
      });
    }
  }

  // Bien plus vaste, mais bien moins peuplé.
  for (const o of pool) {
    const ra = country.area / o.area;
    const rp = o.population / country.population;
    if (ra >= MIN_RATIO && rp >= MIN_RATIO) {
      const other = frName(o.nameFr);
      candidates.push({
        kind: 'vaster',
        score: Math.log(Math.min(ra, rp)),
        lead: `${subject} ${me.plural ? 'sont' : 'est'} ${times(ra)} plus vaste${me.plural ? 's' : ''} que `,
        other: o,
        otherText: other.text,
        tail: `, qui ${other.plural ? 'comptent' : 'compte'} pourtant ${times(rp)} plus d’habitants.`,
      });
    }
  }

  // Autant d'habitants, à 5 % près, sur une surface très différente.
  for (const o of pool) {
    const r = Math.max(o.area, country.area) / Math.min(o.area, country.area);
    if (Math.abs(country.population / o.population - 1) <= 0.05 && r >= 4) {
      candidates.push({
        kind: 'twin',
        score: Math.log(r) * 0.8,
        lead: 'Autant d’habitants que ',
        other: o,
        otherText: frName(o.nameFr).text,
        tail: `, sur une surface ${times(r)} plus ${country.area > o.area ? 'grande' : 'petite'}.`,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const picked: Contrast[] = [];
  for (const c of candidates) {
    if (picked.length === max) break;
    if (picked.some((p) => p.other.cca3 === c.other.cca3 || p.kind === c.kind)) continue;
    picked.push(c);
  }
  return picked;
}
