import assert from 'node:assert/strict';
import {
  buildInspectionPlanFromFabricationDate,
  buildChecklistInitialValues,
  buildInspectionChecklistFromQuadro,
  QUADRO_ARTIGOS_BASE,
} from '../../src/modules/inspectionChecklist';

function run() {
  const baseChecklist = buildInspectionChecklistFromQuadro();
  assert.equal(baseChecklist.length, 6, 'Checklist deve conter 6 secções principais');

  const sectionTitles = baseChecklist.map((section) => section.title);
  assert.deepEqual(sectionTitles, [
    'Dados Gerais',
    'Exterior da Jangada',
    'Interior da Jangada',
    'Equipamentos e Artigos',
    'Ensaios e Testes',
    'Plano de Inspeções (WP/GI/FS/NAP)',
  ]);

  const equipmentSection = baseChecklist.find((section) => section.title === 'Equipamentos e Artigos');
  assert.ok(equipmentSection, 'Secção Equipamentos e Artigos deve existir');

  const equipmentLabels = equipmentSection!.fields.map((field) => field.label);
  assert.ok(equipmentLabels.includes('Pá de remo'), 'Checklist deve incluir artigos base do quadro');
  assert.ok(equipmentLabels.includes('Fogos de mão'), 'Checklist deve incluir pirotecnia base do quadro');

  const raftWithExtraArticles = {
    serial: 'SRV-001',
    brand: 'RFD',
    model: 'SURVIVA',
    capacity: 16,
    owner: 'Armador Demo',
    dataFabrico: '2024-03-01',
    packType: 'Solas A',
    dataInspecao: '2026-03-01',
    shipNameManual: 'Navio Demo',
    cylinder: {
      serial: 'CYL-123',
      tara: '12.1',
      pesoBruto: '14.8',
      co2: '2.70',
      n2: '0.12',
      dataTeste: '2025-01-10',
      dataProxTeste: '2030-01-10',
      sistema: 'Leafield',
    },
    artigos: [
      { name: 'Facho de mão SOLAS', quantidade: 4 },
      { name: 'Kit sobrevivência polar', quantidade: 1 },
    ],
  };

  const dynamicChecklist = buildInspectionChecklistFromQuadro(raftWithExtraArticles);
  const dynamicEquipment = dynamicChecklist.find((section) => section.title === 'Equipamentos e Artigos');
  assert.ok(dynamicEquipment, 'Secção dinâmica Equipamentos e Artigos deve existir');

  const dynamicLabels = dynamicEquipment!.fields.map((field) => field.label);
  assert.ok(dynamicLabels.includes('Kit sobrevivência polar'), 'Checklist deve incluir artigos vindos da jangada');
  assert.ok(dynamicLabels.includes('Facho de mão SOLAS'), 'Checklist deve incluir artigos customizados da jangada');

  QUADRO_ARTIGOS_BASE.forEach((baseItem) => {
    assert.ok(dynamicLabels.includes(baseItem), `Checklist dinâmico deve manter item base: ${baseItem}`);
  });

  const values = buildChecklistInitialValues(dynamicChecklist, raftWithExtraArticles);
  assert.equal(values.serial, 'SRV-001');
  assert.equal(values.capacity, 16);
  assert.equal(values.cilindro_co2, 'CYL-123');
  assert.equal(values.brand_model, 'RFD SURVIVA');
  assert.equal(values.artigo_kit_sobrevivencia_polar, false);
  assert.equal(values.artigo_pa_de_remo, false);
  assert.equal(values.gi_rule, 'GI de 5 em 5 anos desde a data de fabrico.');
  assert.equal(values.fs_nap_rule, 'FS e NAP ao 10º ano e depois anualmente.');

  const plan = buildInspectionPlanFromFabricationDate('2020-03-02', {
    yearsAhead: 20,
    referenceDate: '2031-03-03',
  });
  assert.equal(plan.wpRule, 'WP: aplica-se a todas as inspeções.');
  assert.deepEqual(plan.giDates.slice(0, 4), ['2025-03-02', '2030-03-02', '2035-03-02', '2040-03-02']);
  assert.equal(plan.nextGiDate, '2035-03-02');
  assert.equal(plan.fsNapDates[0], '2030-03-02');
  assert.equal(plan.fsNapDates[1], '2031-03-02');
  assert.equal(plan.nextFsNapDate, '2032-03-02');

  console.log('✅ test-inspection-checklist passed');
}

run();
