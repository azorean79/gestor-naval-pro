import React from 'react';
import { Archive } from 'lucide-react';

// Export any icon components used in the app.
// Currently only BackupIcon is needed for the Backups page.
export const BackupIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return <Archive {...props} />;
};

// Add more icons here as the project grows.
