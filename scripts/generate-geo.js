/**
 * Génère public/data/countries-geo.json à partir de :
 *  - la géométrie Natural Earth déjà présente dans countries-geo.json
 *  - scripts/vendor/mledoze-countries.json  (noms FR, gentilés, idd, tld, souveraineté)
 *  - scripts/vendor/wikidata-gov.json       (forme de gouvernement)
 *  - scripts/vendor/gov-overrides.json      (corrections manuelles)
 *  - scripts/vendor/worldbank-population.json (population, Banque mondiale)
 *  - scripts/vendor/koppen.json              (climats, voir compute-koppen.mjs)
 *  - scripts/vendor/flag-colors.json         (couleurs des drapeaux, voir compute-flag-colors.mjs)
 *  - scripts/vendor/wikidata-capitals.json   (coordonnées des capitales, P36/P625)
 *  - countries-and-timezones                (fuseaux IANA)
 *
 * Aucun appel réseau : rafraîchir les sources avec scripts/fetch-vendor-data.js.
 *
 *   node scripts/generate-geo.js
 *
 * Traitements :
 *  1. filtre aux 193 États membres de l'ONU (mledoze.unMember === true) ;
 *     les voisins hors de ce périmètre (Kosovo, Palestine, territoires) sont retirés
 *  2. propriétés enrichies : noms FR, capitale FR, région FR, fuseau IANA de la
 *     capitale, forme de gouvernement FR, indicatif, TLD
 *  3. centroïde recalculé en flottant depuis la géométrie
 *  4. géométrie : déroulage à l'antiméridien + densification des arêtes longues
 */

const fs = require('fs');
const path = require('path');
const ct = require('countries-and-timezones');

const DATA_PATH = path.join(__dirname, '../public/data/countries-geo.json');
const VENDOR = path.join(__dirname, 'vendor');

// Noms français des langues et monnaies, depuis leurs codes (idempotent) :
// Intl couvre l'essentiel, ce dictionnaire comble ce qu'il ignore.
const LANGUAGE_DISPLAY_FR = new Intl.DisplayNames(['fr'], { type: 'language', fallback: 'none' });
const CURRENCY_DISPLAY_FR = new Intl.DisplayNames(['fr'], { type: 'currency', fallback: 'none' });

const LANGUAGE_FR = {
  ber: 'berbère',
  bjz: 'créole bélizien',
  bwg: 'chibarwe',
  glc: 'galicien',
  hgm: 'khoekhoe',
  kck: 'kalanga',
  khi: 'khoïsan',
  kwn: 'kwangali',
  ndc: 'ndau',
  nzs: 'langue des signes néo-zélandaise',
  pov: 'créole de Haute-Guinée',
  smi: 'same',
  toi: 'tonga',
  zdj: 'comorien',
  zib: 'langue des signes zimbabwéenne',
};

const CURRENCY_FR = {
  KID: 'dollar des Kiribati',
  TVD: 'dollar de Tuvalu',
};

const capitalize = (text) => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);

function displayFr(display, code) {
  try {
    return display.of(code);
  } catch {
    return undefined;
  }
}

function languagesFr(languages) {
  const out = {};
  for (const [code, english] of Object.entries(languages || {})) {
    const fr = LANGUAGE_FR[code] || displayFr(LANGUAGE_DISPLAY_FR, code);
    out[code] = fr ? capitalize(fr) : english;
  }
  return out;
}

function currenciesFr(currencies) {
  const out = {};
  for (const [code, currency] of Object.entries(currencies || {})) {
    const fr = CURRENCY_FR[code] || displayFr(CURRENCY_DISPLAY_FR, code);
    out[code] = { ...currency, name: fr ? capitalize(fr) : currency.name };
  }
  return out;
}

// Corrections des libellés français de mledoze affichés en titre de fiche :
// parenthèses d'abréviation ou d'exonyme anglais, gentilé anglais.
const NAME_FR_OVERRIDES = {
  COD: { nameFr: 'RD Congo' },
  PLW: { nameFr: 'Palaos', officialNameFr: 'République des Palaos', demonymFr: 'Palaosien' },
};

const REGION_FR = {
  Africa: 'Afrique',
  Americas: 'Amériques',
  Asia: 'Asie',
  Europe: 'Europe',
  Oceania: 'Océanie',
  Antarctic: 'Antarctique',
};

const SUBREGION_FR = {
  'Australia and New Zealand': 'Australie et Nouvelle-Zélande',
  Caribbean: 'Caraïbes',
  'Central America': 'Amérique centrale',
  'Central Asia': 'Asie centrale',
  'Central Europe': 'Europe centrale',
  'Eastern Africa': "Afrique de l'Est",
  'Eastern Asia': "Asie de l'Est",
  'Eastern Europe': "Europe de l'Est",
  Melanesia: 'Mélanésie',
  Micronesia: 'Micronésie',
  'Middle Africa': 'Afrique centrale',
  'North America': 'Amérique du Nord',
  'Northern Africa': 'Afrique du Nord',
  'Northern Europe': 'Europe du Nord',
  Polynesia: 'Polynésie',
  'South America': 'Amérique du Sud',
  'South-Eastern Asia': 'Asie du Sud-Est',
  'Southeast Europe': "Europe du Sud-Est",
  'Southern Africa': 'Afrique australe',
  'Southern Asia': 'Asie du Sud',
  'Southern Europe': 'Europe du Sud',
  'Western Africa': "Afrique de l'Ouest",
  'Western Asia': 'Asie occidentale',
  'Western Europe': "Europe de l'Ouest",
};

// Nom français de la capitale, uniquement quand il diffère de l'anglais.
const CAPITAL_FR = {
  'Port of Spain': "Port-d'Espagne",
  'City of San Marino': 'Saint-Marin',
  'Ulan Bator': 'Oulan-Bator',
  'South Tarawa': 'Tarawa-Sud',
  "St. George's": 'Saint-Georges',
  Thimphu: 'Thimphou',
  Dhaka: 'Dacca',
  'Sri Jayawardenepura Kotte': 'Sri Jayawardenapura Kotte',
  "Sana'a": 'Sanaa',
  Beijing: 'Pékin',
  Moscow: 'Moscou',
  Warsaw: 'Varsovie',
  Lisbon: 'Lisbonne',
  Athens: 'Athènes',
  Vienna: 'Vienne',
  Copenhagen: 'Copenhague',
  Brussels: 'Bruxelles',
  London: 'Londres',
  Cairo: 'Le Caire',
  Algiers: 'Alger',
  Bucharest: 'Bucarest',
  Bern: 'Berne',
  Nicosia: 'Nicosie',
  Valletta: 'La Valette',
  'Andorra la Vella': 'Andorre-la-Vieille',
  'Vatican City': 'Cité du Vatican',
  'San Marino': 'Saint-Marin',
  Seoul: 'Séoul',
  Tehran: 'Téhéran',
  Baghdad: 'Bagdad',
  Damascus: 'Damas',
  Beirut: 'Beyrouth',
  Riyadh: 'Riyad',
  Muscat: 'Mascate',
  'Kuwait City': 'Koweït',
  'Abu Dhabi': 'Abou Dabi',
  Jerusalem: 'Jérusalem',
  Kabul: 'Kaboul',
  Kathmandu: 'Katmandou',
  Hanoi: 'Hanoï',
  Manila: 'Manille',
  Singapore: 'Singapour',
  Ulaanbaatar: 'Oulan-Bator',
  Tashkent: 'Tachkent',
  Bishkek: 'Bichkek',
  Dushanbe: 'Douchanbé',
  Ashgabat: 'Achgabat',
  Tbilisi: 'Tbilissi',
  Yerevan: 'Erevan',
  Baku: 'Bakou',
  Mogadishu: 'Mogadiscio',
  'Addis Ababa': 'Addis-Abeba',
  Juba: 'Djouba',
  Khartoum: 'Khartoum',
  Havana: 'La Havane',
  'Santo Domingo': 'Saint-Domingue',
  'Mexico City': 'Mexico',
  'Panama City': 'Panama',
  'Guatemala City': 'Guatemala',
  'Washington, D.C.': 'Washington',
  "N'Djamena": "N'Djaména",
  Chisinau: 'Chișinău',
};

// Fuseau IANA de la capitale, pour les pays multi-fuseaux (sinon
// countries-and-timezones renvoie une liste alphabétique dont [0] est faux).
const CAPITAL_TZ = {
  ARG: 'America/Argentina/Buenos_Aires',
  AUS: 'Australia/Sydney',
  BRA: 'America/Sao_Paulo',
  CAN: 'America/Toronto',
  CHL: 'America/Santiago',
  CHN: 'Asia/Shanghai',
  COD: 'Africa/Kinshasa',
  CYP: 'Asia/Nicosia',
  DEU: 'Europe/Berlin',
  ECU: 'America/Guayaquil',
  ESP: 'Europe/Madrid',
  FSM: 'Pacific/Pohnpei',
  IDN: 'Asia/Jakarta',
  KAZ: 'Asia/Almaty',
  KIR: 'Pacific/Tarawa',
  MEX: 'America/Mexico_City',
  MHL: 'Pacific/Majuro',
  MNG: 'Asia/Ulaanbaatar',
  MYS: 'Asia/Kuala_Lumpur',
  NZL: 'Pacific/Auckland',
  PNG: 'Pacific/Port_Moresby',
  PRT: 'Europe/Lisbon',
  RUS: 'Europe/Moscow',
  UKR: 'Europe/Kyiv',
  USA: 'America/New_York',
  UZB: 'Asia/Tashkent',
  VNM: 'Asia/Ho_Chi_Minh',
};

const GOV_BLACKLIST = [
  'empire',
  'état successeur',
  'gouvernement provisoire',
  'dictature communiste',
  'juche',
  'état fantoche',
  'régime militaire',
];

function pickGovernment(labels) {
  const clean = labels
    .map((l) => l.trim())
    .filter((l) => l && !/^Q\d+$/.test(l))
    .filter((l) => !GOV_BLACKLIST.some((b) => l.toLowerCase().includes(b)));
  if (clean.length === 0) return null;
  const has = (s) => clean.find((l) => l.toLowerCase().includes(s));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (has('monarchie constitutionnelle')) return 'Monarchie constitutionnelle';
  if (has('monarchie absolue')) return 'Monarchie absolue';
  if (has('république fédérale')) return 'République fédérale';
  if (has('république parlementaire')) return 'République parlementaire';
  if (has('république populaire')) return 'République populaire';
  if (has('semi-présidentiel')) return 'République semi-présidentielle';
  if (has('présidentiel')) return 'République présidentielle';
  if (has('république islamique')) return 'République islamique';
  if (has('monarchie')) return 'Monarchie';
  const rep = has('république');
  if (rep) return cap(rep);
  return cap(clean[0]);
}

// ---------------------------------------------------------------------------

function loadVendor(name) {
  return JSON.parse(fs.readFileSync(path.join(VENDOR, name), 'utf-8'));
}

function buildGovMap() {
  const rows = loadVendor('wikidata-gov.json').results.bindings;
  const byIso = {};
  for (const b of rows) {
    const iso = b.iso3 && b.iso3.value;
    const label = b.govLabel && b.govLabel.value;
    if (!iso || !label) continue;
    (byIso[iso] = byIso[iso] || []).push(label);
  }
  const map = {};
  for (const [iso, labels] of Object.entries(byIso)) {
    const picked = pickGovernment(labels);
    if (picked) map[iso] = picked;
  }
  const overrides = loadVendor('gov-overrides.json');
  for (const [iso, label] of Object.entries(overrides)) {
    if (iso.startsWith('_')) continue;
    map[iso] = label;
  }
  return map;
}

function primaryTimezone(cca3, cca2) {
  if (CAPITAL_TZ[cca3]) return CAPITAL_TZ[cca3];
  const c = cca2 && ct.getCountry(cca2);
  if (c && c.timezones.length > 0) return c.timezones[0];
  return 'UTC';
}

// --- Géométrie ------------------------------------------------------------

// Déroule un anneau qui franchit l'antiméridien : si des longitudes très
// positives et très négatives coexistent, on décale les négatives de +360
// pour que earcut ne crée pas de triangle traversant tout le globe.
function unwrapRing(ring) {
  let hasEast = false;
  let hasWest = false;
  let min = Infinity;
  let max = -Infinity;
  for (const [lon] of ring) {
    if (lon > 90) hasEast = true;
    if (lon < -90) hasWest = true;
    if (lon < min) min = lon;
    if (lon > max) max = lon;
  }
  if (hasEast && hasWest && max - min > 180) {
    return ring.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat]);
  }
  return ring;
}

// Insère des points intermédiaires sur les arêtes > maxStep degrés pour que
// la triangulation suive mieux la courbure une fois projetée sur la sphère.
function densifyRing(ring, maxStep) {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    out.push([lon1, lat1]);
    const steps = Math.ceil(
      Math.max(Math.abs(lon2 - lon1), Math.abs(lat2 - lat1)) / maxStep,
    );
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      out.push([lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t]);
    }
  }
  out.push(ring[ring.length - 1]);
  return out;
}

function processPolygon(polygon) {
  const east = polygon.some((ring) => unwrapRing(ring) !== ring);
  return polygon.map((ring) => {
    let r = ring;
    if (east) r = unwrapRing(ring);
    return densifyRing(r, 6);
  });
}

function processGeometry(geometry) {
  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map(processPolygon),
    };
  }
  return {
    type: 'Polygon',
    coordinates: processPolygon(geometry.coordinates),
  };
}

// Centroïde flottant : centroïde d'aire (shoelace) de l'anneau extérieur le
// plus grand, repli sur le centre de la bbox.
function computeCentroid(geometry) {
  const polygons =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [geometry.coordinates];
  let best = null;
  let bestArea = -1;
  for (const poly of polygons) {
    const ring = poly[0];
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
    area /= 2;
    const abs = Math.abs(area);
    if (abs > bestArea) {
      bestArea = abs;
      if (abs > 1e-9) {
        best = [cx / (6 * area), cy / (6 * area)];
      } else {
        const xs = ring.map((p) => p[0]);
        const ys = ring.map((p) => p[1]);
        best = [
          (Math.min(...xs) + Math.max(...xs)) / 2,
          (Math.min(...ys) + Math.max(...ys)) / 2,
        ];
      }
    }
  }
  const wrap = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;
  return [round(wrap(best[0])), round(best[1])];
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------

const normalizeName = (name) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

/**
 * Coordonnées [lon, lat] de la capitale, par pays. Plusieurs capitales
 * (Afrique du Sud, Bolivie, Pays-Bas…) : celle dont le nom correspond à
 * capitalFr, à défaut celle qui en partage le début, à défaut la première.
 */
function buildCapitalMap() {
  const byIso = new Map();
  for (const b of loadVendor('wikidata-capitals.json').results.bindings) {
    const match = b.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) continue;
    const list = byIso.get(b.iso3.value) || [];
    list.push({ name: normalizeName(b.capLabel.value), lonLat: [Number(match[1]), Number(match[2])] });
    byIso.set(b.iso3.value, list);
  }
  return (cca3, capitalFr) => {
    const list = byIso.get(cca3);
    if (!list) return null;
    const target = normalizeName(capitalFr);
    const pick =
      list.find((c) => c.name === target) ||
      list.find((c) => c.name.slice(0, 4) === target.slice(0, 4)) ||
      list[0];
    return pick.lonLat.map(round);
  };
}

function generate() {
  const geo = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const mledoze = loadVendor('mledoze-countries.json');
  const mById = new Map(mledoze.map((c) => [c.cca3, c]));
  const members = new Set(mledoze.filter((c) => c.unMember === true).map((c) => c.cca3));
  // mledoze marque à tort le Saint-Siège membre de l'ONU : il n'y est qu'observateur.
  members.delete('VAT');
  const govMap = buildGovMap();
  const worldBankPop = loadVendor('worldbank-population.json');
  const koppen = loadVendor('koppen.json');
  const flagColors = loadVendor('flag-colors.json');
  const capitals = buildCapitalMap();

  const out = [];
  let skipped = 0;

  for (const feature of geo.features) {
    const p = feature.properties;
    const m = mById.get(p.cca3);

    if (!m || !members.has(p.cca3)) {
      skipped++;
      continue;
    }

    const geometry = processGeometry(feature.geometry);
    const cca2 = m.cca2 || p.cca2;
    const capitalEn = (p.capital && p.capital[0]) || (m.capital && m.capital[0]) || '';
    const fra = m.translations && m.translations.fra;
    const demonym = m.demonyms && m.demonyms.fra;

    out.push({
      type: 'Feature',
      geometry,
      properties: {
        cca3: p.cca3,
        cca2,
        name: {
          common: p.name.common,
          official: p.name.official,
          nativeName: p.name.nativeName,
        },
        nameFr: (fra && fra.common) || p.name.common,
        officialNameFr: (fra && fra.official) || p.name.official,
        demonymFr: (demonym && demonym.m) || '',
        capital: p.capital && p.capital.length ? p.capital : m.capital || [],
        capitalFr: CAPITAL_FR[capitalEn] || capitalEn,
        capitalLonLat: capitals(p.cca3, CAPITAL_FR[capitalEn] || capitalEn),
        region: p.region,
        regionFr: REGION_FR[p.region] || p.region,
        subregion: p.subregion,
        subregionFr: SUBREGION_FR[p.subregion] || p.subregion,
        latlng: p.latlng,
        centroid: computeCentroid(geometry),
        population: worldBankPop[p.cca3]?.value ?? p.population,
        populationYear: worldBankPop[p.cca3]?.year ?? null,
        area: p.area,
        landlocked: p.landlocked,
        borders: (p.borders || []).filter((code) => members.has(code)),
        languages: languagesFr(p.languages),
        currencies: currenciesFr(p.currencies),
        flags: p.flags,
        idd: m.idd || p.idd || null,
        tld: m.tld || p.tld || [],
        timezones: p.timezones || [],
        primaryTimezone: primaryTimezone(p.cca3, cca2),
        governmentFr: govMap[p.cca3] || null,
        climate: koppen[p.cca3] || [],
        ...NAME_FR_OVERRIDES[p.cca3],
        independent: true,
        colors: flagColors[p.cca3],
      },
    });
  }

  const result = { type: 'FeatureCollection', features: out };
  fs.writeFileSync(DATA_PATH, JSON.stringify(result));

  console.log(`Écrit ${out.length} États membres de l'ONU (${skipped} écartés).`);
  const missingGov = out.filter((f) => !f.properties.governmentFr).length;
  const missingTz = out.filter((f) => f.properties.primaryTimezone === 'UTC').length;
  console.log(`Gouvernement manquant : ${missingGov} | fuseau par défaut UTC : ${missingTz}`);
}

generate();
