let decretos: { arquivo: string; texto: string }[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  decretos = require('./legislacao_extraida.json');
} catch (e) {
  decretos = [];
}

export interface DecretoLei {
  arquivo: string;
  texto: string;
}

export { decretos };
