const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

function resolvePrismaDatasourceUrl() {
  return (
    process.env.DIRECT_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.gestornavalpro_DATABASE_URL ||
    process.env.GESTOR_DB ||
    process.env.gestornavalpro_POSTGRES_URL ||
    ''
  ).trim();
}

module.exports = {
  schema: path.join(__dirname, 'schema.prisma'),
  datasource: {
    url: resolvePrismaDatasourceUrl(),
  },
};
