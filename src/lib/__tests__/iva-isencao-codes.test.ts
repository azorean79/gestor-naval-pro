import { formatIsencaoIva, getIsencaoIvaInfo, IVA_ISENCAO_CODES } from "@/lib/iva-isencao-codes";

describe("IVA_ISENCAO_CODES", () => {
  test("contém os códigos oficiais da AT (M01–M99)", () => {
    expect(IVA_ISENCAO_CODES.length).toBeGreaterThanOrEqual(25);
    const codes = IVA_ISENCAO_CODES.map((c) => c.code);
    expect(codes).toContain("M01");
    expect(codes).toContain("M02");
    expect(codes).toContain("M07");
    expect(codes).toContain("M10");
    expect(codes).toContain("M99");
  });

  test("cada código tem menção e norma não vazias", () => {
    for (const c of IVA_ISENCAO_CODES) {
      expect(c.code).toMatch(/^M\d{1,2}$/);
      expect(c.mencao.trim().length).toBeGreaterThan(0);
      expect(c.norma.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("getIsencaoIvaInfo", () => {
  test("devolve o objeto correto para código válido", () => {
    const info = getIsencaoIvaInfo("M02");
    expect(info).not.toBeNull();
    expect(info!.code).toBe("M02");
    expect(info!.mencao).toContain("Decreto-Lei n.º 198/90");
  });

  test("aceita código em minúsculas", () => {
    const info = getIsencaoIvaInfo("m10");
    expect(info).not.toBeNull();
    expect(info!.code).toBe("M10");
  });

  test("devolve null para código inexistente", () => {
    expect(getIsencaoIvaInfo("M999")).toBeNull();
  });

  test("devolve null para null/undefined/vazio", () => {
    expect(getIsencaoIvaInfo(null)).toBeNull();
    expect(getIsencaoIvaInfo(undefined)).toBeNull();
    expect(getIsencaoIvaInfo("")).toBeNull();
  });
});

describe("formatIsencaoIva", () => {
  test("formato completo com código válido", () => {
    const result = formatIsencaoIva(true, "M02");
    expect(result).toMatch(/^Isento \(M02 — .+\)$/);
    expect(result).toContain("Decreto-Lei n.º 198/90");
  });

  test("devolve 'Isento' quando não há código", () => {
    expect(formatIsencaoIva(true, null)).toBe("Isento");
    expect(formatIsencaoIva(true, undefined)).toBe("Isento");
    expect(formatIsencaoIva(true, "")).toBe("Isento");
  });

  test("devolve string vazia quando IVA não é isento", () => {
    expect(formatIsencaoIva(false, "M02")).toBe("");
    expect(formatIsencaoIva(false, null)).toBe("");
  });

  test("devolve 'Isento' com código inexistente (fallback)", () => {
    expect(formatIsencaoIva(true, "INVALID")).toBe("Isento");
  });
});
