import { useState } from 'react';

/**
 * BatchLabelPrinter – UI for generating a PDF with multiple barcode labels.
 * Users paste or type one barcode per line, optionally add width/height in mm
 * using the format: CODE|WIDTH|HEIGHT (e.g., "1234567890123|50|30").
 * The component sends a POST request to /api/label/batch and opens the PDF.
 */
export default function BatchLabelPrinter() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseInput = () => {
    const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const code = parts[0];
      const widthMm = parts[1] ? Number(parts[1]) : undefined;
      const heightMm = parts[2] ? Number(parts[2]) : undefined;
      return { code, widthMm, heightMm };
    });
  };

  const handleGenerate = async () => {
    setError(null);
    const payload = parseInput();
    if (payload.length === 0) {
      setError('Insira ao menos um código de barras.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/label/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Falha ao gerar o PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-8 p-6 bg-white bg-opacity-70 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        Impressão em lote de etiquetas
      </h2>
      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Cole um código por linha ou use o formato CODE|LARGURA|ALTURA"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading}
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        type="button"
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Gerando...' : 'Gerar PDF das etiquetas'}
      </button>
    </section>
  );
}
