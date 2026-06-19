process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});

require('ts-node/register/transpile-only');
require('./normalize_bellows_article_name.ts');
