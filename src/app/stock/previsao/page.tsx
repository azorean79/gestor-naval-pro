import { redirect } from "next/navigation";

/** Página legada — redireciona para reposições (aba planeamento). */
export default function StockPrevisaoRedirectPage() {
  redirect("/stock/reposicoes?tab=planeamento");
}
