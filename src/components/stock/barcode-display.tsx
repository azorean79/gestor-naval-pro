'use client';

import React, { useRef } from 'react';
import Barcode from 'react-barcode';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export function BarcodeDisplay({
  value,
  width = 2,
  height = 100,
  displayValue = true,
  fontSize = 12,
  className = ''
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (barcodeRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Código de Barras - ${value}</title>
              <style>
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  font-family: Arial, sans-serif;
                }
                .barcode-container {
                  text-align: center;
                  padding: 20px;
                }
                .barcode-info {
                  margin-top: 10px;
                  font-size: 14px;
                  color: #666;
                }
                @media print {
                  body { height: auto; }
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                ${barcodeRef.current.innerHTML}
                <div class="barcode-info">
                  <strong>Ref: ${value}</strong>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className={`barcode-display ${className}`}>
      <div ref={barcodeRef}>
        <Barcode
          value={value}
          width={width}
          height={height}
          displayValue={displayValue}
          fontSize={fontSize}
          margin={10}
        />
      </div>
      <button
        onClick={handlePrint}
        className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        type="button"
      >
        🖨️ Imprimir
      </button>
    </div>
  );
}

interface StockLabelProps {
  stockItem: {
    id: string;
    nome: string;
    descricao?: string | null;
    refOrey?: string | null;
    refFabricante?: string | null;
    lote?: string | null;
    codigoBarra?: string | null;
    imagem?: string | null;
    categoria: string;
    fornecedor?: string | null;
  };
  showImage?: boolean;
  labelSize?: 'small' | 'medium' | 'large';
}

export function StockLabel({
  stockItem,
  showImage = true,
  labelSize = 'medium'
}: StockLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    small: 'w-48 h-32',
    medium: 'w-64 h-40',
    large: 'w-80 h-48'
  };

  const fontSizes = {
    small: { title: 'text-sm', text: 'text-xs' },
    medium: { title: 'text-base', text: 'text-sm' },
    large: { title: 'text-lg', text: 'text-base' }
  };

  const barcodeValue = stockItem.codigoBarra || stockItem.refOrey;

  const handlePrintLabel = () => {
    if (labelRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Etiqueta - ${stockItem.nome}</title>
              <style>
                @page {
                  size: auto;
                  margin: 5mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Courier New', monospace;
                  background: white;
                }
                .label-container {
                  width: 100%;
                  max-width: 300px;
                  margin: 0 auto;
                  padding: 8px;
                  border: 1px solid #ccc;
                  background: white;
                  page-break-inside: avoid;
                }
                .label-header {
                  text-align: center;
                  border-bottom: 1px solid #000;
                  padding-bottom: 4px;
                  margin-bottom: 6px;
                }
                .label-title {
                  font-weight: bold;
                  font-size: 14px;
                  margin: 0;
                }
                .label-ref {
                  font-size: 10px;
                  color: #666;
                  margin: 2px 0;
                }
                .label-image {
                  text-align: center;
                  margin: 4px 0;
                }
                .label-image img {
                  max-width: 60px;
                  max-height: 40px;
                  object-fit: contain;
                }
                .label-barcode {
                  text-align: center;
                  margin: 4px 0;
                }
                .label-info {
                  font-size: 8px;
                  line-height: 1.2;
                  margin: 2px 0;
                }
                .label-footer {
                  text-align: center;
                  font-size: 6px;
                  color: #999;
                  border-top: 1px solid #ccc;
                  padding-top: 2px;
                  margin-top: 4px;
                }
                @media print {
                  body { background: white !important; }
                  .label-container { border: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="label-container">
                <div class="label-header">
                  <div class="label-title">${stockItem.nome}</div>
                  ${stockItem.refOrey ? `<div class="label-ref">Ref: ${stockItem.refOrey}</div>` : ''}
                </div>

                ${showImage && stockItem.imagem ? `
                  <div class="label-image">
                    <img src="${stockItem.imagem}" alt="${stockItem.nome}" />
                  </div>
                ` : ''}

                ${barcodeValue ? `
                  <div class="label-barcode">
                    <img src="data:image/svg+xml;base64,${btoa(generateBarcodeSVG(barcodeValue))}" alt="Barcode" style="max-width: 200px; height: 60px;" />
                  </div>
                ` : ''}

                <div class="label-info">
                  ${stockItem.descricao ? `<div>Desc: ${stockItem.descricao.substring(0, 50)}${stockItem.descricao.length > 50 ? '...' : ''}</div>` : ''}
                  ${stockItem.refFabricante ? `<div>Fab: ${stockItem.refFabricante}</div>` : ''}
                  ${stockItem.lote ? `<div>Lote: ${stockItem.lote}</div>` : ''}
                  ${stockItem.fornecedor ? `<div>Forn: ${stockItem.fornecedor}</div>` : ''}
                  <div>Cat: ${stockItem.categoria}</div>
                </div>

                <div class="label-footer">
                  Gestor Naval Pro - ${new Date().toLocaleDateString('pt-PT')}
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Função auxiliar para gerar SVG do código de barras
  const generateBarcodeSVG = (value: string): string => {
    // Esta é uma implementação simplificada - em produção, use uma biblioteca
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
      <rect width="200" height="60" fill="white"/>
      <text x="100" y="35" text-anchor="middle" font-family="monospace" font-size="12">${value}</text>
      <rect x="20" y="10" width="160" height="30" fill="none" stroke="black" stroke-width="1"/>
      <line x1="25" y1="15" x2="25" y2="35" stroke="black" stroke-width="2"/>
      <line x1="35" y1="15" x2="35" y2="35" stroke="black" stroke-width="1"/>
      <line x1="45" y1="15" x2="45" y2="35" stroke="black" stroke-width="2"/>
      <line x1="55" y1="15" x2="55" y2="35" stroke="black" stroke-width="1"/>
      <line x1="65" y1="15" x2="65" y2="35" stroke="black" stroke-width="2"/>
      <line x1="75" y1="15" x2="75" y2="35" stroke="black" stroke-width="1"/>
      <line x1="85" y1="15" x2="85" y2="35" stroke="black" stroke-width="2"/>
      <line x1="95" y1="15" x2="95" y2="35" stroke="black" stroke-width="1"/>
      <line x1="105" y1="15" x2="105" y2="35" stroke="black" stroke-width="2"/>
      <line x1="115" y1="15" x2="115" y2="35" stroke="black" stroke-width="1"/>
      <line x1="125" y1="15" x2="125" y2="35" stroke="black" stroke-width="2"/>
      <line x1="135" y1="15" x2="135" y2="35" stroke="black" stroke-width="1"/>
      <line x1="145" y1="15" x2="145" y2="35" stroke="black" stroke-width="2"/>
      <line x1="155" y1="15" x2="155" y2="35" stroke="black" stroke-width="1"/>
      <line x1="165" y1="15" x2="165" y2="35" stroke="black" stroke-width="2"/>
      <line x1="175" y1="15" x2="175" y2="35" stroke="black" stroke-width="1"/>
    </svg>`;
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${sizeClasses[labelSize]} p-3`} ref={labelRef}>
      {/* Cabeçalho da etiqueta */}
      <div className="text-center border-b pb-2 mb-2">
        <h3 className={`font-bold ${fontSizes[labelSize].title} truncate`}>
          {stockItem.nome}
        </h3>
        {stockItem.refOrey && (
          <p className={`text-gray-600 ${fontSizes[labelSize].text}`}>
            Ref: {stockItem.refOrey}
          </p>
        )}
      </div>

      {/* Imagem do item */}
      {showImage && stockItem.imagem && (
        <div className="flex justify-center mb-2">
          <img
            src={stockItem.imagem}
            alt={stockItem.nome}
            className="max-w-16 max-h-12 object-contain rounded"
          />
        </div>
      )}

      {/* Código de barras */}
      {barcodeValue && (
        <div className="flex justify-center mb-2">
          <Barcode
            value={barcodeValue}
            width={1.5}
            height={labelSize === 'small' ? 40 : labelSize === 'medium' ? 50 : 60}
            displayValue={false}
            margin={2}
          />
        </div>
      )}

      {/* Informações adicionais */}
      <div className={`space-y-1 ${fontSizes[labelSize].text}`}>
        {stockItem.descricao && (
          <p className="truncate">
            <span className="font-medium">Desc:</span> {stockItem.descricao}
          </p>
        )}
        {stockItem.refFabricante && (
          <p className="truncate">
            <span className="font-medium">Fab:</span> {stockItem.refFabricante}
          </p>
        )}
        {stockItem.lote && (
          <p className="truncate">
            <span className="font-medium">Lote:</span> {stockItem.lote}
          </p>
        )}
        {stockItem.fornecedor && (
          <p className="truncate">
            <span className="font-medium">Forn:</span> {stockItem.fornecedor}
          </p>
        )}
        <p className="truncate">
          <span className="font-medium">Cat:</span> {stockItem.categoria}
        </p>
      </div>

      {/* Botão de impressão */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={handlePrintLabel}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          type="button"
        >
          🖨️ Imprimir Etiqueta
        </button>
      </div>
    </div>
  );
}

interface StockBarcodeProps {
  stockItem: {
    id: string;
    nome: string;
    descricao?: string | null;
    refOrey?: string | null;
    refFabricante?: string | null;
    lote?: string | null;
    codigoBarra?: string | null;
    imagem?: string | null;
    categoria: string;
    fornecedor?: string | null;
  };
}

export function StockBarcode({ stockItem }: StockBarcodeProps) {
  const barcodeValue = stockItem.codigoBarra || stockItem.refOrey;

  if (!barcodeValue) {
    return (
      <div className="text-center text-gray-500 p-4 border-2 border-dashed border-gray-300 rounded">
        <p>❌ Sem referência para gerar código de barras</p>
        <p className="text-sm mt-1">
          Configure refOrey ou gere código de barras primeiro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Código de barras simples */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-lg">{stockItem.nome}</h3>
          <p className="text-sm text-gray-600">
            {stockItem.refOrey && `Ref OREY: ${stockItem.refOrey}`}
          </p>
          {stockItem.codigoBarra && (
            <p className="text-xs text-gray-500 mt-1">
              Código: {stockItem.codigoBarra}
            </p>
          )}
        </div>

        <BarcodeDisplay
          value={barcodeValue}
          width={2}
          height={80}
          displayValue={true}
          fontSize={14}
          className="flex flex-col items-center"
        />
      </div>

      {/* Etiqueta completa */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3 text-center">Etiqueta Completa</h4>
        <StockLabel stockItem={stockItem} showImage={true} labelSize="medium" />
      </div>
    </div>
  );
}