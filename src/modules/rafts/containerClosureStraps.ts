export type ContainerClosureStrapCertainty = 'exact' | 'operational' | 'family';

export type ContainerClosureStrapEntry = {
  key: string;
  stockReference: string;
  description: string;
  containerFamily: string;
  containerLabel: string;
  launchType: 'TO' | 'DL' | 'FLAT';
  size?: string;
  maxStowedHeightMeters?: 18 | 36;
  strapQuantity: number;
  completePartNumber?: string;
  upperPartNumber?: string;
  lowerPartNumber?: string;
  coverPartNumber?: string;
  strapPartNumber?: string;
  sealPartNumber?: string;
  applicableTechnicalModels: string[];
  applicablePackTypes?: Array<'SOLAS A' | 'SOLAS B'>;
  exactCapacities?: number[];
  notes?: string;
  page?: string;
  certainty: ContainerClosureStrapCertainty;
};

export type ContainerClosureStrapMatchBundle = {
  exactMatches: ContainerClosureStrapEntry[];
  familyMatches: ContainerClosureStrapEntry[];
  operationalNotes: string[];
};

const STRAP_CATALOG: ContainerClosureStrapEntry[] = [
    {
      key: 'mk10-to-18-size3-pack-ab-4',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 3',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '3',
      maxStowedHeightMeters: 18,
      strapQuantity: 4,
      completePartNumber: '42271031',
      upperPartNumber: '42271131',
      lowerPartNumber: '42271231',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [4],
      applicablePackTypes: ['SOLAS A', 'SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size3-pack-b-6-8',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 3',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '3',
      maxStowedHeightMeters: 18,
      strapQuantity: 4,
      completePartNumber: '42271031',
      upperPartNumber: '42271131',
      lowerPartNumber: '42271231',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [6, 8],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size4-pack-a-6-8',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 4',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '4',
      maxStowedHeightMeters: 18,
      strapQuantity: 4,
      completePartNumber: '42271041',
      upperPartNumber: '42271141',
      lowerPartNumber: '42271241',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [6, 8],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size4-pack-b-10-12',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 4',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '4',
      maxStowedHeightMeters: 18,
      strapQuantity: 4,
      completePartNumber: '42271041',
      upperPartNumber: '42271141',
      lowerPartNumber: '42271241',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [10, 12],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size6-pack-a-10-12',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 6',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '6',
      maxStowedHeightMeters: 18,
      strapQuantity: 6,
      completePartNumber: '42271061',
      upperPartNumber: '42271161',
      lowerPartNumber: '42271261',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [10, 12],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size6-pack-b-16',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 6',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '6',
      maxStowedHeightMeters: 18,
      strapQuantity: 6,
      completePartNumber: '42271061',
      upperPartNumber: '42271161',
      lowerPartNumber: '42271261',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [16],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size7-pack-a-16',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 7',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '7',
      maxStowedHeightMeters: 18,
      strapQuantity: 8,
      completePartNumber: '42271071',
      upperPartNumber: '42271171',
      lowerPartNumber: '42271271',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [16],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size7-pack-b-20-25',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 7',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '7',
      maxStowedHeightMeters: 18,
      strapQuantity: 8,
      completePartNumber: '42271071',
      upperPartNumber: '42271171',
      lowerPartNumber: '42271271',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [20, 25],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-18-size9-pack-a-20-25',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 9',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '9',
      maxStowedHeightMeters: 18,
      strapQuantity: 10,
      completePartNumber: '42271091',
      upperPartNumber: '42271191',
      lowerPartNumber: '42271291',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [20, 25],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size3-pack-ab-4',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 3',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '3',
      maxStowedHeightMeters: 36,
      strapQuantity: 4,
      completePartNumber: '17938031',
      upperPartNumber: '17938131',
      lowerPartNumber: '17938231',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [4],
      applicablePackTypes: ['SOLAS A', 'SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size3-pack-b-6-8',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 3',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '3',
      maxStowedHeightMeters: 36,
      strapQuantity: 4,
      completePartNumber: '17938031',
      upperPartNumber: '17938131',
      lowerPartNumber: '17938231',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [6, 8],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size4-pack-a-6-8',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 4',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '4',
      maxStowedHeightMeters: 36,
      strapQuantity: 4,
      completePartNumber: '17938041',
      upperPartNumber: '17938141',
      lowerPartNumber: '17938241',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [6, 8],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size4-pack-b-10-12',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 4',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '4',
      maxStowedHeightMeters: 36,
      strapQuantity: 4,
      completePartNumber: '17938041',
      upperPartNumber: '17938141',
      lowerPartNumber: '17938241',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [10, 12],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size6-pack-a-10-12',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 6',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '6',
      maxStowedHeightMeters: 36,
      strapQuantity: 6,
      completePartNumber: '17938061',
      upperPartNumber: '17938161',
      lowerPartNumber: '17938261',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [10, 12],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size6-pack-b-16',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 6',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '6',
      maxStowedHeightMeters: 36,
      strapQuantity: 6,
      completePartNumber: '17938061',
      upperPartNumber: '17938161',
      lowerPartNumber: '17938261',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [16],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size7-pack-a-16',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 7',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '7',
      maxStowedHeightMeters: 36,
      strapQuantity: 8,
      completePartNumber: '17938071',
      upperPartNumber: '17938171',
      lowerPartNumber: '17938271',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [16],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size7-pack-b-20-25',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 7',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '7',
      maxStowedHeightMeters: 36,
      strapQuantity: 8,
      completePartNumber: '17938071',
      upperPartNumber: '17938171',
      lowerPartNumber: '17938271',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [20, 25],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk10-to-36-size9-pack-a-20-25',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 10 Throwover - tamanho 9',
      containerFamily: 'MK10',
      containerLabel: 'MK 10 Throwover',
      launchType: 'TO',
      size: '9',
      maxStowedHeightMeters: 36,
      strapQuantity: 10,
      completePartNumber: '17938091',
      upperPartNumber: '17938191',
      lowerPartNumber: '17938291',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [20, 25],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1120',
      notes: 'Tabela manual MK10 throwover · heavy-weight até 36 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk14-to-18-size14-pack-a-10-12-16',
      stockReference: 'D508 / D509',
      description: 'Jogo cintas contentor MK 14 Throwover - tamanho 14',
      containerFamily: 'MK14',
      containerLabel: 'MK 14 Throwover',
      launchType: 'TO',
      size: '14',
      maxStowedHeightMeters: 18,
      strapQuantity: 8,
      completePartNumber: '50262012',
      upperPartNumber: '50262021',
      lowerPartNumber: '50262031',
      strapPartNumber: 'D508 (2.8 m) / D509 (2.6 m)',
      exactCapacities: [10, 12, 16],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1124',
      notes: 'Tabela 1113(i) · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk14-to-18-size14-pack-b-12-16-20',
      stockReference: 'D508 / D509',
      description: 'Jogo cintas contentor MK 14 Throwover - tamanho 14',
      containerFamily: 'MK14',
      containerLabel: 'MK 14 Throwover',
      launchType: 'TO',
      size: '14',
      maxStowedHeightMeters: 18,
      strapQuantity: 8,
      completePartNumber: '50262012',
      upperPartNumber: '50262021',
      lowerPartNumber: '50262031',
      strapPartNumber: 'D508 (2.8 m) / D509 (2.6 m)',
      exactCapacities: [12, 16, 20],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1124',
      notes: 'Tabela 1113(i) · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk14-to-18-size17-pack-a-16-20-25',
      stockReference: 'D508 / D509',
      description: 'Jogo cintas contentor MK 14 Throwover - tamanho 17',
      containerFamily: 'MK14',
      containerLabel: 'MK 14 Throwover',
      launchType: 'TO',
      size: '17',
      maxStowedHeightMeters: 18,
      strapQuantity: 10,
      completePartNumber: '50915012',
      upperPartNumber: '50915111',
      lowerPartNumber: '50915121',
      strapPartNumber: 'D508 (2.8 m) / D509 (2.6 m)',
      exactCapacities: [16, 20, 25],
      applicablePackTypes: ['SOLAS A'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1124',
      notes: 'Tabela 1113(i) · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk14-to-18-size17-pack-b-20',
      stockReference: 'D508 / D509',
      description: 'Jogo cintas contentor MK 14 Throwover - tamanho 17',
      containerFamily: 'MK14',
      containerLabel: 'MK 14 Throwover',
      launchType: 'TO',
      size: '17',
      maxStowedHeightMeters: 18,
      strapQuantity: 10,
      completePartNumber: '50915012',
      upperPartNumber: '50915111',
      lowerPartNumber: '50915121',
      strapPartNumber: 'D508 (2.8 m) / D509 (2.6 m)',
      exactCapacities: [20],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '1124',
      notes: 'Tabela 1113(i) · standard-weight até 18 m de altura de estiva.',
      certainty: 'exact',
    },
    {
      key: 'mk16-size2',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 16 Throwover - tamanho 2',
      containerFamily: 'MK16',
      containerLabel: 'MK 16 Throwover',
      launchType: 'FLAT',
      size: '2',
      maxStowedHeightMeters: 18,
      strapQuantity: 4,
      completePartNumber: '42301001',
      upperPartNumber: '42301011',
      lowerPartNumber: '42301021',
      strapPartNumber: 'D508 (2.1 m)',
      exactCapacities: [10, 12],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07', 'SEASAVA PLUS'],
      page: '1125',
      notes: 'Tabela 1114 · MK16 throwover GRP flat-pack.',
      certainty: 'exact',
    },
    {
      key: 'mk18-size1-pack-ab-4',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 18 Throwover - tamanho 1',
      containerFamily: 'MK18',
      containerLabel: 'MK 18 Throwover',
      launchType: 'FLAT',
      size: '1',
      maxStowedHeightMeters: 36,
      strapQuantity: 2,
      completePartNumber: '43042002',
      upperPartNumber: '43042101',
      lowerPartNumber: '43042202',
      strapPartNumber: 'D508 (2.8 m)',
      exactCapacities: [4],
      applicablePackTypes: ['SOLAS A', 'SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07', 'SEASAVA PLUS'],
      page: '1126',
      notes: 'Figura 1108 · MK18 throwover GRP flat-pack.',
      certainty: 'exact',
    },
    {
      key: 'mk18-size1-pack-b-6',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 18 Throwover - tamanho 1',
      containerFamily: 'MK18',
      containerLabel: 'MK 18 Throwover',
      launchType: 'FLAT',
      size: '1',
      maxStowedHeightMeters: 36,
      strapQuantity: 2,
      completePartNumber: '43042002',
      upperPartNumber: '43042101',
      lowerPartNumber: '43042202',
      strapPartNumber: 'D508 (2.8 m)',
      exactCapacities: [6],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07', 'SEASAVA PLUS'],
      page: '1126',
      notes: 'Figura 1108 · MK18 throwover GRP flat-pack.',
      certainty: 'exact',
    },
    {
      key: 'mk18-size3-pack-ab-6-8',
      stockReference: 'D508',
      description: 'Jogo cintas contentor MK 18 Throwover - tamanho 3',
      containerFamily: 'MK18',
      containerLabel: 'MK 18 Throwover',
      launchType: 'FLAT',
      size: '3',
      maxStowedHeightMeters: 36,
      strapQuantity: 2,
      completePartNumber: '43043002',
      upperPartNumber: '43043101',
      lowerPartNumber: '43043202',
      strapPartNumber: 'D508 (2.8 m)',
      exactCapacities: [6, 8],
      applicablePackTypes: ['SOLAS A', 'SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07', 'SEASAVA PLUS'],
      page: '1126',
      notes: 'Figura 1108 · MK18 throwover GRP flat-pack.',
      certainty: 'exact',
    },
    {
      key: 'mk20-dl',
      stockReference: 'MK20-FLAT',
      description: 'Jogo cintas contentor MK 20 Flat-Pack',
      containerFamily: 'MK20',
      containerLabel: 'MK 20 Flat-Pack',
      launchType: 'FLAT',
      maxStowedHeightMeters: 18,
      strapQuantity: 2,
      exactCapacities: [20, 25],
      applicableTechnicalModels: ['SURVIVA MKIV TO', 'LR07'],
      page: '113',
      notes: 'Aplicável às variantes MK20 flat-pack 20P/25P.',
      certainty: 'exact',
    },
    {
      key: 'g21-size17',
      stockReference: 'D508',
      description: 'Jogo cintas contentor G21 - tamanho 17',
      containerFamily: 'G21',
      containerLabel: 'G21',
      launchType: 'FLAT',
      size: '17',
      maxStowedHeightMeters: 18,
      strapQuantity: 4,
      completePartNumber: '08547009',
      strapPartNumber: 'D508 (2.1 m)',
      sealPartNumber: '06475009',
      exactCapacities: [12],
      applicablePackTypes: ['SOLAS B'],
      applicableTechnicalModels: ['SURVIVA MKIV TO'],
      page: '1127',
      notes: 'Figura 1109 · inclui selo do contentor G21.',
      certainty: 'exact',
    },
  ];

function normalizeModelName(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function isSeasavaPlusModel(model?: string | null) {
  return normalizeModelName(model).startsWith('SEASAVA PLUS');
}

function normalizeContainerFamily(value?: string | null) {
  const normalized = normalizeModelName(value);
  if (!normalized) return null;

  if (normalized.includes('MK10')) return 'MK10';
  if (normalized.includes('MK14')) return 'MK14';
  if (normalized.includes('MK16')) return 'MK16';
  if (normalized.includes('MK18')) return 'MK18';
  if (normalized.includes('MK20')) return 'MK20';
  if (normalized.includes('G21')) return 'G21';
  return null;
}

function normalizeLaunchType(value?: string | null): 'TO' | 'DL' | 'FLAT' | null {
  const normalized = normalizeModelName(value);
  if (!normalized) return null;
  if (normalized.includes('FLAT')) return 'FLAT';
  if (normalized.includes('DAVIT') || normalized === 'DL') return 'DL';
  if (normalized.includes('THROW') || normalized === 'TO') return 'TO';
  return null;
}

function normalizePackType(value?: string | null): 'SOLAS A' | 'SOLAS B' | null {
  const normalized = normalizeModelName(value);
  if (!normalized) return null;
  if (normalized.includes('SOLAS A') || normalized === 'A') return 'SOLAS A';
  if (normalized.includes('SOLAS B') || normalized === 'B') return 'SOLAS B';
  return null;
}

function normalizeStowageHeightBand(value?: number | string | null): 18 | 36 | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (numeric <= 18) return 18;
  if (numeric <= 36) return 36;
  return 36;
}

function matchesModel(entry: ContainerClosureStrapEntry, model?: string | null) {
  if (!model) return true;
  const normalizedModel = normalizeModelName(model);
  if (entry.applicableTechnicalModels.some((candidate) => normalizeModelName(candidate) === normalizedModel)) {
    return true;
  }

  if (isSeasavaPlusModel(model)) {
    return entry.applicableTechnicalModels.some((candidate) => isSeasavaPlusModel(candidate));
  }

  return false;
}

function resolveEffectiveContainerFamily(params: {
  model?: string | null;
  containerModel?: string | null;
  capacity?: number | string | null;
}) {
  const declaredFamily = normalizeContainerFamily(params.containerModel);
  if (!isSeasavaPlusModel(params.model)) {
    return declaredFamily;
  }

  const capacity = Number(params.capacity || 0);
  if ([4, 6, 8].includes(capacity)) return 'MK18';
  if ([10, 12].includes(capacity)) return 'MK16';
  return declaredFamily;
}

const SEASAVA_PLUS_OPERATIONAL_NOTES = [
  'O catálogo técnico da SEASAVA PLUS mantém `GRP / ABS / Valise`, mas o script `scripts/apply_seasava_plus_specs.ts` preenche `containerModel` com `MK16` quando a ficha não traz contentor explícito.',
  'Para SEASAVA PLUS 4P / 6P / 8P a família operacional correta é `MK18`, com 2 cintas de fecho (size 1 para 4P e size 3 para 6P/8P).',
  'Quando a ficha SEASAVA PLUS estiver marcada como `MK16`, a referência operacional conhecida para 10P/12P é `STRAP-MK16-SIZE2` (4 cintas).',
];

export function formatContainerClosureCapacities(entry: ContainerClosureStrapEntry) {
  if (!entry.exactCapacities || entry.exactCapacities.length === 0) return 'Capacidade por confirmar';
  return entry.exactCapacities.map((capacity) => `${capacity}P`).join(' / ');
}

export function getContainerClosureCatalogForModel(params: {
  brand?: string | null;
  model?: string | null;
  containerModel?: string | null;
}) {
  const model = params.model;
  const containerFamily = normalizeContainerFamily(params.containerModel);

  const catalog = STRAP_CATALOG.filter((entry) => {
    if (!matchesModel(entry, model)) return false;
    if (!containerFamily) return true;
    return entry.containerFamily === containerFamily || isSeasavaPlusModel(model);
  });

  return catalog.sort((a, b) => {
    const familyOrder = a.containerFamily.localeCompare(b.containerFamily, 'pt-PT');
    if (familyOrder !== 0) return familyOrder;
    const launchOrder = a.launchType.localeCompare(b.launchType, 'pt-PT');
    if (launchOrder !== 0) return launchOrder;
    return String(a.size || '').localeCompare(String(b.size || ''), 'pt-PT');
  });
}

export function getContainerClosureMatchBundle(params: {
  brand?: string | null;
  model?: string | null;
  containerModel?: string | null;
  capacity?: number | string | null;
  launchType?: string | null;
  packType?: string | null;
  maxStowageHeight?: number | string | null;
}): ContainerClosureStrapMatchBundle {
  const model = params.model;
  const containerFamily = resolveEffectiveContainerFamily(params);
  const normalizedLaunch = normalizeLaunchType(params.launchType);
  const normalizedPack = normalizePackType(params.packType);
  const stowageHeightBand = normalizeStowageHeightBand(params.maxStowageHeight);
  const capacity = Number(params.capacity || 0);

  const relevant = STRAP_CATALOG.filter((entry) => {
    if (!matchesModel(entry, model)) return false;
    if (!containerFamily) return false;
    if (entry.containerFamily !== containerFamily) return false;
    if (entry.applicablePackTypes && entry.applicablePackTypes.length > 0) {
      if (!normalizedPack || !entry.applicablePackTypes.includes(normalizedPack as 'SOLAS A' | 'SOLAS B')) {
        return false;
      }
    }
    if (stowageHeightBand && entry.maxStowedHeightMeters && entry.maxStowedHeightMeters !== stowageHeightBand) {
      return false;
    }
    if (normalizedLaunch) {
      if (containerFamily === 'MK16' || containerFamily === 'MK18' || containerFamily === 'MK20' || containerFamily === 'G21') {
        if (entry.launchType !== 'FLAT') return false;
      } else if (entry.launchType !== normalizedLaunch) {
        return false;
      }
    }
    return true;
  });

  const exactMatches = relevant.filter((entry) => entry.exactCapacities?.includes(capacity));
  const familyMatches = relevant.filter((entry) => !exactMatches.some((exact) => exact.key === entry.key));
  const operationalNotes: string[] = [];

  if (isSeasavaPlusModel(model)) {
    operationalNotes.push(...SEASAVA_PLUS_OPERATIONAL_NOTES);

    const rawFamily = normalizeContainerFamily(params.containerModel);
    if (rawFamily && rawFamily !== containerFamily) {
      operationalNotes.push(`A ficha indicava ${rawFamily}, mas para ${capacity}P foi aplicada a família operacional ${containerFamily} para respeitar a regra das cintas da SEASAVA PLUS.`);
    }
  }

  if (!containerFamily && isSeasavaPlusModel(model)) {
    operationalNotes.push('A ficha precisa de contentor explícito para sugerir automaticamente a cinta de fecho correta.');
  }

  if (containerFamily && exactMatches.length === 0 && familyMatches.length > 0) {
    operationalNotes.push('Existe mapeamento genérico para esta família de contentor, mas a ficha só deve mostrar a cinta quando houver correspondência exata entre contentor, lotação e pack.');
  }

  return {
    exactMatches,
    familyMatches,
    operationalNotes: Array.from(new Set(operationalNotes)),
  };
}
