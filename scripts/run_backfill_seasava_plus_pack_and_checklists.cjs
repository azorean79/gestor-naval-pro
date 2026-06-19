process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'Node',
});

require('ts-node/register/transpile-only');
require('./backfill_seasava_plus_pack_and_checklists.ts');