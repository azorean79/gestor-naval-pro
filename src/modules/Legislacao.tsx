"use client";
import React, { useState } from 'react';
import marineInsightLifeRaftOverview from '../data/legislacao/marineinsight_liferaft_overview';

export type LegislacaoItem = {
  id: number;
  titulo: string;
  referencia?: string;
  descricao?: string;
  data?: string;
  url?: string;
  detalhe?: string;
  relacionados?: Array<{ titulo: string; url: string }>;
};

export function sampleLegislacao(): LegislacaoItem[] {
  return [
    { id: 1, titulo: 'Regulamento de Segurança Marítima', referencia: 'RM-001/2024', descricao: 'Regras básicas de segurança para tripulações e passageiros.', data: '2024-01-15' },
    { id: 2, titulo: 'Código de Navegação', referencia: 'CN-2018', descricao: 'Compilado de leis aplicáveis à navegação nacional.', data: '2018-07-01' },
    { id: 3, titulo: 'Decreto-Lei nº 248/2000 — (secções sobre jangadas)', referencia: 'DL-248/2000', descricao: `Inclui definições e regras aplicáveis às embarcações ligeiras e jangadas. Texto oficial disponível em Diário da República. As secções relativas a jangadas tratam de regras de registo, equipamentos mínimos, e requisitos de segurança específicos para este tipo de embarcação.`, data: '2000-10-20' },
    {
      id: 4,
      titulo: 'Decreto-Lei n.º 103/95, de 19 de maio',
      referencia: 'Diário da República n.º 116/1995, Série I-A',
      descricao: 'Estabelece o regime da aprovação e certificação das estações de serviço competentes para revisões periódicas de jangadas pneumáticas e libertadores hidrostáticos automáticos.',
      data: '1995-05-19',
      url: 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/103-1995-501873',
      relacionados: [
        {
          titulo: 'Portaria n.º 1232/95, de 11 de outubro',
          url: 'https://diariodarepublica.pt/dr/detalhe/portaria/1232-1995-663346',
        },
      ],
    },
    {
      id: 5,
      titulo: 'Portaria n.º 1232/95, de 11 de outubro',
      referencia: 'Diário da República n.º 235/1995, Série I-B',
      descricao: 'Estabelece as condições de aprovação e certificação das estações de serviço para revisão de jangadas pneumáticas, regras das revisões periódicas e taxas aplicáveis.',
      data: '1995-10-11',
      url: 'https://diariodarepublica.pt/dr/detalhe/portaria/1232-1995-663346',
      relacionados: [
        {
          titulo: 'Decreto-Lei n.º 103/95, de 19 de maio',
          url: 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/103-1995-501873',
        },
      ],
    },
    { id: 6, titulo: 'Anatomia de uma jangada / liferaft', referencia: 'Viking / SurvivalAtSea (resumo)', descricao: `Resumo dos elementos estruturais e equipamentos típicos de uma jangada (liferaft):
- Tubos de flutuação (buoyancy tubes): mantêm a jangada à tona e formam a estrutura exterior.
- Forro / piso isolante: protege ocupantes do frio da água (presente em rafts SOLAS A/B).
- Capota / dossel (canopy): protege do vento e spray; pode incluir telas transparentes e entradas seláveis.
- Balastagem (ballast/ballast bags): confere estabilidade e resistência a viragem em ondas.
- Sistema de enchimento (inflation system): válvula automática/manual e cilindro de gás para inflar o envelope.
- Escada/degrau de embarque e pega de agarre (boarding ladder/grab lines): ajudam a subir a bordo.
- Âncora de mar (sea anchor) e respectiva amarra (painter): para manter a jangada orientada e próxima à embarcação.
- Compartimentos de armazenamento e bolsas para equipamento (kits de emergência, água, alimentos, sinalização).
- Acessórios: espelho de sinalização, apito, lanternas, kits de reparo, bombas de ar de topping-up, faca flutuante, kit de pesca e utensílios básicos.
Este resumo foi integrado para referência na aplicação; para texto completo consulte fontes técnicas e artigos (por exemplo, Viking Life).`,
      detalhe: marineInsightLifeRaftOverview,
    }
  ];
}

export default function LegislacaoList({ items }: { items: LegislacaoItem[] }) {
  const [openContent, setOpenContent] = useState<string | null>(null);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Legislação</h2>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.id} className="border rounded p-3 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{i.titulo}</div>
                <div className="text-sm text-gray-600">{i.referencia} {i.data ? `· ${i.data}` : ''}</div>
                {i.descricao && <div className="mt-2 text-sm">{i.descricao}</div>}
                {i.url && (
                  <a href={i.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
                    Abrir no Diário da República
                  </a>
                )}
                {i.relacionados && i.relacionados.length > 0 && (
                  <div className="mt-2 text-xs text-gray-700">
                    <span className="font-semibold">Diploma relacionado:</span>{" "}
                    {i.relacionados.map((rel, idx) => (
                      <React.Fragment key={`${i.id}-${idx}`}>
                        {idx > 0 ? " · " : null}
                        <a href={rel.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                          {rel.titulo}
                        </a>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button className="text-sm px-2 py-1 bg-blue-600 text-white rounded" onClick={() => {
                  setOpenContent(i.detalhe || i.descricao || null);
                }}>Ver</button>
                <button className="text-sm px-2 py-1 bg-yellow-400 rounded">Editar</button>
                <button className="text-sm px-2 py-1 bg-red-500 text-white rounded">Apagar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {openContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full p-6 rounded shadow-lg overflow-auto max-h-[80vh]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Conteúdo</h3>
              <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => setOpenContent(null)}>Fechar</button>
            </div>
            <pre className="whitespace-pre-wrap text-sm">{openContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
