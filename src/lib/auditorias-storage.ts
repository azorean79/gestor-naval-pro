import { del, list, put } from "@vercel/blob";
import { existsSync } from "fs";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { APP_CONFIG } from "@/lib/app-config";

const STORAGE_ROOT_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), APP_CONFIG.storageNamespace, "auditorias_documentos")
  : path.join(process.cwd(), "auditorias_documentos");
const STORAGE_ROOT_PREFIX = "auditorias-documentos";

export type AuditoriaStorageFile = {
  name: string;
  size: number;
  modified: string | Date;
  url?: string;
  path?: string;
  originalName?: string;
  uploadedAt?: string;
};

type AuditoriaDocumentMetadata = {
  originalName: string;
  uploadedAt: string;
};

type AuditoriaDocumentMetadataMap = Record<string, AuditoriaDocumentMetadata>;

const METADATA_FILE = "_meta/documentos-metadata.json";

function storageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function usesEphemeralLocalStorage() {
  return Boolean(process.env.VERCEL) && !storageEnabled();
}

function blobPath(relativePath: string) {
  return `${STORAGE_ROOT_PREFIX}/${relativePath.replace(/^\/+/, "")}`;
}

function localPath(relativePath: string) {
  return path.join(STORAGE_ROOT_DIR, relativePath);
}

function normalizeRelativePath(relativePath: string) {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function metadataKey(relativePath: string) {
  return normalizeRelativePath(relativePath);
}

export async function upsertAuditoriaDocumentMetadata(
  relativePath: string,
  originalName: string,
  uploadedAt = new Date().toISOString()
) {
  const metadata = await readAuditoriaJson<AuditoriaDocumentMetadataMap>(METADATA_FILE, {});
  metadata[metadataKey(relativePath)] = {
    originalName,
    uploadedAt,
  };
  await writeAuditoriaJson(METADATA_FILE, metadata);
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, "_").replace(/\.\./g, "_");
}

export function inferContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === ".xls") return "application/vnd.ms-excel";
  if (ext === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === ".txt") return "text/plain";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

async function ensureLocalDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

async function findBlobExact(relativePath: string) {
  const target = blobPath(relativePath);
  const result = await list({ prefix: target });
  return (result.blobs || []).find((blob) => blob.pathname === target) || null;
}

async function resolveUniqueRelativePath(relativePath: string) {
  const filename = path.basename(relativePath);
  const dir = path.dirname(relativePath);
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  if (storageEnabled()) {
    const existing = await findBlobExact(relativePath);
    if (!existing) return relativePath;
    return path.posix.join(dir.replace(/\\/g, "/"), `${base}_${Date.now()}${ext}`);
  }

  const absolute = localPath(relativePath);
  if (!existsSync(absolute)) return relativePath;
  return path.join(dir, `${base}_${Date.now()}${ext}`);
}

export async function listAuditoriaFiles(relativeDir: string): Promise<AuditoriaStorageFile[]> {
  const metadata = await readAuditoriaJson<AuditoriaDocumentMetadataMap>(METADATA_FILE, {});

  if (storageEnabled()) {
    const normalizedDir = normalizeRelativePath(relativeDir);
    const prefix = blobPath(`${normalizedDir}/`);
    const result = await list({ prefix });
    return (result.blobs || []).map((blob) => ({
      name: path.posix.basename(blob.pathname),
      size: blob.size,
      modified: blob.uploadedAt,
      url: blob.url,
      path: blob.pathname,
      originalName: metadata[metadataKey(blob.pathname.replace(`${STORAGE_ROOT_PREFIX}/`, ""))]?.originalName,
      uploadedAt: metadata[metadataKey(blob.pathname.replace(`${STORAGE_ROOT_PREFIX}/`, ""))]?.uploadedAt || blob.uploadedAt.toISOString(),
    }));
  }

  const dirPath = localPath(relativeDir);
  if (!existsSync(dirPath)) return [];

  const files = await readdir(dirPath);
  return Promise.all(
    files.map(async (name) => {
      const filePath = path.join(dirPath, name);
      const fileStats = await stat(filePath);
      return {
        name,
        size: fileStats.size,
        modified: fileStats.mtime,
        path: filePath,
        originalName: metadata[metadataKey(path.join(relativeDir, name))]?.originalName,
        uploadedAt: metadata[metadataKey(path.join(relativeDir, name))]?.uploadedAt || fileStats.mtime.toISOString(),
      };
    })
  );
}

export async function saveAuditoriaFile(
  relativeDir: string,
  filename: string,
  content: ArrayBuffer,
  contentType?: string,
  originalName?: string
) {
  const safeName = sanitizeFilename(filename);
  const relativePath = await resolveUniqueRelativePath(path.join(relativeDir, safeName));
  const finalName = path.basename(relativePath);
  const uploadedAt = new Date().toISOString();
  await upsertAuditoriaDocumentMetadata(relativePath, originalName || filename, uploadedAt);

  if (storageEnabled()) {
    const uploaded = await put(blobPath(normalizeRelativePath(relativePath)), Buffer.from(content), {
      access: "public",
      addRandomSuffix: false,
      contentType: contentType || inferContentType(finalName),
    });

    return {
      name: finalName,
      size: Buffer.byteLength(Buffer.from(content)),
      modified: uploadedAt,
      url: uploaded.url,
      path: uploaded.pathname,
      originalName: originalName || filename,
      uploadedAt,
    } satisfies AuditoriaStorageFile;
  }

  const absoluteDir = localPath(relativeDir);
  await ensureLocalDirectory(absoluteDir);
  const absolutePath = localPath(relativePath);
  await writeFile(absolutePath, Buffer.from(content));

  return {
    name: finalName,
    size: Buffer.byteLength(Buffer.from(content)),
    modified: uploadedAt,
    path: absolutePath,
    originalName: originalName || filename,
    uploadedAt,
  } satisfies AuditoriaStorageFile;
}

export async function getAuditoriaFile(relativePath: string) {
  if (storageEnabled()) {
    const blob = await findBlobExact(relativePath.replace(/\\/g, "/"));
    if (!blob) return null;
    return {
      name: path.posix.basename(blob.pathname),
      size: blob.size,
      modified: blob.uploadedAt,
      url: blob.url,
      path: blob.pathname,
    } satisfies AuditoriaStorageFile;
  }

  const absolutePath = localPath(relativePath);
  if (!existsSync(absolutePath)) return null;
  const fileStats = await stat(absolutePath);
  return {
    name: path.basename(absolutePath),
    size: fileStats.size,
    modified: fileStats.mtime,
    path: absolutePath,
  } satisfies AuditoriaStorageFile;
}

export async function readAuditoriaFile(relativePath: string) {
  if (storageEnabled()) {
    const file = await getAuditoriaFile(relativePath);
    if (!file?.url) return null;
    const response = await fetch(file.url, { cache: "no-store" });
    if (!response.ok) return null;
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") || inferContentType(file.name),
      name: file.name,
    };
  }

  const file = await getAuditoriaFile(relativePath);
  if (!file?.path) return null;
  return {
    buffer: await readFile(file.path),
    contentType: inferContentType(file.name),
    name: file.name,
  };
}

export async function deleteAuditoriaFile(relativePath: string) {
  const normalized = normalizeRelativePath(relativePath);
  const metadata = await readAuditoriaJson<AuditoriaDocumentMetadataMap>(METADATA_FILE, {});

  if (storageEnabled()) {
    const file = await getAuditoriaFile(relativePath);
    if (!file?.url) return false;
    await del(file.url);
    delete metadata[metadataKey(normalized)];
    await writeAuditoriaJson(METADATA_FILE, metadata);
    return true;
  }

  const absolutePath = localPath(relativePath);
  if (!existsSync(absolutePath)) return false;
  await unlink(absolutePath);
  delete metadata[metadataKey(normalized)];
  await writeAuditoriaJson(METADATA_FILE, metadata);
  return true;
}

export async function readAuditoriaJson<T>(relativePath: string, fallback: T): Promise<T> {
  if (storageEnabled()) {
    const file = await getAuditoriaFile(relativePath);
    if (!file?.url) {
      await writeAuditoriaJson(relativePath, fallback);
      return fallback;
    }
    const response = await fetch(file.url, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  }

  const absolutePath = localPath(relativePath);
  const dirPath = path.dirname(absolutePath);
  await ensureLocalDirectory(dirPath);

  if (!existsSync(absolutePath)) {
    if (!usesEphemeralLocalStorage()) {
      await writeFile(absolutePath, JSON.stringify(fallback, null, 2), "utf-8");
    }
    return fallback;
  }

  const raw = await readFile(absolutePath, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (!usesEphemeralLocalStorage()) {
      await writeFile(absolutePath, JSON.stringify(fallback, null, 2), "utf-8");
    }
    return fallback;
  }
}

export async function writeAuditoriaJson<T>(relativePath: string, value: T) {
  const content = JSON.stringify(value, null, 2);

  if (storageEnabled()) {
    const existing = await getAuditoriaFile(relativePath);
    if (existing?.url) {
      await del(existing.url);
    }
    await put(blobPath(relativePath.replace(/\\/g, "/")), content, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return;
  }

  const absolutePath = localPath(relativePath);
  await ensureLocalDirectory(path.dirname(absolutePath));
  await writeFile(absolutePath, content, "utf-8");
}
