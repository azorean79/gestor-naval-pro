import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

export function UploadFile({ onUpload }: { onUpload: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        Upload Documento/Imagem/Excel
      </Button>
    </div>
  );
}
