const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/data/countries-geo.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

data.features.forEach(f => {
  if (typeof f.properties.name === 'string') {
    f.properties.name = {
      common: f.properties.name,
      official: f.properties.name // We lost official name but common is usually fine for now
    };
  }
});

fs.writeFileSync(filePath, JSON.stringify(data));
console.log('Successfully transformed existing GeoJSON data.');
