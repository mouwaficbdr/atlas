/**
 * Noms de pays en contexte de phrase : « la Russie », « l'Inde », « les
 * Pays-Bas », « Cuba ». Le genre suit la finale du premier mot (-e : féminin)
 * sauf exceptions listées ; les îles et cités-États sans article aussi.
 */

const NO_ARTICLE = new Set([
  'Antigua-et-Barbuda', 'Bahreïn', 'Chypre', 'Cuba', 'Djibouti', 'Haïti', 'Israël', 'Kiribati',
  'Madagascar', 'Malte', 'Monaco', 'Nauru', 'Oman', 'Saint-Christophe-et-Niévès', 'Saint-Marin',
  'Saint-Vincent-et-les-Grenadines', 'Sainte-Lucie', 'Singapour', 'São Tomé et Príncipe',
  'Trinité-et-Tobago', 'Tuvalu',
]);
const PLURAL = new Set([
  'Bahamas', 'Comores', 'Émirats arabes unis', 'États-Unis', 'Fidji', 'Maldives', 'Palaos',
  'Pays-Bas', 'Philippines', 'Samoa', 'Seychelles', 'Tonga',
]);
const MASCULINE = new Set(['Mexique', 'Cambodge', 'Mozambique', 'Zimbabwe', 'Belize']);
const FEMININE = new Set(['Sierra Leone', 'RD Congo']);
// h aspiré : pas d'élision.
const ASPIRATED_H = new Set(['Hongrie', 'Honduras']);

export interface FrName {
  /** Forme en cours de phrase : « la Russie ». */
  text: string;
  plural: boolean;
}

export function frName(name: string): FrName {
  if (NO_ARTICLE.has(name)) return { text: name, plural: false };
  // « Îles Marshall » → « les îles Marshall », « Île Maurice » → « l'île Maurice ».
  if (name.startsWith('Îles ')) return { text: `les î${name.slice(1)}`, plural: true };
  if (name.startsWith('Île ')) return { text: `l’î${name.slice(1)}`, plural: false };
  if (PLURAL.has(name)) return { text: `les ${name}`, plural: true };
  if (/^[AEIOUÉÈÊÎÔ]/.test(name) && !ASPIRATED_H.has(name)) return { text: `l’${name}`, plural: false };
  const first = name.split(/[\s-]/)[0];
  const feminine = FEMININE.has(name) || (!MASCULINE.has(name) && first.endsWith('e'));
  return { text: `${feminine ? 'la' : 'le'} ${name}`, plural: false };
}

/** En début de phrase : « La Russie ». */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
