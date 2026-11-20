const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const readJson = name => JSON.parse(readFileSync(join(__dirname, name), 'utf8').replace(/^\uFEFF/, ''));
const catalogData = {
  content: readJson('products-content.json'),
  tokens: readJson('design-tokens.json'),
  comic: readJson('spider-venom.json')
};

// A script wrapper lets the catalog load from file:// as well as from a web server.
const runtime = `// Generated from the catalog JSON files by sync-catalog.cjs.\nwindow.customCatalogData = ${JSON.stringify(catalogData, null, 2)};\n`;
writeFileSync(join(__dirname, 'catalog-data.js'), runtime, 'utf8');
