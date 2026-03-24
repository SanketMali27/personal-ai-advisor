const path = require('path');
const { createRequire } = require('module');

const serverPackagePath = path.resolve(__dirname, '../server/package.json');
const serverRequire = createRequire(serverPackagePath);
const dotenv = serverRequire('dotenv');

const envFiles = [
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../ai-services/.env'),
];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile, override: false });
}

module.exports = { serverRequire };
