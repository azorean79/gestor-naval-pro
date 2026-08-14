import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
const req = ctx.request;
const colab = await (await req.get("/api/auth/collaborators")).json();
const admin = colab.users.find(u => u.role === "ADMIN") || colab.users[0];
const { csrfToken } = await (await req.get("/api/auth/csrf")).json();
await req.post("/api/auth/callback/credentials", {
  form: { csrfToken, loginType: "passwordless", userId: String(admin.id), json: "true", redirect: "false", callbackUrl: "http://127.0.0.1:3000/" },
});
const session = await (await req.get("/api/auth/session")).json();
console.log("user", session.user?.email);
const r = await req.post("/api/ordens-servico", {
  data: { jangadaId: 1, tipo: "inspecao", prioridade: "normal", status: "pendente", descricao: "E2E test API", tecnicoResponsavel: "E2E Bot" },
});
const text = await r.text();
console.log("status", r.status());
console.log(text.slice(0, 2000));
await browser.close();
