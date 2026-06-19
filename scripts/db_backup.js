const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupParentDir = path.join(process.cwd(), 'backups');
  const backupDir = path.join(backupParentDir, `backup_${timestamp}`);

  console.log(`[Backup] Starting backup at ${new Date().toISOString()}...`);

  try {
    // 1. Ensure backup directory exists
    if (!fs.existsSync(backupParentDir)) {
      fs.mkdirSync(backupParentDir, { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });

    // 2. Dynamically resolve all Prisma models
    const modelNames = Object.keys(prisma).filter(
      (key) => !key.startsWith('_') && !key.startsWith('$') && typeof prisma[key]?.findMany === 'function'
    );

    console.log(`[Backup] Found ${modelNames.length} models to export.`);

    // 3. Export each model to a JSON file
    for (const model of modelNames) {
      try {
        console.log(`[Backup] Exporting table: ${model}...`);
        const records = await prisma[model].findMany();
        const filePath = path.join(backupDir, `${model}.json`);
        fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
      } catch (err) {
        console.error(`[Backup] Error exporting model ${model}:`, err.message);
      }
    }

    console.log(`[Backup] Backup successfully written to: ${backupDir}`);

    // 4. Auto-cleanup: keep only the last 48 backups (2 days of hourly backups)
    const files = fs.readdirSync(backupParentDir);
    const backupFolders = files
      .map((name) => ({
        name,
        path: path.join(backupParentDir, name),
        stat: fs.statSync(path.join(backupParentDir, name)),
      }))
      .filter((item) => item.stat.isDirectory() && item.name.startsWith('backup_'))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // newest first

    const maxBackups = 48;
    if (backupFolders.length > maxBackups) {
      console.log(`[Backup] Cleaning up old backups (keeping only the last ${maxBackups})...`);
      const toDelete = backupFolders.slice(maxBackups);
      for (const folder of toDelete) {
        try {
          console.log(`[Backup] Deleting old backup: ${folder.name}`);
          fs.rmSync(folder.path, { recursive: true, force: true });
        } catch (rmErr) {
          console.error(`[Backup] Error deleting folder ${folder.path}:`, rmErr.message);
        }
      }
    }

  } catch (error) {
    console.error('[Backup] Critical backup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running this script directly from the command line
if (require.main === module) {
  runBackup().then(() => {
    console.log('[Backup] Backup script finished.');
  }).catch((err) => {
    console.error('[Backup] Backup script failed:', err);
  });
}

function startBackupScheduler() {
  if (global.__backup_scheduler_started__) return;
  global.__backup_scheduler_started__ = true;

  console.log('[Backup] Database backup scheduler initialized. Runs every hour.');

  // Run a backup immediately on startup (after 30s delay)
  setTimeout(() => {
    runBackup().catch(err => console.error('[Backup] Startup backup failed:', err));
  }, 30000);

  setInterval(() => {
    console.log('[Backup] Running scheduled hourly backup...');
    runBackup().catch(err => console.error('[Backup] Scheduled backup failed:', err));
  }, 60 * 60 * 1000); // 1 hour
}

module.exports = { runBackup, startBackupScheduler };
