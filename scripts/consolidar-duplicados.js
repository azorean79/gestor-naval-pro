#!/usr/bin/env node

/**
 * Script para executar a consolidação de embarcações duplicadas usando Prisma
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Usar conexão direta à base de dados
const directUrl = process.env.DIRECT_DATABASE_URL || "postgres://6cf689fdb839385bbb4d2533ea87c0cd1db58e3dbb4f7d419345cecd0c9327e4:sk_983921VKKN1b6-rok5EQe@db.prisma.io:5432/postgres?sslmode=require&pool=true";

async function main() {
  const pool = new Pool({ connectionString: directUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Iniciando consolidação de embarcações duplicadas...\n');
    
    // Lista de grupos de duplicados com estrutura: { manter: id, remover: [ids], nome: string }
    const grupos = [
      { manter: 'cml7tremd0000ez1otov1q9r7', remover: ['cml9ovoaw008wr8v4n4fxxicb'], nome: 'ANA BEATRIZ' },
      { manter: 'cml746swd000gmov4uglhovjl', remover: ['cml9otzyq0007r8v4vb9wb94q'], nome: 'AQUILA' },
      { manter: 'cml73obn80023eb28074hl3mi', remover: ['cml747v6k001k5ov47gia8jt6'], nome: 'Adventure II' },
      { manter: 'cml73odgv002aeb285u5pjfwq', remover: ['cml747w7b001r5ov4wcqok1wt'], nome: 'Aqua I' },
      { manter: 'cml73obuu0024eb28w2woznys', remover: ['cml747vc1001l5ov4gh7j9vin'], nome: 'Atlantic Dream' },
      { manter: 'cml73oahl001xeb28kgshmj0q', remover: ['cml747uil001e5ov4zf6abol3'], nome: 'Atlântico II' },
      { manter: 'cml73o6zr0015eb28qf7mvso2', remover: ['cml747sax000m5ov4xee4lqg8'], nome: 'Atlântico IV' },
      { manter: 'cml9ofr7q004prov4r36atbgi', remover: ['cml9ovp0s0090r8v4d0j3ttdd'], nome: 'BADEJO' },
      { manter: 'cml73o8yv001keb28adrgob4h', remover: ['cml747tip00115ov47t3eurrt'], nome: 'Baleeiro I' },
      { manter: 'cml73o6nu0012eb28rcy9qw75', remover: ['cml747s2u000j5ov4kpe3zj9n'], nome: 'Bom Jesus I' },
      { 
        manter: 'cml9of7gs001qrov4w6g156hr', 
        remover: ['cml9ofa8t0020rov4tcl1oyfd', 'cml9ofek8002qrov4arhkrs6z', 'cml9ofszf0050rov4rq7xr6bz', 'cml9ofwme005jrov4l8ghhpne', 'cml9og9kj007mrov4ihsp46lv', 'cml9ogitw0092rov411z4ulig'],
        nome: 'CAIAQUES' 
      },
      { manter: 'cml9oez6r000drov4qxark5bx', remover: ['cml9ofcwd002grov4vzu4rz2i'], nome: 'CAIAQUES E PRANCHAS' },
      { manter: 'cml9of59u001grov4sa4xipx1', remover: ['cml9og6zb0076rov41yairti1'], nome: 'CENTRAL SUB' },
      { manter: 'cml73od180029eb28o313kqmh', remover: ['cml747w1x001q5ov4plxthc40'], nome: 'CW Explorer' },
      { manter: 'cml73o8uw001jeb28kaz8dl8q', remover: ['cml747tfw00105ov444myxno2'], nome: 'Caldeira III' },
      { manter: 'cml73o9vc001seb28xaup90f1', remover: ['cml747u6300195ov42jyuzdaw'], nome: 'Caldeirinha II' },
      { manter: 'cml73o9nm001qeb28fbrfvtu5', remover: ['cml747u1000175ov4r5td1u4k'], nome: 'Calheta I' },
      { manter: 'cml73oadp001web288cjz4tuc', remover: ['cml747ufq001d5ov4imgbdacu'], nome: 'Corvense I' },
      { manter: 'cml746u1g000omov42nbjsdew', remover: ['cml9oxhov000fo4v4vmvdouiy'], nome: 'ESTRELA' },
      { manter: 'cml73o8rj001ieb2851z74n6m', remover: ['cml747tdj000z5ov401sxxc2n'], nome: 'Faialense II' },
      { manter: 'cml73o9j5001peb28xbeet9m8', remover: ['cml747tyc00165ov4e198snra'], nome: 'Fajã II' },
      { manter: 'cml73oa0o001teb28sqfmgdqp', remover: ['cml747u8i001a5ov4jmeo4ovr'], nome: 'Florense I' },
      { manter: 'cml73o7io0019eb2898h0lsfa', remover: ['cml747sm7000q5ov43f27l2p9'], nome: 'Formoso I' },
      { manter: 'cml73oan0001yeb28lupaam83', remover: ['cml747uln001f5ov4yiwgflkp'], nome: 'Gonçalo Velho I' },
      { manter: 'cml73o9rs001reb28w64jx95x', remover: ['cml747u3h00185ov4e18906sy'], nome: 'Graciosense I' },
      { manter: 'cml9ouude0041r8v4aqr4vxry', remover: ['cml9ouz2v004vr8v4pienl9bv'], nome: 'Guernica' },
      { manter: 'cml73odwo002ceb28rxckih90', remover: ['cml747wi9001t5ov45aqkj2sp'], nome: 'Horta Explorer' },
      { manter: 'cml73o8mf001heb281gqd1cnk', remover: ['cml747tb3000y5ov4eir9fc1d'], nome: 'Horta I' },
      { manter: 'cml73o9fq001oeb281wgtue6g', remover: ['cml747tvq00155ov47su95i0k'], nome: 'Jorgense I' },
      { 
        manter: 'cml73o9bh001neb28ukxcxsm4', 
        remover: ['cml73oa8r001veb28scyhutep', 'cml747tt100145ov46t03272i', 'cml747ud6001c5ov4thiber63'], 
        nome: 'Lajes I' 
      },
      { manter: 'cml73o74u0016eb28hdipnszx', remover: ['cml747sdh000n5ov46fwu9974'], nome: 'Mar Azul I' },
      { manter: 'cml73oc270025eb28hgfkcyb5', remover: ['cml747vgv001m5ov4ger2dcbj'], nome: 'Moby I' },
      { manter: 'cml73oe4i002deb28ze4oel8g', remover: ['cml747wn4001u5ov4rwx480hz'], nome: 'Nature Tours I' },
      { manter: 'cml73occs0026eb28tfl4prri', remover: ['cml747vln001n5ov49jignfdc'], nome: 'Nautilus Explorer' },
      { manter: 'cml73odor002beb28qmwr6g1x', remover: ['cml747wch001s5ov4hmvgvlxn'], nome: 'Norberto I' },
      { manter: 'cml73o7m4001aeb287k2d7l04', remover: ['cml747spj000r5ov4r7qmnwti'], nome: 'Nordeste II' },
      { manter: 'cml73oclr0027eb280cj3g1zc', remover: ['cml747vrs001o5ov40rnmduti'], nome: 'Ocean Emotion I' },
      { manter: 'cml73ob5w0021eb28oz633o18', remover: ['cml747ux6001i5ov4eu3bquj7'], nome: 'Ocean Explorer' },
      { manter: 'cml73o7eu0018eb287okm78ey', remover: ['cml747siq000p5ov43m9nk0qe'], nome: 'Oceano III' },
      { manter: 'cml73oa59001ueb2812katjsz', remover: ['cml747uas001b5ov4b09k56lp'], nome: 'Ocidental II' },
      { manter: 'cml73oarp001zeb28b1x4rgnp', remover: ['cml747uoj001g5ov4lqk88fih'], nome: 'Oriental II' },
      { 
        manter: 'cml9of0f2000krov4xleiyha9', 
        remover: ['cml9of9n0001xrov4kwk9tdcf', 'cml9ofewo002srov4eyrv3pz0', 'cml9ofue60058rov4p1tpuf7z', 'cml9og5d1006yrov4vyfdm1gq', 'cml9ogi35008xrov40tvu7z8d'],
        nome: 'PRANCHAS' 
      },
      { manter: 'cml9of290000wrov4mz0icekz', remover: ['cml9og7dr0078rov4gbq71gss'], nome: 'PRANCHAS E CAIAQUES' },
      { manter: 'cml73o79d0017eb28evbczgmw', remover: ['cml747sg5000o5ov45zhco527'], nome: 'Pescador II' },
      { manter: 'cml73o93n001leb28sfm2i3db', remover: ['cml747tn600125ov4sinmfno0'], nome: 'Pico II' },
      { manter: 'cml73o7rz001beb28u52pn1zd', remover: ['cml747stx000s5ov4vnr1p4hg'], nome: 'Povoense I' },
      { manter: 'cml73o8cl001feb289bsw2pkd', remover: ['cml747t5d000w5ov45yx1uwpu'], nome: 'Praia III' },
      { manter: 'cml746umk000smov4u6qaqppq', remover: ['cml9oupdb003mr8v4x3eblupc'], nome: 'SAO PEDRO' },
      { manter: 'cml9ov81u006dr8v4ymzgvx9k', remover: ['cml9oxvrh002oo4v4b85tedi8'], nome: 'Santa Cruz' },
      { manter: 'cml73oefg002eeb28wsky5zmf', remover: ['cml747wrp001v5ov43xygrtzo'], nome: 'Santa Maria Diver' },
      { manter: 'cml73o6v30014eb28x6pihqdt', remover: ['cml747s8e000l5ov4ikqn44ws'], nome: 'Santa Maria III' },
      { manter: 'cml73o87z001eeb28vuang0ea', remover: ['cml747t22000v5ov4w07rg6y3'], nome: 'Santo António II' },
      { manter: 'cml9ov7ca0068r8v4cvlshx63', remover: ['cml9ovju30089r8v4yn9w3isy'], nome: 'Silveira' },
      { manter: 'cml73o7zq001ceb28y8wuas5u', remover: ['cml747swo000t5ov4p6gwz9gj'], nome: 'São José II' },
      { manter: 'cml73oavf0020eb28baipjmty', remover: ['cml747urv001h5ov4p28twxc5'], nome: 'São João III' },
      { manter: 'cml73o6rp0013eb28csdsrr7t', remover: ['cml747s5f000k5ov4tubitwjk'], nome: 'São Pedro II' },
      { manter: 'cml73o97r001meb28z3y3s3ic', remover: ['cml747tpt00135ov45vvcwq0y'], nome: 'São Roque I' },
      { manter: 'cml73ocu10028eb28wjeo990l', remover: ['cml747vwo001p5ov4q0y1x4x1'], nome: 'Talassa I' },
      { manter: 'cml73o83s001deb28xuvte1l6', remover: ['cml747szo000u5ov4ib6gvi89'], nome: 'Terceirense I' },
      { manter: 'cml73o8ga001geb28d6jf5uf1', remover: ['cml747t87000x5ov4aveou4lx'], nome: 'Vitória IV' },
      { manter: 'cml73oeo7002feb28frve01xr', remover: ['cml747wwa001w5ov4idefig1x'], nome: 'West Coast I' },
      { manter: 'cml73obe30022eb286s3tn8bg', remover: ['cml747v1s001j5ov42wo5hhb6'], nome: 'Whale Watcher I' },
    ];

    let gruposProcessados = 0;
    let duplicadosRemovidos = 0;

    for (const grupo of grupos) {
      try {
        console.log(`📋 Consolidando: ${grupo.nome}...`);
        
        // Transferir dados de todas as tabelas relacionadas
        for (const removerID of grupo.remover) {
          // Inspecoes
          await prisma.inspecao.updateMany({
            where: { navioId: removerID },
            data: { navioId: grupo.manter }
          });
          
          // Certificados
          await prisma.certificado.updateMany({
            where: { navioId: removerID },
            data: { navioId: grupo.manter }
          });
          
          // Jangadas
          await prisma.jangada.updateMany({
            where: { navioId: removerID },
            data: { navioId: grupo.manter }
          });
          
          // Agendamentos
          await prisma.agendamento.updateMany({
            where: { navioId: removerID },
            data: { navioId: grupo.manter }
          });
          
          // Faturas
          await prisma.fatura.updateMany({
            where: { navioId: removerID },
            data: { navioId: grupo.manter }
          });
          
          // Notificacoes
          await prisma.notificacao.updateMany({
            where: { navioId: removerID },
            data: { navioId: grupo.manter }
          });
          
          duplicadosRemovidos++;
        }
        
        // Remover registos duplicados
        await prisma.navio.deleteMany({
          where: { id: { in: grupo.remover } }
        });
        
        console.log(`  ✅ Removidos ${grupo.remover.length} duplicado(s)\n`);
        gruposProcessados++;
      } catch (erro) {
        console.error(`  ❌ Erro ao processar ${grupo.nome}:`, erro.message);
      }
    }

    console.log(`\n✨ Consolidação concluída com sucesso!`);
    console.log(`\n📊 Resumo:`);
    console.log(`  ✅ Grupos processados: ${gruposProcessados}`);
    console.log(`  ✅ Duplicados removidos: ${duplicadosRemovidos}`);
    console.log(`  📈 Embarcações consolidadas: ${gruposProcessados}\n`);

  } catch (erro) {
    console.error('❌ Erro fatal:', erro.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
main();
