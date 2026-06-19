// Server component: lists backup folders and renders upload form
import fs from 'fs';
import path from 'path';
import UploadForm from './UploadForm';

// Directory where backups are stored relative to project root
const BACKUP_ROOT = path.resolve(process.cwd(), 'backups');

// Helper to list backup directories (server‑side)
function getBackupFolders(): string[] {
  try {
    const entries = fs.readdirSync(BACKUP_ROOT, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a)); // newest first
  } catch (err) {
    console.error('Failed to read backups directory:', err);
    return [];
  }
}

export const metadata = {
  title: 'Backups',
  description: 'Lista de backups disponíveis para restauração e importação',
};

export default function BackupsPage() {
  const backups = getBackupFolders();
  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Backups Disponíveis</h1>
      {backups.length === 0 ? (
        <p className="text-gray-600">Nenhum backup encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {backups.map((folder) => (
            <li key={folder} className="border rounded p-3 hover:bg-gray-50 transition">
              <a
                href={`/api/backups/${encodeURIComponent(folder)}/download`}
                className="text-blue-600 hover:underline"
              >
                Download {folder}
              </a>
            </li>
          ))}
        </ul>
      )}
      <hr className="my-8" />
      <UploadForm />
    </section>
  );
}
