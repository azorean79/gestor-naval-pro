import postgres from 'postgres';
import { getSupportedDatabaseEnvNames, resolveRuntimeDatabaseUrl } from '@/lib/resolve-database-url';

const { connectionString } = resolveRuntimeDatabaseUrl();
if (!connectionString) {
  throw new Error(`${getSupportedDatabaseEnvNames().join(' or ')} is not set`);
}

// Initialize postgres client. Pass SSL option when required by host (e.g. Supabase)
const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

export default sql;
