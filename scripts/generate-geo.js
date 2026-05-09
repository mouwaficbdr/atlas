const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const NATURAL_EARTH_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all';
const DATA_DIR = path.join(__dirname, '../public/data');

// Simple K-Means implementation to find dominant colors
function extractColors(pixels, k = 3, maxIterations = 10) {
  if (pixels.length === 0) return ['#ffffff'];

  // Initialize centroids randomly from pixels
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push([...randomPixel]);
  }

  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let clusters = Array.from({ length: k }, () => []);
    
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let closestCentroidIndex = 0;
      for (let j = 0; j < k; j++) {
        const dist = Math.pow(pixels[i][0] - centroids[j][0], 2) +
                     Math.pow(pixels[i][1] - centroids[j][1], 2) +
                     Math.pow(pixels[i][2] - centroids[j][2], 2);
        if (dist < minDist) {
          minDist = dist;
          closestCentroidIndex = j;
        }
      }
      assignments[i] = closestCentroidIndex;
      clusters[closestCentroidIndex].push(pixels[i]);
    }

    for (let j = 0; j < k; j++) {
      if (clusters[j].length === 0) continue;
      let rSum = 0, gSum = 0, bSum = 0;
      for (let p of clusters[j]) {
        rSum += p[0];
        gSum += p[1];
        bSum += p[2];
      }
      centroids[j] = [
        Math.round(rSum / clusters[j].length),
        Math.round(gSum / clusters[j].length),
        Math.round(bSum / clusters[j].length)
      ];
    }
  }

  const clusterSizes = Array.from({ length: k }, () => 0);
  for (let a of assignments) {
    clusterSizes[a]++;
  }

  const sortedCentroids = centroids.map((c, i) => ({ color: c, size: clusterSizes[i] }))
                                   .sort((a, b) => b.size - a.size);

  const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');

  return sortedCentroids.map(sc => rgbToHex(sc.color[0], sc.color[1], sc.color[2]));
}

async function getFlagColors(flagUrl) {
  try {
    const response = await fetch(flagUrl);
    const buffer = await response.arrayBuffer();
    const image = await loadImage(Buffer.from(buffer));
    
    // Scale down to tiny image for fast processing
    const canvas = createCanvas(20, 20);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, 20, 20);
    
    const imageData = ctx.getImageData(0, 0, 20, 20).data;
    const pixels = [];
    
    for (let i = 0; i < imageData.length; i += 4) {
      if (imageData[i + 3] > 128) {
        // Exclude pure white/black if possible, or just keep all opaque
        pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
      }
    }
    
    return extractColors(pixels, 3);
  } catch (error) {
    console.error(`Error processing flag: ${flagUrl}`, error.message);
    return ['#ffffff', '#cccccc', '#999999'];
  }
}

async function generate() {
  console.log('Fetching Natural Earth GeoJSON...');
  const geoResponse = await fetch(NATURAL_EARTH_URL);
  const geojson = await geoResponse.json();

  console.log('Fetching REST Countries data...');
  const restResponse1 = await fetch(REST_COUNTRIES_URL + '?fields=cca3,name,latlng,population,area,region,subregion,capital,currencies,languages');
  const restResponse2 = await fetch(REST_COUNTRIES_URL + '?fields=cca3,flags,borders');

  if (!restResponse1.ok || !restResponse2.ok) {
    throw new Error(`REST API failed: ${restResponse1.status} / ${restResponse2.status}`);
  }

  const restCountriesArray1 = await restResponse1.json();
  const restCountriesArray2 = await restResponse2.json();

  const restCountries = {};
  for (const c of restCountriesArray1) {
    restCountries[c.cca3] = c;
  }
  for (const c of restCountriesArray2) {
    if (restCountries[c.cca3]) {
      restCountries[c.cca3].flags = c.flags;
      restCountries[c.cca3].borders = c.borders;
    }
  }

  console.log('Processing countries and extracting colors...');
  
  const mergedFeatures = [];

  for (const feature of geojson.features) {
    let cca3 = feature.properties.ADM0_A3 || feature.properties.SU_A3 || feature.properties.ISO_A3;
    // Map France correctly if needed (sometimes France is '-99' in ADM0_A3 but 'FRA' in SU_A3)
    if (cca3 === '-99') cca3 = feature.properties.SU_A3;
    if (cca3 === '-99') cca3 = feature.properties.GU_A3;
    
    const restCountry = restCountries[cca3];
    
    if (!restCountry) {
      console.warn(`No REST country found for ${feature.properties.NAME} (${cca3})`);
      continue;
    }

    const flagUrl = restCountry.flags?.png;
    let colors = ['#ffffff', '#cccccc', '#999999'];
    if (flagUrl) {
      colors = await getFlagColors(flagUrl);
      console.log(`Processed ${restCountry.name.common}: ${colors[0]}`);
    }

    // Filter out Antarctica or handle it
    if (cca3 === 'ATA') continue;

    mergedFeatures.push({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        cca3: restCountry.cca3,
        cca2: restCountry.cca2,
        name: {
          common: restCountry.name.common,
          official: restCountry.name.official,
          nativeName: restCountry.name.nativeName
        },
        centroid: restCountry.latlng ? [restCountry.latlng[1], restCountry.latlng[0]] : [0,0],
        latlng: restCountry.latlng,
        population: restCountry.population,
        area: restCountry.area,
        region: restCountry.region,
        subregion: restCountry.subregion,
        landlocked: restCountry.landlocked,
        capital: restCountry.capital || [],
        currencies: restCountry.currencies,
        languages: restCountry.languages,
        timezones: restCountry.timezones,
        idd: restCountry.idd,
        tld: restCountry.tld,
        flags: restCountry.flags,
        borders: restCountry.borders || [],
        colors: {
          primary: colors[0],
          palette: colors
        }
      }
    });
  }

  const finalGeoJSON = {
    type: 'FeatureCollection',
    features: mergedFeatures
  };

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const outputPath = path.join(DATA_DIR, 'countries-geo.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalGeoJSON));
  
  console.log(`\nSuccessfully generated ${outputPath} with ${mergedFeatures.length} countries.`);
}

generate().catch(console.error);
