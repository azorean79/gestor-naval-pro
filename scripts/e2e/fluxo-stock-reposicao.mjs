/**
 * E2E smoke: login API → necessidades → criar pedido reposição (se houver linhas)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = join(process.cwd(), "scripts", "e2e", "artifacts");
mkdirSync(OUT, { recursive: true });

async function login(request) {
  const colab = await (await request.get(`${BASE}/api/auth/collaborators`)).json();
  const admin = (colab.users || []).find((u) => u.role === "ADMIN") || (colab.users || [])[0];
  if (!admin) throw new Error("Sem colaboradores");
  const { csrfToken } = await (await request.get(`${BASE}/api/auth/csrf`)).json();
  await request.post(`${BASE}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      loginType: "passwordless",
      userId: String(admin.id),
      json: "true",
      redirect: "false",
      callbackUrl: `${BASE}/`,
    },
  });
  const session = await (await request.get(`${BASE}/api/auth/session`)).json();
  if (!session?.user) throw new Error("Login falhou");
  return session.user;
}

async function main() {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== "0" });
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  const result = { ok: false, steps: [] };
  const step = (n, d) => {
    result.steps.push({ n, d });
    console.log(`[${n}] ${d}`);
  };

  try {
    const user = await login(context.request);
    step("login", user.email || user.name);

    await page.goto("/stock/reposicoes", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(OUT, "stock-reposicoes.png"), fullPage: true });
    step("ui", page.url());

    const needs = await context.request.get(`${BASE}/api/stock/necessidades?stockScope=jangadas-ocean`);
    const needsJson = await needs.json();
    if (!needs.ok()) throw new Error(`necessidades ${needs.status()}`);
    step("api-needs", `items=${(needsJson.needs || []).length} alerts=${needsJson.summary?.itemsInAlert}`);

    const buy = (needsJson.needs || []).filter((n) => Number(n.reorderQty) > 0).slice(0, 5);
    if (buy.length) {
      const post = await context.request.post(`${BASE}/api/stock/pedidos-reposicao`, {
        data: {
          fornecedor: buy[0].fornecedor || "E2E",
          notas: "E2E smoke",
          linhas: buy.map((n) => ({
            stockId: n.stockMatched?.[0]?.id || n.stockId,
            referencia: n.referencia,
            descricao: n.nome,
            quantidadePedida: n.reorderQty,
            precoUnitario: n.avgPrice || 0,
          })),
        },
      });
      const body = await post.json().catch(() => ({}));
      step("pedido", `status=${post.status()} numero=${body.numero || "?"}`);
      if (!post.ok()) throw new Error(body.error || "pedido fail");
    } else {
      step("pedido", "sem linhas a comprar — skip create");
    }

    result.ok = true;
  } catch (e) {
    result.ok = false;
    result.error = e?.message || String(e);
    step("error", result.error);
  } finally {
    writeFileSync(join(OUT, "stock-result.json"), JSON.stringify(result, null, 2));
    await browser.close();
  }
  if (!result.ok) process.exit(1);
  console.log("\nSUCESSO", JSON.stringify(result, null, 2));
}

main();
