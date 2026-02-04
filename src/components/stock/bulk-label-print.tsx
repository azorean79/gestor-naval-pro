'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Settings, Eye, Package } from 'lucide-react';
import { StockLabel } from './barcode-display';

interface StockItem {
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
  quantidade: number;
}

interface LabelPrintConfig {
  itemsPerPage: number; // etiquetas por folha
  columns: number; // colunas por linha
  rows: number; // linhas por página
  labelSize: 'small' | 'medium' | 'large';
  showImage: boolean;
  marginTop: number;
  marginLeft: number;
  marginRight: number;
  marginBottom: number;
  spacingHorizontal: number;
  spacingVertical: number;
}

interface BulkLabelPrintProps {
  stockItems: StockItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkLabelPrint({ stockItems, open, onOpenChange }: BulkLabelPrintProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [config, setConfig] = useState<LabelPrintConfig>({
    itemsPerPage: 24, // 24 etiquetas por folha A4
    columns: 4, // 4 colunas
    rows: 6, // 6 linhas
    labelSize: 'small',
    showImage: true,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    spacingHorizontal: 5,
    spacingVertical: 5,
  });
  const [showPreview, setShowPreview] = useState(false);

  // Calcular dimensões baseadas na configuração
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm

  const availableWidth = pageWidth - config.marginLeft - config.marginRight;
  const availableHeight = pageHeight - config.marginTop - config.marginBottom;

  const labelWidth = (availableWidth - (config.columns - 1) * config.spacingHorizontal) / config.columns;
  const labelHeight = (availableHeight - (config.rows - 1) * config.spacingVertical) / config.rows;

  // Preparar itens para impressão
  const printItems = useMemo(() => {
    const items: Array<{ item: StockItem; quantity: number }> = [];

    selectedItems.forEach(itemId => {
      const item = stockItems.find(i => i.id === itemId);
      const quantity = quantities[itemId] || 1;

      if (item) {
        for (let i = 0; i < quantity; i++) {
          items.push({ item, quantity: 1 });
        }
      }
    });

    return items;
  }, [selectedItems, quantities, stockItems]);

  const totalLabels = printItems.length;
  const totalPages = Math.ceil(totalLabels / config.itemsPerPage);

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      const newQuantities = { ...quantities };
      delete newQuantities[itemId];
      setQuantities(newQuantities);
    } else {
      newSelected.add(itemId);
      setQuantities(prev => ({ ...prev, [itemId]: 1 }));
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const handleSelectAll = () => {
    if (selectedItems.size === stockItems.length) {
      setSelectedItems(new Set());
      setQuantities({});
    } else {
      const allIds = new Set(stockItems.map(item => item.id));
      setSelectedItems(allIds);
      const newQuantities: Record<string, number> = {};
      stockItems.forEach(item => {
        newQuantities[item.id] = 1;
      });
      setQuantities(newQuantities);
    }
  };

  const handlePrint = () => {
    if (printItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsPerPage = config.columns * config.rows;
    const pages: Array<typeof printItems> = [];

    // Dividir itens em páginas
    for (let i = 0; i < printItems.length; i += itemsPerPage) {
      pages.push(printItems.slice(i, i + itemsPerPage));
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão de Etiquetas - ${totalLabels} etiquetas</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              background: white;
            }
            .page {
              width: 210mm;
              height: 297mm;
              position: relative;
              page-break-after: always;
              background: white;
            }
            .page:last-child {
              page-break-after: avoid;
            }
            .label-grid {
              display: grid;
              grid-template-columns: repeat(${config.columns}, 1fr);
              grid-template-rows: repeat(${config.rows}, 1fr);
              gap: ${config.spacingVertical}mm ${config.spacingHorizontal}mm;
              padding: ${config.marginTop}mm ${config.marginRight}mm ${config.marginBottom}mm ${config.marginLeft}mm;
              height: 100%;
              box-sizing: border-box;
            }
            .label-cell {
              border: 1px solid #ccc;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              overflow: hidden;
            }
            .label-content {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2px;
              box-sizing: border-box;
            }
            .label-title {
              font-weight: bold;
              font-size: 10px;
              text-align: center;
              margin-bottom: 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
            }
            .label-ref {
              font-size: 8px;
              color: #666;
              margin-bottom: 2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
            }
            .label-barcode {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 2px 0;
            }
            .label-barcode img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .label-image {
              margin: 2px 0;
            }
            .label-image img {
              max-width: 20px;
              max-height: 15px;
              object-fit: contain;
            }
            .label-info {
              font-size: 6px;
              text-align: center;
              color: #999;
            }
            @media print {
              body { background: white !important; }
              .page { page-break-after: always; }
              .page:last-child { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
    `);

    pages.forEach((pageItems, pageIndex) => {
      printWindow.document.write(`<div class="page"><div class="label-grid">`);

      // Preencher a página com itens ou células vazias
      for (let i = 0; i < itemsPerPage; i++) {
        const itemData = pageItems[i];

        if (itemData) {
          const { item } = itemData;
          const barcodeValue = item.codigoBarra || item.refOrey;

          printWindow.document.write(`
            <div class="label-cell">
              <div class="label-content">
                <div class="label-title">${item.nome}</div>
                ${item.refOrey ? `<div class="label-ref">Ref: ${item.refOrey}</div>` : ''}
                ${barcodeValue ? `
                  <div class="label-barcode">
                    <img src="data:image/svg+xml;base64,${btoa(generateBarcodeSVG(barcodeValue))}" alt="Barcode" />
                  </div>
                ` : ''}
                ${config.showImage && item.imagem ? `
                  <div class="label-image">
                    <img src="${item.imagem}" alt="${item.nome}" />
                  </div>
                ` : ''}
                <div class="label-info">
                  ${item.categoria}
                </div>
              </div>
            </div>
          `);
        } else {
          // Célula vazia
          printWindow.document.write(`<div class="label-cell"></div>`);
        }
      }

      printWindow.document.write(`</div></div>`);
    });

    printWindow.document.write(`
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // Função auxiliar para gerar SVG do código de barras
  const generateBarcodeSVG = (value: string): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30">
      <rect width="100" height="30" fill="white"/>
      <text x="50" y="20" text-anchor="middle" font-family="monospace" font-size="8">${value}</text>
      <rect x="10" y="5" width="80" height="20" fill="none" stroke="black" stroke-width="1"/>
      <line x1="15" y1="8" x2="15" y2="22" stroke="black" stroke-width="1"/>
      <line x1="25" y1="8" x2="25" y2="22" stroke="black" stroke-width="1"/>
      <line x1="35" y1="8" x2="35" y2="22" stroke="black" stroke-width="1"/>
      <line x1="45" y1="8" x2="45" y2="22" stroke="black" stroke-width="1"/>
      <line x1="55" y1="8" x2="55" y2="22" stroke="black" stroke-width="1"/>
      <line x1="65" y1="8" x2="65" y2="22" stroke="black" stroke-width="1"/>
      <line x1="75" y1="8" x2="75" y2="22" stroke="black" stroke-width="1"/>
      <line x1="85" y1="8" x2="85" y2="22" stroke="black" stroke-width="1"/>
    </svg>`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Imprimir Etiquetas de Stock
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seleção de Itens */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Selecionar Itens</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedItems.size === stockItems.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {stockItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={item.id}
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <p className="font-medium truncate">{item.nome}</p>
                            <Badge variant="outline" className="text-xs">
                              {item.categoria}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {item.refOrey && <p>Ref: {item.refOrey}</p>}
                            {item.fornecedor && <p>Forn: {item.fornecedor}</p>}
                            <p>Qtd: {item.quantidade}</p>
                          </div>
                        </div>
                        {selectedItems.has(item.id) && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${item.id}`} className="text-sm">
                              Etiquetas:
                            </Label>
                            <Input
                              id={`qty-${item.id}`}
                              type="number"
                              min="1"
                              value={quantities[item.id] || 1}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedItems.size > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>{selectedItems.size}</strong> itens selecionados
                        • <strong>{totalLabels}</strong> etiquetas no total
                        • <strong>{totalPages}</strong> página{totalPages !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Configurações */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Colunas</Label>
                      <Select
                        value={config.columns.toString()}
                        onValueChange={(value) => {
                          const columns = parseInt(value);
                          setConfig(prev => ({
                            ...prev,
                            columns,
                            itemsPerPage: columns * prev.rows
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 colunas</SelectItem>
                          <SelectItem value="3">3 colunas</SelectItem>
                          <SelectItem value="4">4 colunas</SelectItem>
                          <SelectItem value="5">5 colunas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Linhas</Label>
                      <Select
                        value={config.rows.toString()}
                        onValueChange={(value) => {
                          const rows = parseInt(value);
                          setConfig(prev => ({
                            ...prev,
                            rows,
                            itemsPerPage: prev.columns * rows
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 linhas</SelectItem>
                          <SelectItem value="5">5 linhas</SelectItem>
                          <SelectItem value="6">6 linhas</SelectItem>
                          <SelectItem value="7">7 linhas</SelectItem>
                          <SelectItem value="8">8 linhas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Tamanho da Etiqueta</Label>
                    <Select
                      value={config.labelSize}
                      onValueChange={(value: 'small' | 'medium' | 'large') =>
                        setConfig(prev => ({ ...prev, labelSize: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequena</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showImage"
                      checked={config.showImage}
                      onCheckedChange={(checked) =>
                        setConfig(prev => ({ ...prev, showImage: !!checked }))
                      }
                    />
                    <Label htmlFor="showImage" className="text-sm">
                      Mostrar imagem
                    </Label>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Dimensões calculadas:</strong><br />
                      Etiqueta: {labelWidth.toFixed(1)} × {labelHeight.toFixed(1)} mm<br />
                      {config.itemsPerPage} etiquetas por folha
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={totalLabels === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Pré-visualizar
            </Button>
            <Button
              onClick={handlePrint}
              disabled={totalLabels === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir ({totalLabels} etiquetas)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pré-visualização */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização - {totalLabels} etiquetas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {Array.from({ length: Math.min(totalPages, 3) }, (_, pageIndex) => {
              const startIndex = pageIndex * config.itemsPerPage;
              const pageItems = printItems.slice(startIndex, startIndex + config.itemsPerPage);

              return (
                <Card key={pageIndex}>
                  <CardHeader>
                    <CardTitle className="text-sm">Página {pageIndex + 1} de {totalPages}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="border rounded bg-white mx-auto"
                      style={{
                        width: '210mm',
                        height: '297mm',
                        transform: 'scale(0.3)',
                        transformOrigin: 'top left',
                      }}
                    >
                      <div
                        className="grid gap-1 p-2 h-full box-border"
                        style={{
                          gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                          padding: `${config.marginTop}mm ${config.marginRight}mm ${config.marginBottom}mm ${config.marginLeft}mm`,
                        }}
                      >
                        {Array.from({ length: config.itemsPerPage }, (_, i) => {
                          const itemData = pageItems[i];
                          return (
                            <div key={i} className="border border-gray-300 bg-white flex flex-col items-center justify-center p-1 text-xs">
                              {itemData ? (
                                <div className="text-center w-full h-full flex flex-col">
                                  <div className="font-bold text-xs truncate">{itemData.item.nome}</div>
                                  {itemData.item.refOrey && (
                                    <div className="text-gray-600 text-xs truncate">Ref: {itemData.item.refOrey}</div>
                                  )}
                                  <div className="flex-1 flex items-center justify-center my-1">
                                    <div className="w-8 h-4 bg-gray-200 border flex items-center justify-center text-xs">
                                      ████████
                                    </div>
                                  </div>
                                  <div className="text-gray-500 text-xs">{itemData.item.categoria}</div>
                                </div>
                              ) : (
                                <div className="text-gray-300 text-xs">Vazio</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {totalPages > 3 && (
              <p className="text-center text-gray-500 text-sm">
                ... e mais {totalPages - 3} página{totalPages - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}