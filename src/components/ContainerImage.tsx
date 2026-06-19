import React from "react";

// Mapeamento entre modelo do contentor, lotação e imagem
const containerImages: Record<string, string> = {
  // Exemplo: 'MK10-20': '/images/containers/mk10-20.png',
  'MK10-20': '/images/containers/mk10-20.png',
  'MK10-16': '/images/containers/mk10-16.png',
  'MK14-16': '/images/containers/mk14-16.png',
  // Adicione outros conforme necessário
};

interface ContainerImageProps {
  containerModel: string;
  lotacao: number | string;
  style?: React.CSSProperties;
}

export const ContainerImage: React.FC<ContainerImageProps> = ({ containerModel, lotacao, style }) => {
  const key = `${containerModel}-${lotacao}`;
  const imageUrl = containerImages[key];

  if (!containerModel || !lotacao) return null;

  return (
    <div style={{ textAlign: 'center', margin: '16px 0' }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Contentor ${containerModel} - Lotação ${lotacao}`}
          style={{ maxWidth: 400, width: '100%', ...style }}
        />
      ) : (
        <span style={{ color: '#888' }}>Imagem técnica não disponível</span>
      )}
    </div>
  );
};
