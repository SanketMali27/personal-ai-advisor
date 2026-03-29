const path = require('path');
const { createRequire } = require('module');

// Load dependencies from server (shared node_modules)
const serverPackagePath = path.resolve(__dirname, '../server/package.json');
const serverRequire = createRequire(serverPackagePath);

// Load dotenv from server
const dotenv = serverRequire('dotenv');

// Load environment variables (priority order)

// 1. server/.env (main config)
dotenv.config({
  path: path.resolve(__dirname, '../server/.env'),
});

// 2. ai-services/.env (optional, won't override existing)
dotenv.config({
  path: path.resolve(__dirname, '../ai-services/.env'),
  override: false,
});

// 3. vector-db/.env (highest priority override)
dotenv.config({
  path: path.resolve(__dirname, '../vector-db/.env'),
  override: true,
});

module.exports = { serverRequire };
