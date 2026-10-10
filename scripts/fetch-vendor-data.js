/**
 * Récupère les données de référence tierces utilisées par generate-geo.js et
 * les fige dans scripts/vendor/. À lancer manuellement quand on veut
 * rafraîchir les sources ; le build ne dépend jamais du réseau.
 *
 *   node scripts/fetch-vendor-data.js
 *
 * Sources :
 *  - mledoze/countries : noms traduits, gentilés, idd, tld, statut souverain
 *  - Wikidata (SPARQL) : forme de gouvernement (P122), libellé français
 *  - Banque mondiale (SP.POP.TOTL) : population, dernière année publiée
 *  - Wikidata (SPARQL) : coordonnées des capitales en vigueur (P36, P625)
 */

const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, 'vendor');

// Wikidata (comme Wikimedia) refuse les requêtes sans User-Agent identifiant
// le projet : sans lui, la réponse arrive vide.
const USER_AGENT = 'atlas/1.0 (https://github.com/mouwaficbdr/atlas)';

/** Requête qui échoue franchement sur une réponse non 2xx. */
async function get(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} sur ${url}`);
  return res;
}

const MLEDOZE_URL =
  'https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json';

const WORLDBANK_POP_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=400';

const CAPITALS_QUERY = `SELECT ?iso3 ?capLabel ?coord WHERE {
  ?c wdt:P298 ?iso3 .
  ?c p:P36 ?st . ?st ps:P36 ?cap .
  FILTER NOT EXISTS { ?st pq:P582 ?end }
  ?cap wdt:P625 ?coord .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
}`;

const WIKIDATA_QUERY = `SELECT ?iso3 ?govLabel WHERE {
  ?c wdt:P298 ?iso3 .
  OPTIONAL { ?c wdt:P122 ?gov . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
}`;

async function main() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });

  process.stdout.write('mledoze/countries... ');
  // Texte brut tel que publié (un pays par ligne) : les rafraîchissements ne
  // produisent un diff que pour les pays qui ont réellement changé.
  const mledozeText = await get(MLEDOZE_URL).then((r) => r.text());
  const mledoze = JSON.parse(mledozeText);
  fs.writeFileSync(path.join(VENDOR_DIR, 'mledoze-countries.json'), mledozeText);
  console.log(`${mledoze.length} pays`);

  process.stdout.write('Wikidata P122... ');
  const url =
    'https://query.wikidata.org/sparql?format=json&query=' +
    encodeURIComponent(WIKIDATA_QUERY);
  const wikidataText = await get(url, { Accept: 'application/sparql-results+json' }).then((r) => r.text());
  const wikidata = JSON.parse(wikidataText);
  fs.writeFileSync(path.join(VENDOR_DIR, 'wikidata-gov.json'), wikidataText);
  console.log(`${wikidata.results.bindings.length} lignes`);

  process.stdout.write('Wikidata, capitales... ');
  const capitalsText = await get(
    'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(CAPITALS_QUERY),
    { Accept: 'application/sparql-results+json' },
  ).then((r) => r.text());
  const capitals = JSON.parse(capitalsText);
  fs.writeFileSync(path.join(VENDOR_DIR, 'wikidata-capitals.json'), capitalsText);
  console.log(`${capitals.results.bindings.length} lignes`);

  process.stdout.write('Banque mondiale, population... ');
  const [, rows] = await get(WORLDBANK_POP_URL).then((r) => r.json());
  const population = {};
  for (const r of rows) {
    if (r.value) population[r.countryiso3code] = { value: r.value, year: Number(r.date) };
  }
  fs.writeFileSync(
    path.join(VENDOR_DIR, 'worldbank-population.json'),
    JSON.stringify(population),
  );
  console.log(`${Object.keys(population).length} entrées`);

  console.log('\nVendor à jour. Lancer ensuite : node scripts/generate-geo.js');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
