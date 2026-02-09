// setup-local-postgres.js
// Automates local Postgres database creation and user setup

const { execSync } = require('child_process');

const dbName = 'nome_do_banco';
const dbUser = 'usuario';
const dbPass = 'senha';

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

console.log('Creating database...');
run(`psql -U postgres -c "CREATE DATABASE ${dbName};"`);

console.log('Creating user...');
run(`psql -U postgres -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPass}';"`);

console.log('Granting privileges...');
run(`psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`);

console.log('Setup complete.');
