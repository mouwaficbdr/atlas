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
 */

const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, 'vendor');

const MLEDOZE_URL =
  'https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json';

const WORLDBANK_POP_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=400';

const WIKIDATA_QUERY = `SELECT ?iso3 ?govLabel WHERE {
  ?c wdt:P298 ?iso3 .
  OPTIONAL { ?c wdt:P122 ?gov . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
}`;

async function main() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });

  process.stdout.write('mledoze/countries... ');
  const mledoze = await fetch(MLEDOZE_URL).then((r) => r.json());
  fs.writeFileSync(
    path.join(VENDOR_DIR, 'mledoze-countries.json'),
    JSON.stringify(mledoze),
  );
  console.log(`${mledoze.length} pays`);

  process.stdout.write('Wikidata P122... ');
  const url =
    'https://query.wikidata.org/sparql?format=json&query=' +
    encodeURIComponent(WIKIDATA_QUERY);
  const wikidata = await fetch(url, {
    headers: { Accept: 'application/sparql-results+json' },
  }).then((r) => r.json());
  fs.writeFileSync(
    path.join(VENDOR_DIR, 'wikidata-gov.json'),
    JSON.stringify(wikidata),
  );
  console.log(`${wikidata.results.bindings.length} lignes`);

  process.stdout.write('Banque mondiale, population... ');
  const [, rows] = await fetch(WORLDBANK_POP_URL).then((r) => r.json());
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
