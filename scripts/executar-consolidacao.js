#!/usr/bin/env node

/**
 * Script para executar a consolidação de embarcações duplicadas
 * Transfere dados e remove duplicados de forma segura com transação
 */

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

// Configurar variáveis de ambiente
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const connectionString = process.env.DATABASE_URL;

async function main() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando consolidação de embarcações duplicadas...\n');
    
    // Começar transação
    await client.query('BEGIN;');
    console.log('✅ Transação iniciada\n');

    // Executar consolidação (exemplos de alguns grupos)
    const operacoes = [
      // ANA BEATRIZ
      {
        manter: 'cml7tremd0000ez1otov1q9r7',
        remover: ['cml9ovoaw008wr8v4n4fxxicb'],
        nome: 'ANA BEATRIZ'
      },
      // AQUILA
      {
        manter: 'cml746swd000gmov4uglhovjl',
        remover: ['cml9otzyq0007r8v4vb9wb94q'],
        nome: 'AQUILA'
      },
      // Adventure II
      {
        manter: 'cml73obn80023eb28074hl3mi',
        remover: ['cml747v6k001k5ov47gia8jt6'],
        nome: 'Adventure II'
      },
      // Aqua I
      {
        manter: 'cml73odgv002aeb285u5pjfwq',
        remover: ['cml747w7b001r5ov4wcqok1wt'],
        nome: 'Aqua I'
      },
      // Atlantic Dream
      {
        manter: 'cml73obuu0024eb28w2woznys',
        remover: ['cml747vc1001l5ov4gh7j9vin'],
        nome: 'Atlantic Dream'
      },
      // Atlântico II
      {
        manter: 'cml73oahl001xeb28kgshmj0q',
        remover: ['cml747uil001e5ov4zf6abol3'],
        nome: 'Atlântico II'
      },
      // Atlântico IV
      {
        manter: 'cml73o6zr0015eb28qf7mvso2',
        remover: ['cml747sax000m5ov4xee4lqg8'],
        nome: 'Atlântico IV'
      },
      // BADEJO
      {
        manter: 'cml9ofr7q004prov4r36atbgi',
        remover: ['cml9ovp0s0090r8v4d0j3ttdd'],
        nome: 'BADEJO'
      },
      // Baleeiro I
      {
        manter: 'cml73o8yv001keb28adrgob4h',
        remover: ['cml747tip00115ov47t3eurrt'],
        nome: 'Baleeiro I'
      },
      // Bom Jesus I
      {
        manter: 'cml73o6nu0012eb28rcy9qw75',
        remover: ['cml747s2u000j5ov4kpe3zj9n'],
        nome: 'Bom Jesus I'
      },
      // CAIAQUES (7 registos)
      {
        manter: 'cml9of7gs001qrov4w6g156hr',
        remover: [
          'cml9ofa8t0020rov4tcl1oyfd',
          'cml9ofek8002qrov4arhkrs6z',
          'cml9ofszf0050rov4rq7xr6bz',
          'cml9ofwme005jrov4l8ghhpne',
          'cml9og9kj007mrov4ihsp46lv',
          'cml9ogitw0092rov411z4ulig'
        ],
        nome: 'CAIAQUES'
      },
      // CAIAQUES E PRANCHAS
      {
        manter: 'cml9oez6r000drov4qxark5bx',
        remover: ['cml9ofcwd002grov4vzu4rz2i'],
        nome: 'CAIAQUES E PRANCHAS'
      },
      // CENTRAL SUB
      {
        manter: 'cml9of59u001grov4sa4xipx1',
        remover: ['cml9og6zb0076rov41yairti1'],
        nome: 'CENTRAL SUB'
      },
      // CW Explorer
      {
        manter: 'cml73od180029eb28o313kqmh',
        remover: ['cml747w1x001q5ov4plxthc40'],
        nome: 'CW Explorer'
      },
      // Caldeira III
      {
        manter: 'cml73o8uw001jeb28kaz8dl8q',
        remover: ['cml747tfw00105ov444myxno2'],
        nome: 'Caldeira III'
      },
      // Caldeirinha II
      {
        manter: 'cml73o9vc001seb28xaup90f1',
        remover: ['cml747u6300195ov42jyuzdaw'],
        nome: 'Caldeirinha II'
      },
      // Calheta I
      {
        manter: 'cml73o9nm001qeb28fbrfvtu5',
        remover: ['cml747u1000175ov4r5td1u4k'],
        nome: 'Calheta I'
      },
      // Corvense I
      {
        manter: 'cml73oadp001web288cjz4tuc',
        remover: ['cml747ufq001d5ov4imgbdacu'],
        nome: 'Corvense I'
      },
      // ESTRELA
      {
        manter: 'cml746u1g000omov42nbjsdew',
        remover: ['cml9oxhov000fo4v4vmvdouiy'],
        nome: 'ESTRELA'
      },
    ];

    let grupos = 0;
    let duplicados = 0;

    for (const grupo of operacoes) {
      console.log(`📋 Consolidando: ${grupo.nome}`);
      
      // Transferir dados de todas as tabelas relacionadas
      for (const removerID of grupo.remover) {
        // Inspecoes
        await client.query(
          'UPDATE "Inspecao" SET "navioId" = $1 WHERE "navioId" = $2',
          [grupo.manter, removerID]
        );
        
        // Certificados
        await client.query(
          'UPDATE "Certificado" SET "navioId" = $1 WHERE "navioId" = $2',
          [grupo.manter, removerID]
        );
        
        // Jangadas
        await client.query(
          'UPDATE "Jangada" SET "navioId" = $1 WHERE "navioId" = $2',
          [grupo.manter, removerID]
        );
        
        // Agendamentos
        await client.query(
          'UPDATE "Agendamento" SET "navioId" = $1 WHERE "navioId" = $2',
          [grupo.manter, removerID]
        );
        
        // Faturas
        await client.query(
          'UPDATE "Fatura" SET "navioId" = $1 WHERE "navioId" = $2',
          [grupo.manter, removerID]
        );
        
        // Notificacoes
        await client.query(
          'UPDATE "Notificacao" SET "navioId" = $1 WHERE "navioId" = $2',
          [grupo.manter, removerID]
        );
        
        duplicados++;
      }
      
      // Remover registos duplicados
      const placeholders = grupo.remover.map((_, i) => `$${i + 1}`).join(',');
      await client.query(
        `DELETE FROM "Navio" WHERE id IN (${placeholders})`,
        grupo.remover
      );
      
      console.log(`  ✅ Removidos ${grupo.remover.length} duplicado(s)\n`);
      grupos++;
    }

    // Confirmar transação
    await client.query('COMMIT;');
    console.log(`\n✨ Consolidação concluída com sucesso!`);
    console.log(`\n📊 Resumo:`);
    console.log(`  ✅ Grupos processados: ${grupos}`);
    console.log(`  ✅ Duplicados removidos: ${duplicados}`);
    console.log(`  📈 Embarcações mantidas: ${grupos + duplicados - duplicados}\n`);

  } catch (erro) {
    console.error('❌ Erro durante consolidação:', erro.message);
    console.log('\n🔄 Revertendo transação...');
    try {
      await client.query('ROLLBACK;');
      console.log('✅ Transação revertida com sucesso\n');
    } catch (rollbackError) {
      console.error('❌ Erro ao reverter transação:', rollbackError.message);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar script
main();
