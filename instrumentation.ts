import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Start database backup scheduler hourly on server startup
    const phase = process.env.NEXT_PHASE;
    if (phase === 'phase-development-server' || phase === 'phase-production-server') {
      try {
        const { startBackupScheduler } = require('./scripts/db_backup');
        startBackupScheduler();
      } catch (err) {
        console.error('[Backup] Failed to start backup scheduler:', err);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
