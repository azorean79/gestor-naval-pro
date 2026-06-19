import prisma from "@/lib/prisma";
import { parseFlexibleDate } from "./agenda-sync";
import { resolveMandatoryPackItemsForRaftAsync } from "@/lib/custom-pack-types";

type RichChecklist = Record<string, any>;

/**
 * Sincroniza a lista de artigos físicos da jangada (ArtigoJangada) 
 * com o que é esperado pelo Tipo de Pack (SOLAS A/B, etc) e Lotação.
 */
export async function syncRaftArticlesWithPackType(jangadaId: number) {
  const raft = await prisma.jangada.findUnique({
    where: { id: jangadaId },
    include: { artigos: true }
  });

  if (!raft) return { success: false, message: "Jangada não encontrada." };

  const resolvedPack = await resolveMandatoryPackItemsForRaftAsync({
    brand: raft.brand,
    model: raft.model,
    packType: raft.packType,
    capacity: raft.capacity
  });
  const expectedItems = resolvedPack.items;

  const summary = {
    added: 0,
    updated: 0,
    removed: 0, // Normalmente não removemos para preservar histórico, mas poderíamos se o user pedir
    total: expectedItems.length
  };

  for (const item of expectedItems) {
    // Tenta encontrar um artigo existente que coincida por nome ou por um dos tokens do manual
    const existing = raft.artigos.find(a => {
      const dbRef = String(a.referencia || '').trim().toUpperCase();
      const dbName = a.name.toUpperCase();
      const matchByReference = item.stockReferences.some(ref => String(ref || '').trim().toUpperCase() === dbRef);
      const matchByName = dbName.includes(item.label.toUpperCase()) || item.label.toUpperCase().includes(dbName);
      const matchByTokens = item.articleTokens.some(t => dbName.includes(t.toUpperCase()));
      return matchByReference || matchByName || matchByTokens;
    });

    if (existing) {
      if (existing.quantidade !== item.quantity) {
        await (prisma as any).artigoJangada.update({
          where: { id: existing.id },
          data: { 
            quantidade: item.quantity,
            updatedAt: new Date()
          }
        });
        summary.updated++;
      }
    } else {
      // Criar novo artigo obrigatório se não existir
      await (prisma as any).artigoJangada.create({
        data: {
          jangadaId: raft.id,
          name: item.label,
          quantidade: item.quantity,
          referencia: item.reference || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      summary.added++;
    }
  }

  return { success: true, summary };
}

/**
 * Aplica os valores preenchidos na Rich Checklist (baseada em manuais) 
 * diretamente nos campos da Jangada e seus artigos associados.
 */
export async function syncRichChecklistToRaft(jangadaId: number, richChecklist: RichChecklist) {
  if (!richChecklist) return;

  const raft = await prisma.jangada.findUnique({
    where: { id: jangadaId },
    include: { artigos: true }
  });

  if (!raft) return;

  const updateData: any = {};
  

  // Mapeamentos diretos de campos da checklist para o modelo Jangada
  const directMappings: Record<string, string> = {
    "dataInspecao": "dataInspecao",
    "dataProxInspecao": "dataProxInspecao",
    "data_proxima_inspecao": "dataProxInspecao",
    "hru_validade": "hruValidade",
    "radar_reflector_validade": "radarReflectorValidade",
    "cilindro_data_teste": "cylinderDataTeste",
    "cilindro_data_prox_teste": "cylinderDataProxTeste",
    "cylinder_data_prox_teste": "cylinderDataProxTeste",
  };

  for (const [checklistKey, dbKey] of Object.entries(directMappings)) {
    if (richChecklist[checklistKey]) {
      const date = parseFlexibleDate(richChecklist[checklistKey]);
      if (date) {
        updateData[dbKey] = date.toISOString().slice(0, 10);
      } else {
        updateData[dbKey] = String(richChecklist[checklistKey]);
      }
    }
  }

  // Atualizar Jangada
  if (Object.keys(updateData).length > 0) {
    await prisma.jangada.update({
      where: { id: jangadaId },
      data: updateData
    });
  }

  // Sincronizar Validades de Artigos (Ambulância, Pirotécnicos, etc.)
  // Mapeamento de validityFieldName (definido em mandatoryPack.ts) para termos de pesquisa nos Artigos
  const articleMappings: Record<string, string[]> = {
    "validade_paraquedas": ["PARAQUEDAS", "PARACHUTE", "ROCKET"],
    "validade_fachos_mao": ["FACHO", "HAND FLARE"],
    "validade_potes_fumo": ["FUMO", "SMOKE"],
    "validade_pilhas_lanterna": ["PILHA", "BATTERY", "TORCH"],
    "validade_farmacia": ["FARMACIA", "AMBULANCIA", "FIRST AID", "MEDICINE"],
    "validade_comprimidos": ["COMPRIMIDO", "SICKNESS", "ANTI-ENJOO"],
    "validade_agua": ["AGUA", "WATER"],
    "validade_racoes": ["RACAO", "FOOD"],
  };

  for (const [checklistKey, keywords] of Object.entries(articleMappings)) {
    const newValidade = richChecklist[checklistKey];
    if (newValidade) {
      const parsedValidade = parseFlexibleDate(newValidade);
      if (!parsedValidade) continue;

      // Encontrar o artigo correspondente na jangada
      const matchedArtigo = raft.artigos.find(a => 
        keywords.some(k => a.name.toUpperCase().includes(k))
      );

      if (matchedArtigo) {
        await (prisma as any).artigoJangada.update({
          where: { id: matchedArtigo.id },
          data: { 
            validade: parsedValidade,
            updatedAt: new Date()
          }
        });
      }
    }
  }
}
