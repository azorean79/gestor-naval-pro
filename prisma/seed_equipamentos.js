const { Client } = require('pg');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.gestornavalpro_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('No DATABASE_URL found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

const equipamentos = [
  {
    nome: 'Compressor de Ar',
    tipo: 'Compressor',
    marca: 'Bauer',
    modelo: 'Mariner 320',
    serial: 'BAU-M320-0001',
    estado: 'Ativo',
    observacoes: 'Usado para enchimento de cilindros.',
  },
  {
    nome: 'Balança de Precisão',
    tipo: 'Medição',
    marca: 'Kern',
    modelo: 'PCB 10000-1',
    serial: 'KER-PCB-10000',
    estado: 'Ativo',
    observacoes: 'Calibração semestral recomendada.',
  },
  {
    nome: 'Detector de Fugas',
    tipo: 'Diagnóstico',
    marca: 'Testo',
    modelo: '316-4',
    serial: 'TES-3164-01',
    estado: 'Ativo',
    observacoes: '',
  },
  {
    nome: 'Bancada de Teste HRU',
    tipo: 'Teste',
    marca: 'Oficina',
    modelo: 'BT-HRU-01',
    serial: 'OFC-HRU-01',
    estado: 'Em manutenção',
    observacoes: 'Substituir válvula principal.',
  },
  {
    nome: 'Kit Ferramentas Selagem',
    tipo: 'Ferramentas',
    marca: 'Facom',
    modelo: 'KF-200',
    serial: 'FAC-KF200-01',
    estado: 'Ativo',
    observacoes: '',
  },
];

async function seedEquipamentos() {
  try {
    await client.connect();
    console.log('Connected to database');

    for (const item of equipamentos) {
      const query = `
        INSERT INTO "Equipamento" (nome, tipo, marca, modelo, serial, estado, observacoes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (serial) DO UPDATE SET
          nome = EXCLUDED.nome,
          tipo = EXCLUDED.tipo,
          marca = EXCLUDED.marca,
          modelo = EXCLUDED.modelo,
          estado = EXCLUDED.estado,
          observacoes = EXCLUDED.observacoes,
          "updatedAt" = NOW();
      `;

      await client.query(query, [
        item.nome,
        item.tipo,
        item.marca,
        item.modelo,
        item.serial,
        item.estado,
        item.observacoes,
      ]);

      console.log(`Inserted/Updated equipamento: ${item.nome}`);
    }

    console.log('Equipamentos seeding completed successfully');
  } catch (error) {
    console.error('Error seeding equipamentos:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedEquipamentos();
}

module.exports = { seedEquipamentos };
