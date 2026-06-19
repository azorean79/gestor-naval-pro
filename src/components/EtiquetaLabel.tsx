import React, { useEffect, useState } from 'react';
import bwipJs from 'bwip-js';
import styles from './EtiquetaLabel.module.css';

type EtiquetaLabelProps = {
  stockId: string;
  nome: string;
  codigoBarras: string;
  /** size in mm */
  width?: number;
  height?: number;
};

export const EtiquetaLabel: React.FC<EtiquetaLabelProps> = ({ stockId, nome, codigoBarras, width = 150, height = 80 }) => {
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    try {
      bwipJs.toCanvas(canvas, {
        bcid: 'code128',
        text: codigoBarras,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
      setBarcodeDataUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Barcode generation error', e);
    }
  }, [codigoBarras]);

  // Convert mm to pixels for preview (approx 3.78px per mm at 96dpi)
  const previewWidth = width * 3.78;
  const previewHeight = height * 3.78;

  return (
    <div
      className={styles.etiqueta}
      style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
    >
      <div className={styles.header}>Etiqueta Premium</div>
      <div className={styles.content}>
        <div className={styles.nome}>{nome}</div>
        {barcodeDataUrl && (
          <img src={barcodeDataUrl} alt="Código de Barras" className={styles.barcode} />
        )}
        <div className={styles.id}>ID: {stockId}</div>
      </div>
    </div>
  );
};

export default EtiquetaLabel;
