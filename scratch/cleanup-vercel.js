import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.vercel.production
const envPath = path.resolve(__dirname, '../.env.vercel.production');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("Loaded env from .env.vercel.production. DATABASE_URL is set:", !!process.env.DATABASE_URL);
} else {
  console.log(".env.vercel.production not found at:", envPath);
}

// Now run the cleanup script
import('./cleanup-sb-aliases.js');
