import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';


interface QrLabelGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL to encode in QR */
  url: string;
  /** Optional title to appear on label */
  title?: string;
  /** Serial da jangada — permite etiqueta de cliente (link público de estado) */
  serial?: string;
}

export default function QrLabelGeneratorDialog({ isOpen, onClose, url, title, serial }: QrLabelGeneratorDialogProps) {
  const [width, setWidth] = useState('60'); // mm
  const [height, setHeight] = useState('30'); // mm
  const [sheetUsed, setSheetUsed] = useState(false);
  const [publicLink, setPublicLink] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const qrUrl =
    publicLink && serial
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/estado-jangada?serial=${encodeURIComponent(serial)}`
      : url;

  const handlePrint = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    if (!printRef.current) return;
    const opt = {
      margin: 0,
      filename: `${title ?? 'etiqueta'}-${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: [parseInt(width), parseInt(height)] as [number, number], orientation: 'portrait' as const },
    };
    html2pdf().from(printRef.current).set(opt).save();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Fechar"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4">Gerar etiqueta QR</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Largura (mm)</label>
            <input
              type="number"
              min="30"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Altura (mm)</label>
            <input
              type="number"
              min="20"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="flex items-center mb-4">
          <input
            id="sheetUsed"
            type="checkbox"
            checked={sheetUsed}
            onChange={() => setSheetUsed(!sheetUsed)}
            className="mr-2"
          />
          <label htmlFor="sheetUsed" className="text-sm">
            Folha de etiquetas já usada
          </label>
        </div>
        {serial && (
          <div className="flex items-center mb-4">
            <input
              id="publicLink"
              type="checkbox"
              checked={publicLink}
              onChange={() => setPublicLink(!publicLink)}
              className="mr-2"
            />
            <label htmlFor="publicLink" className="text-sm">
              Etiqueta para cliente (link público de estado)
            </label>
          </div>
        )}
        <div ref={printRef} className="p-4 border rounded" style={{ width: `${width}mm`, height: `${height}mm` }}>
          {title && <div className="text-center font-bold mb-2">{title}</div>}
          <QRCode value={qrUrl} size={128} level="Q" />
          {sheetUsed && (
            <div className="mt-2 text-xs text-red-600 text-center">Folha já utilizada</div>
          )}
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Imprimir etiqueta
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
