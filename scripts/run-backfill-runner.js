const { spawn } = require('child_process');
const fs = require('fs');

// WARNING: this file contains the DATABASE_URL provided by the user.
const DATABASE_URL = 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19FSS1WejNsS0U2NUxBZzdoWDEzRUoiLCJhcGlfa2V5IjoiMDFLSjhNM1RRWlFGNlFXREhOV1I1TjlYVDMiLCJ0ZW5hbnRfaWQiOiI2Y2Y2ODlmZGI4MzkzODViYmI0ZDI1MzNlYTg3YzBjZDFkYjU4ZTNkYmI0ZjdkNDE5MzQ1Y2VjZDBjOTMyN2U0IiwiaW50ZXJuYWxfc2VjcmV0IjoiNDVmNzI2ZjItZDQ2YS00ODNjLWIyZjgtOGYyNTk3MzVhM2I5In0.1SpEzAhf5MplJvdMslBc9p93xdnkglW1AraQPQOWWZk';

process.env.DATABASE_URL = DATABASE_URL;
// enable verbose logging in the backfill
process.env.BACKFILL_VERBOSE = '1';

const logPath = 'backfill.log';
const out = fs.createWriteStream(logPath, { flags: 'w' });
out.write(`Starting backfill at ${new Date().toISOString()}\n`);

const child = spawn(process.execPath, ['scripts/backfill-cilindros-to-stock.js'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', chunk => {
  out.write(chunk);
  process.stdout.write(chunk);
});
child.stderr.on('data', chunk => {
  out.write(chunk);
  process.stderr.write(chunk);
});
child.on('close', code => {
  const msg = `Backfill finished with code ${code} at ${new Date().toISOString()}\n`;
  out.write(msg);
  console.log(msg);
  out.end();
});
