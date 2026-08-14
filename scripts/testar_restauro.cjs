/*
 * Teste de restauro da base de dados cifrada no Google Drive via rclone.
 *
 * Descobre a cópia mais recente de local.db no Drive (cifrada ou plaintext),
 * copia-a para uma pasta temporária e compara o SHA256 com a base local.
 *
 * Uso:
 *   node scripts/testar_restauro.cjs
 *
 * Exit code:
 *   0 = restauro OK (SHA256 idêntico)
 *   1 = falha (remotes em falta, ficheiro não encontrado ou SHA256 difere)
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DB_REL = "prisma/local.db";
const DB_PATH = path.join(ROOT, DB_REL);
const RCLONE = path.join(ROOT, "bin", "rclone.exe");

function loadEnv(fileName) {
  const envPath = path.join(ROOT, fileName);
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    content.split("\n").forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith("#")) return;
      const eq = line.indexOf("=");
      if (eq === -1) return;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    });
  } catch {}
}

loadEnv(".env");
loadEnv(".env.local");

const REMOTE = process.env.GDRIVE_REMOTE || "gdrive";
const GDRIVE_PATH = (process.env.GDRIVE_DB_PATH || "OreyAcores").replace(/^\/+|\/+$/g, "");
const CRYPT_REMOTE = (process.env.GDRIVE_CRYPT_REMOTE || "").trim().replace(/:$/, "");

function dbRemotePath() {
  if (CRYPT_REMOTE) return `${CRYPT_REMOTE}:`;
  return `${REMOTE}:${GDRIVE_PATH}`;
}

function sha256(file) {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(file);
  hash.update(data);
  return hash.digest("hex");
}

function rclone(args) {
  const result = spawnSync(RCLONE, args, { encoding: "utf8", timeout: 900000, windowsHide: true });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status === 0;
}

function remoteListed() {
  const result = spawnSync(RCLONE, ["listremotes"], { encoding: "utf8", timeout: 30000, windowsHide: true });
  if (result.status !== 0) return false;
  const remotes = (result.stdout || "").split("\n").map((l) => l.trim().replace(":", ""));
  const required = [REMOTE];
  if (CRYPT_REMOTE) required.push(CRYPT_REMOTE);
  return required.every((r) => remotes.includes(r));
}

function main() {
  console.log(`[teste-restauro] Remote: ${REMOTE} | Caminho: ${dbRemotePath()} | Cifragem: ${CRYPT_REMOTE ? "ATIVADA" : "desativada"}`);

  if (!fs.existsSync(RCLONE)) {
    console.error("[teste-restauro] ERRO: bin/rclone.exe em falta.");
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(DB_PATH)) {
    console.error("[teste-restauro] ERRO: base local não encontrada em prisma/local.db.");
    process.exitCode = 1;
    return;
  }

  if (!remoteListed()) {
    console.error("[teste-restauro] ERRO: remotes do rclone em falta.");
    process.exitCode = 1;
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "orey-restauro-"));
  const restoredPath = path.join(tmpDir, "local.db");
  const remoteDb = `${dbRemotePath()}/local.db`;

  console.log(`[teste-restauro] A descarregar ${remoteDb} → ${restoredPath} ...`);
  if (!rclone(["copy", remoteDb, tmpDir, "--update", "--transfers", "1"])) {
    console.error("[teste-restauro] FALHA: não foi possível descarregar a cópia do Drive.");
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(restoredPath)) {
    console.error("[teste-restauro] FALHA: local.db não existe no Drive.");
    process.exitCode = 1;
    return;
  }

  const localHash = sha256(DB_PATH);
  const restoredHash = sha256(restoredPath);

  console.log(`[teste-restauro] SHA256 local     : ${localHash}`);
  console.log(`[teste-restauro] SHA256 restaurado: ${restoredHash}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (localHash === restoredHash) {
    console.log("[teste-restauro] RESULTADO: OK — a base cifrada restaura-se e é idêntica à local.");
    process.exitCode = 0;
  } else {
    console.error("[teste-restauro] RESULTADO: FALHA — o SHA256 difere. Verifique os backups.");
    process.exitCode = 1;
  }
}

main();
