const path = require('path')
const fs = require('fs')

const dir = __dirname

process.env.NODE_ENV = 'production'
process.chdir(dir)

const currentPort = parseInt(process.env.PORT, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10)

const configPath = path.join(dir, '.next', 'required-server-files.json')
const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const nextConfig = raw.config

raw.appDir = dir
nextConfig.outputFileTracingRoot = dir
if (nextConfig.experimental && nextConfig.experimental.turbopack) {
  nextConfig.experimental.turbopack.root = dir
}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig)

require('next')
const { startServer } = require('next/dist/server/lib/start-server')

if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined
}

startServer({
  dir,
  isDev: false,
  config: nextConfig,
  hostname,
  port: currentPort,
  allowRetry: false,
  keepAliveTimeout,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
