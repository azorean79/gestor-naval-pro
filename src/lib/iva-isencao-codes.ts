// Catálogo oficial de Motivos de Isenção ou Não Liquidação de IVA (AT Portugal).
// Tabela padronizada pela Autoridade Tributária (em vigor desde 01/07/2022, atualizada).
// Fonte: Portal das Finanças / Manual de Faturação.

export type IsencaoIvaCode = {
  /** Código oficial (ex.: "M02") */
  code: string;
  /** Menção a constar na fatura */
  mencao: string;
  /** Norma aplicável */
  norma: string;
};

export const IVA_ISENCAO_CODES: IsencaoIvaCode[] = [
  { code: "M01", mencao: "Artigo 16.º, n.º 6 do CIVA", norma: "Artigo 16.º, n.º 6, alíneas a) a d) do CIVA" },
  { code: "M02", mencao: "Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de junho", norma: "Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de junho" },
  { code: "M04", mencao: "Isento artigo 13.º do CIVA", norma: "Artigo 13.º do CIVA" },
  { code: "M05", mencao: "Isento artigo 14.º do CIVA", norma: "Artigo 14.º do CIVA" },
  { code: "M06", mencao: "Isento artigo 15.º do CIVA", norma: "Artigo 15.º do CIVA" },
  { code: "M07", mencao: "Isento artigo 9.º do CIVA", norma: "Artigo 9.º do CIVA" },
  { code: "M09", mencao: "IVA – não confere direito a dedução", norma: "Artigo 62.º alínea b) do CIVA" },
  { code: "M10", mencao: "IVA – regime de isenção", norma: "Artigo 57.º do CIVA (regime do artigo 53.º)" },
  { code: "M11", mencao: "Regime particular do tabaco", norma: "Decreto-Lei n.º 346/85, de 23 de agosto" },
  { code: "M12", mencao: "Regime da margem de lucro – Agências de viagens", norma: "Decreto-Lei n.º 221/85, de 3 de julho" },
  { code: "M13", mencao: "Regime da margem de lucro – Bens em segunda mão", norma: "Decreto-Lei n.º 199/96, de 18 de outubro" },
  { code: "M14", mencao: "Regime da margem de lucro – Objetos de arte", norma: "Decreto-Lei n.º 199/96, de 18 de outubro" },
  { code: "M15", mencao: "Regime da margem de lucro – Objetos de coleção e antiguidades", norma: "Decreto-Lei n.º 199/96, de 18 de outubro" },
  { code: "M16", mencao: "Isento artigo 14.º do RITI", norma: "Artigo 14.º do RITI" },
  { code: "M19", mencao: "Outras isenções", norma: "Isenções temporárias determinadas em diploma próprio" },
  { code: "M20", mencao: "IVA – regime forfetário", norma: "Artigo 59.º-D n.º 2 do CIVA" },
  { code: "M21", mencao: "IVA – não confere direito à dedução", norma: "Artigo 72.º n.º 4 do CIVA" },
  { code: "M25", mencao: "Mercadorias à consignação", norma: "Artigo 38.º n.º 1 alínea a)" },
  { code: "M26", mencao: "Isenção de IVA com direito à dedução no cabaz alimentar", norma: "Lei n.º 17/2023, de 14 de abril" },
  { code: "M30", mencao: "IVA – autoliquidação", norma: "Artigo 2.º n.º 1 alínea i) do CIVA" },
  { code: "M31", mencao: "IVA – autoliquidação", norma: "Artigo 2.º n.º 1 alínea j) do CIVA" },
  { code: "M32", mencao: "IVA – autoliquidação", norma: "Artigo 2.º n.º 1 alínea l) do CIVA" },
  { code: "M33", mencao: "IVA – autoliquidação", norma: "Artigo 2.º n.º 1 alínea m) do CIVA" },
  { code: "M34", mencao: "IVA – autoliquidação", norma: "Artigo 2.º n.º 1 alínea n) do CIVA" },
  { code: "M40", mencao: "IVA – autoliquidação", norma: "Artigo 6.º n.º 6 alínea a) do CIVA, a contrário" },
  { code: "M41", mencao: "IVA – autoliquidação", norma: "Artigo 8.º n.º 3 do RITI" },
  { code: "M42", mencao: "IVA – autoliquidação", norma: "Decreto-Lei n.º 21/2007, de 29 de janeiro" },
  { code: "M43", mencao: "IVA – autoliquidação", norma: "Decreto-Lei n.º 362/99, de 16 de setembro" },
  { code: "M45", mencao: "IVA – regime transfronteiriço de isenção", norma: "Artigo 58.º-A do CIVA" },
  { code: "M46", mencao: "IVA – e-TaxFree", norma: "Decreto-Lei n.º 19/2017, de 14 de fevereiro" },
  { code: "M99", mencao: "Não sujeito ou não tributado", norma: "Outras situações de não liquidação do imposto (artigo 2.º, n.º 2; artigo 3.º, n.ºs 4, 6 e 7; artigo 4.º, n.º 5, todos do CIVA)" },
];

const BY_CODE = new Map(IVA_ISENCAO_CODES.map((c) => [c.code, c]));

export function getIsencaoIvaInfo(code?: string | null): IsencaoIvaCode | null {
  if (!code) return null;
  return BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

/** Texto para usar na fatura quando o IVA é isento. */
export function formatIsencaoIva(isento: boolean, code?: string | null): string {
  if (!isento) return "";
  const info = getIsencaoIvaInfo(code);
  if (!info) return "Isento";
  return `Isento (${info.code} — ${info.mencao})`;
}
