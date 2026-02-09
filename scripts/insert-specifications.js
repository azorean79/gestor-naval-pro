#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function insertSpecifications() {
  try {
    console.log('\n📊 Inserindo especificações técnicas no banco de dados...\n');

    // Ler arquivo de especificações
    const specFile = path.join(__dirname, 'manual_specifications.json');
    const specs = JSON.parse(fs.readFileSync(specFile, 'utf-8'));

    for (const [key, data] of Object.entries(specs)) {
      const { marca: marcaNome, modelo: modeloNome, especificacoes, total_paginas, total_tabelas } = data;
      
      console.log(`📝 Processando: ${marcaNome} ${modeloNome}`);

      try {
        // 1. Encontrar ou criar marca
        let marca = await prisma.marcasJangada.findFirst({
          where: { nome: marcaNome },
        });

        if (!marca) {
          marca = await prisma.marcasJangada.create({
            data: {
              nome: marcaNome,
              ativa: true,
            },
          });
          console.log(`   ✅ Marca criada: ${marca.nome} (ID: ${marca.id})`);
        } else {
          console.log(`   ⚙️  Marca encontrada: ${marca.nome}`);
        }

        // 2. Encontrar ou criar modelo
        let modelo = await prisma.modelosJangada.findFirst({
          where: {
            nome: modeloNome,
            marcaId: marca.id,
          },
        });

        if (!modelo) {
          modelo = await prisma.modelosJangada.create({
            data: {
              nome: modeloNome,
              marcaId: marca.id,
              tipo: 'SOLAS',
              ativa: true,
            },
          });
          console.log(`   ✅ Modelo criado: ${modelo.nome} (ID: ${modelo.id})`);
        } else {
          console.log(`   ⚙️  Modelo encontrado: ${modelo.nome}`);
        }

        // 3. Atualizar especificações do modelo
        if (Object.keys(especificacoes).length > 0) {
          let especificacoesDados = {};

          if (especificacoes.capacidade_minima && especificacoes.capacidade_maxima) {
            especificacoesDados.capacidadeMinima = especificacoes.capacidade_minima;
            especificacoesDados.capacidadeMaxima = especificacoes.capacidade_maxima;
          }

          if (especificacoes.peso_kg) {
            especificacoesDados.pesoKg = especificacoes.peso_kg;
          }

          if (especificacoes.temperatura_min && especificacoes.temperatura_max) {
            especificacoesDados.temperaturaMin = especificacoes.temperatura_min;
            especificacoesDados.temperaturaMax = especificacoes.temperatura_max;
          }

          if (especificacoes.dimensao) {
            especificacoesDados.dimensao = especificacoes.dimensao;
          }

          if (especificacoes.solas_certificado) {
            especificacoesDados.solasVerificado = true;
          }

          if (especificacoes.componentes && especificacoes.componentes.length > 0) {
            especificacoesDados.componentesQtd = especificacoes.componentes.length;
            especificacoesDados.componentes = JSON.stringify(especificacoes.componentes);
          }

          // Salvar como JSON no campo de especificações
          await prisma.modelosJangada.update({
            where: { id: modelo.id },
            data: {
              especificacoes: especificacoesDados,
              manual: {
                paginas: total_paginas,
                tabelas: total_tabelas,
                extratoData: new Date().toISOString(),
              },
            },
          });

          console.log(`   ✅ Especificações atualizadas`);

          // 4. Criar componentes do modelo
          if (especificacoes.componentes && especificacoes.componentes.length > 0) {
            console.log(`   📦 Criando ${especificacoes.componentes.length} componentes...`);

            for (const comp of especificacoes.componentes) {
              // Verificar se componente existe
              const componenteExistente = await prisma.inspecaoComponente.findFirst({
                where: {
                  nome: comp.nome,
                  modeloJangadaId: modelo.id,
                },
              });

              if (!componenteExistente) {
                await prisma.inspecaoComponente.create({
                  data: {
                    nome: comp.nome,
                    numero: parseInt(comp.numero) || null,
                    modeloJangadaId: modelo.id,
                    tipo: 'SPARE',
                    descricao: `Componente ${comp.numero}: ${comp.nome}`,
                  },
                });
              }
            }

            console.log(`   ✅ Componentes criados/atualizados`);
          }
        }

        console.log();
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${marcaNome} ${modeloNome}:`, error.message);
      }
    }

    console.log('✅ Inserção de especificações completa!');
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertSpecifications().catch(console.error);
