import PublicStatusClient from "./PublicStatusClient";

export default async function EstadoJangadaPage({
  searchParams,
}: {
  searchParams: Promise<{ serial?: string }>;
}) {
  const { serial } = await searchParams;
  return <PublicStatusClient initialSerial={serial || ""} />;
}
