/**
 * Fluxo OS automatizado (Playwright)
 * Auth via API NextAuth → UI criar OT → workflow → concluir
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const HEADLESS = process.env.HEADLESS !== "0";
const OUT = join(process.cwd(), "scripts", "e2e", "artifacts");
mkdirSync(OUT, { recursive: true });

const log = (s, m) => console.log(`[${s}] ${m}`);
const shot = async (page, name) => {
  const p = join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  log("shot", p);
};

async function loginViaApi(request) {
  const colab = await request.get(`${BASE}/api/auth/collaborators`);
  const colabJson = await colab.json();
  const users = colabJson.users || [];
  const admin = users.find((u) => u.role === "ADMIN") || users[0];
  if (!admin) throw new Error("Sem colaboradores para login");

  const csrfRes = await request.get(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  if (!csrfToken) throw new Error("Sem csrfToken");

  // passwordless
  let signIn = await request.post(`${BASE}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      loginType: "passwordless",
      userId: String(admin.id),
      json: "true",
      redirect: "false",
      callbackUrl: `${BASE}/`,
    },
    maxRedirects: 0,
  });

  let session = await request.get(`${BASE}/api/auth/session`);
  let sessionJson = await session.json().catch(() => ({}));

  if (!sessionJson?.user) {
    // fallback email/password
    const csrf2 = await (await request.get(`${BASE}/api/auth/csrf`)).json();
    signIn = await request.post(`${BASE}/api/auth/callback/credentials`, {
      form: {
        csrfToken: csrf2.csrfToken,
        email: process.env.E2E_EMAIL || "admin@local",
        password: process.env.E2E_PASSWORD || "admin123",
        json: "true",
        redirect: "false",
        callbackUrl: `${BASE}/`,
      },
      maxRedirects: 0,
    });
    session = await request.get(`${BASE}/api/auth/session`);
    sessionJson = await session.json().catch(() => ({}));
  }

  if (!sessionJson?.user) {
    const body = await signIn.text().catch(() => "");
    throw new Error(`Login falhou. session=${JSON.stringify(sessionJson)} signIn=${signIn.status()} ${body.slice(0, 200)}`);
  }

  return { user: sessionJson.user, admin };
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS, slowMo: HEADLESS ? 0 : 40 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, baseURL: BASE });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  const result = { ok: false, ordemId: null, numeroOrdem: null, steps: [], consoleErrors };
  const step = (name, detail) => {
    result.steps.push({ name, detail, at: new Date().toISOString() });
    log(name, detail);
  };

  try {
    step("login", "Auth API NextAuth");
    const { user, admin } = await loginViaApi(context.request);
    step("login", `Sessão: ${user.email || user.name} (via ${admin.email})`);

    // Validar cookies
    const cookies = await context.cookies();
    step("login", `cookies: ${cookies.map((c) => c.name).join(", ")}`);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await shot(page, "01-home");

    // Se redirecionou para login, a sessão cookie não colou
    if (page.url().includes("/login")) {
      // dump session from page
      const sess = await page.evaluate(async () => {
        const r = await fetch("/api/auth/session");
        return r.json();
      });
      throw new Error(`Ainda em /login. session browser=${JSON.stringify(sess)}`);
    }
    step("home", page.url());

    // Jangada (via browser fetch — evita ECONNRESET do request context com cookie grande)
    async function fetchJson(path, attempts = 5) {
      let lastErr;
      for (let i = 0; i < attempts; i++) {
        try {
          const data = await page.evaluate(async (p) => {
            const r = await fetch(p);
            const text = await r.text();
            let json = null;
            try { json = JSON.parse(text); } catch { /* ignore */ }
            return { ok: r.ok, status: r.status, json, text: text.slice(0, 300) };
          }, path);
          if (data.ok) return data.json;
          lastErr = new Error(`${path} → ${data.status} ${data.text}`);
        } catch (e) {
          lastErr = e;
        }
        await page.waitForTimeout(1500 * (i + 1));
      }
      throw lastErr || new Error(`Falha ${path}`);
    }

    let jangadas = await fetchJson("/api/jangadas");
    if (!Array.isArray(jangadas)) jangadas = jangadas?.data || jangadas?.items || [];
    if (!jangadas.length) throw new Error("Sem jangadas");
    const jangada = jangadas[0];
    step("jangada", `id=${jangada.id} serial=${jangada.serial}`);

    // Criar OT na UI
    await page.goto(`/criar-ot?jangadaId=${jangada.id}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Esperar serial ou pesquisa
    const serialVisible = await page.getByText(/Serial:/i).isVisible().catch(() => false);
    if (!serialVisible) {
      const search = page.getByPlaceholder(/pesquisar jangada/i);
      if (await search.isVisible().catch(() => false)) {
        await search.fill(String(jangada.serial || "").slice(0, 24));
        await page.waitForTimeout(1200);
        const opt = page.locator("button").filter({ hasText: String(jangada.serial) }).first();
        if (await opt.count()) await opt.click();
      }
    }

    const desc = page.getByPlaceholder(/descri/i);
    if (await desc.count()) await desc.fill(`OS automatizada E2E ${new Date().toISOString()}`);
    const tec = page.locator("label", { hasText: /Tecnico/i }).locator("..").locator("input");
    if (await tec.count()) await tec.fill("E2E Bot");

    await shot(page, "02-criar-ot");
    await page.getByRole("button", { name: /Criar Ordem/i }).click();
    await page.waitForURL(/\/ordens-servico\/\d+/, { timeout: 60000 });
    result.ordemId = page.url().match(/\/ordens-servico\/(\d+)/)?.[1] || null;
    step("criar-ot", `criada id=${result.ordemId}`);
    await page.waitForTimeout(1500);
    await shot(page, "03-detalhe");

    const h1 = (await page.locator("h1").first().textContent().catch(() => "")) || "";
    result.numeroOrdem = h1.replace(/^OS\s*/i, "").trim() || null;
    step("detalhe", `numero=${result.numeroOrdem}`);

    // Status workflow
    const statusSelect = page.locator("select").filter({ has: page.locator('option[value="em_progresso"]') }).first();
    if (await statusSelect.count()) {
      await statusSelect.selectOption("agendada");
      await page.getByRole("button", { name: /^Guardar$/i }).click();
      await page.waitForTimeout(1500);
      step("workflow", "agendada");

      await statusSelect.selectOption("em_progresso");
      await page.getByRole("button", { name: /^Guardar$/i }).click();
      await page.waitForTimeout(1500);
      step("workflow", "em_progresso");
    } else {
      const put = await context.request.put(`${BASE}/api/ordens-servico/${result.ordemId}`, {
        data: { status: "em_progresso" },
      });
      step("workflow", `API em_progresso ${put.status()}`);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
    }
    await shot(page, "04-progresso");

    // Checklist
    const checks = page.locator('input[type="checkbox"]');
    const n = await checks.count();
    let marked = 0;
    for (let i = 0; i < Math.min(n, 20); i++) {
      const c = checks.nth(i);
      if (!(await c.isChecked().catch(() => true))) {
        await c.check({ force: true }).catch(() => {});
        marked++;
      }
    }
    step("checklist", `${marked}/${n}`);
    if (marked) {
      await page.getByRole("button", { name: /^Guardar$/i }).click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    await shot(page, "05-checklist");

    // Concluir
    page.once("dialog", async (d) => {
      step("concluir", `dialog ok`);
      await d.accept();
    });
    const btn = page.getByRole("button", { name: /Concluir OS/i });
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(4000);
      step("concluir", "UI Concluir OS");
    } else {
      const r = await context.request.post(`${BASE}/api/ordens-servico/${result.ordemId}/completar`);
      const body = await r.json().catch(() => ({}));
      step("concluir", `API ${r.status()} ${JSON.stringify(body).slice(0, 120)}`);
    }
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, "06-concluida");

    await page.goto("/ordens-servico", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await shot(page, "07-lista");
    step("lista", "OK");

    result.ok = true;
    step("done", `OS #${result.ordemId} ${result.numeroOrdem || ""}`);
  } catch (err) {
    result.ok = false;
    result.error = err?.message || String(err);
    step("error", result.error);
    await shot(page, "99-erro").catch(() => {});
  } finally {
    result.consoleErrors = consoleErrors.slice(0, 30);
    writeFileSync(join(OUT, "result.json"), JSON.stringify(result, null, 2));
    await browser.close();
  }

  if (!result.ok) {
    console.error("FALHOU", result.error);
    if (consoleErrors.length) console.error("CONSOLE", consoleErrors.slice(0, 10));
    process.exit(1);
  }
  console.log("\nSUCESSO", JSON.stringify(result, null, 2));
}

main();
