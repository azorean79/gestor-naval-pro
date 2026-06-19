// API mock para coletes associados ao navio
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shipId = searchParams.get("shipId");
  // Exemplo: retorna coletes mockados
  const payload = [
    { id: 1, marca: "RFD", modelo: "SOLAS Adulto", serial: "A123", validade: "2027-05-01", owner: "Empresa X", shipId },
    { id: 2, marca: "Zodiac", modelo: "SOLAS Criança", serial: "C456", validade: "2026-11-15", owner: "Empresa X", shipId },
  ];
  return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
}
