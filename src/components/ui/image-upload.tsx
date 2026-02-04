'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageUpload: (file: File) => Promise<string>;
  onImageRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  currentImage,
  onImageUpload,
  onImageRemove,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload da imagem
      const imageUrl = await onImageUpload(file);
      setPreview(imageUrl);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      setPreview(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`image-upload ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        <div className="relative group border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-contain rounded"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClick}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-1" />
                Alterar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            disabled || isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          {isUploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Enviando...</p>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-1">
                {disabled ? 'Upload desabilitado' : 'Clique para adicionar imagem'}
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG até 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook personalizado para upload de imagens
export function useImageUpload() {
  const uploadImage = async (file: File): Promise<string> => {
    // Simulação de upload - em produção, implemente o upload real para um serviço de storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Em produção, faça upload para um serviço como AWS S3, Cloudinary, etc.
        // Por enquanto, retornamos uma data URL
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  return { uploadImage };
}