import "dotenv/config";
import bcrypt from "bcryptjs";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  EDITABLE_FIELD_GROUPS,
  type PermissionModuleKey,
} from "../src/lib/permissions-catalog";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const DEFAULT_PASSWORD = "aveleda123";
const TARGET_STATION_CODE = "AVELEDA";
const LEGACY_PERMISSION_STORE_FILE = path.join(process.cwd(), "auditorias_documentos", "_meta", "user-permissions.json");

type ManagedRole = "station-admin" | "administrative" | "technician";

type PlainPermissionsOverride = {
  visibleModules: PermissionModuleKey[];
  visiblePages: string[];
  editablePages: string[];
  editableFields: Record<string, string[]>;
  allowedStationCodes: string[];
  updatedAt: string;
};

type LegacyPermissionStore = Record<string, PlainPermissionsOverride>;

const STATION_CONTACT_CLASSIFICATION: Record<string, {
  stationAdmins: string[];
  administrative: string[];
  technicians: string[];
}> = {
  AVELEDA: {
    stationAdmins: ["RICARDO SILVA"],
    administrative: ["HENRIQUE CARDOSO"],
    technicians: ["CRISTIANO GOMES", "JORGE PINHEIRO", "WILLIAN RIBEIRO"],
  },
};

const ALL_JANGADA_EDITABLE_FIELDS = EDITABLE_FIELD_GROUPS["jangadas-detail"].map((field) => field.key);

const TECHNICIAN_MODULES: PermissionModuleKey[] = [
  "dashboard",
  "agenda",
  "alertas",
  "inspecoes",
  "jangadas",
  "navios",
  "clientes",
  "equipamentos",
  "stock",
  "obras",
  "fotos",
];

const ADMINISTRATIVE_MODULES: PermissionModuleKey[] = [
  "dashboard",
  "agenda",
  "alertas",
  "inspecoes",
  "jangadas",
  "navios",
  "clientes",
  "equipamentos",
  "stock",
  "obras",
  "fotos",
  "contactos-internos",
];

const STATION_ADMIN_MODULES: PermissionModuleKey[] = [
  "dashboard",
  "agenda",
  "alertas",
  "inspecoes",
  "jangadas",
  "navios",
  "clientes",
  "equipamentos",
  "stock",
  "obras",
  "departamento-tecnico",
  "fotos",
  "contactos-internos",
];

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeNameKey(value: unknown) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function titleCaseName(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeEmail(email: unknown) {
  const value = String(email || "").trim().toLowerCase();
  return value || null;
}

function buildFallbackEmail(name: string) {
  const base = normalizeText(name).replace(/\s+/g, ".");
  return `${base || "utilizador"}@orey.local`;
}

function dedupe<T>(values: T[]) {
  return Array.from(new Set(values));
}

function buildPages(prefixes: string[]) {
  return dedupe(prefixes);
}

function buildPermissionOverride(kind: ManagedRole, stationCode: string): PlainPermissionsOverride {
  const timestamp = new Date().toISOString();

  if (kind === "technician") {
    return {
      visibleModules: TECHNICIAN_MODULES,
      visiblePages: buildPages([
        "/",
        "/dashboard",
        "/agenda",
        "/alertas",
        "/inspecoes",
        "/jangadas",
        "/navios",
        "/clientes",
        "/equipamentos",
        "/stock",
        "/obras",
        "/fotos",
      ]),
      editablePages: buildPages([
        "/agenda",
        "/alertas",
        "/inspecoes",
        "/jangadas",
        "/navios",
        "/obras",
        "/equipamentos",
        "/stock",
      ]),
      editableFields: {
        "jangadas-detail": ALL_JANGADA_EDITABLE_FIELDS,
      },
      allowedStationCodes: [stationCode],
      updatedAt: timestamp,
    };
  }

  if (kind === "administrative") {
    return {
      visibleModules: ADMINISTRATIVE_MODULES,
      visiblePages: buildPages([
        "/",
        "/dashboard",
        "/agenda",
        "/alertas",
        "/inspecoes",
        "/jangadas",
        "/navios",
        "/clientes",
        "/equipamentos",
        "/stock",
        "/obras",
        "/fotos",
        "/contactos-internos",
      ]),
      editablePages: buildPages([
        "/agenda",
        "/jangadas",
        "/navios",
        "/clientes",
        "/equipamentos",
        "/stock",
        "/obras",
        "/contactos-internos",
      ]),
      editableFields: {
        "jangadas-detail": [],
      },
      allowedStationCodes: [stationCode],
      updatedAt: timestamp,
    };
  }

  return {
    visibleModules: STATION_ADMIN_MODULES,
    visiblePages: buildPages([
      "/",
      "/dashboard",
      "/agenda",
      "/alertas",
      "/inspecoes",
      "/jangadas",
      "/navios",
      "/clientes",
      "/equipamentos",
      "/stock",
      "/obras",
      "/departamento-tecnico",
      "/fotos",
      "/contactos-internos",
    ]),
    editablePages: buildPages([
      "/agenda",
      "/alertas",
      "/inspecoes",
      "/jangadas",
      "/navios",
      "/clientes",
      "/equipamentos",
      "/stock",
      "/obras",
      "/departamento-tecnico",
      "/contactos-internos",
    ]),
    editableFields: {
      "jangadas-detail": ALL_JANGADA_EDITABLE_FIELDS,
    },
    allowedStationCodes: [stationCode],
    updatedAt: timestamp,
  };
}

function resolveManagedRole(name: string, stationCode: string): ManagedRole | null {
  const config = STATION_CONTACT_CLASSIFICATION[stationCode];
  if (!config) return null;

  const normalized = normalizeNameKey(name);
  if (config.stationAdmins.some((item) => normalizeNameKey(item) === normalized)) return "station-admin";
  if (config.administrative.some((item) => normalizeNameKey(item) === normalized)) return "administrative";
  if (config.technicians.some((item) => normalizeNameKey(item) === normalized)) return "technician";
  return null;
}

function isMissingPermissionsOverrideColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes("User.permissionsOverrideJson") || message.toLowerCase().includes("permissionsoverridejson");
}

async function readLegacyPermissionStore(): Promise<LegacyPermissionStore> {
  if (!existsSync(LEGACY_PERMISSION_STORE_FILE)) {
    return {};
  }

  const raw = await readFile(LEGACY_PERMISSION_STORE_FILE, "utf-8");
  return raw.trim() ? (JSON.parse(raw) as LegacyPermissionStore) : {};
}

async function writeLegacyPermissionStore(store: LegacyPermissionStore) {
  await mkdir(path.dirname(LEGACY_PERMISSION_STORE_FILE), { recursive: true });
  await writeFile(LEGACY_PERMISSION_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function databaseSupportsPermissionOverrides() {
  try {
    await prisma.user.findFirst({
      select: { id: true, permissionsOverrideJson: true },
    });
    return true;
  } catch (error) {
    if (isMissingPermissionsOverrideColumn(error)) {
      return false;
    }
    throw error;
  }
}

async function main() {
  const station = await prisma.serviceStation.findFirst({
    where: { ativo: true, codigo: TARGET_STATION_CODE },
    select: { id: true, codigo: true, nome: true },
  });

  if (!station) {
    throw new Error(`Estação ${TARGET_STATION_CODE} não encontrada ou inativa.`);
  }

  const contacts = await prisma.contactoInterno.findMany({
    where: {
      ativo: true,
      localizacao: { contains: station.nome, mode: "insensitive" },
    },
    orderBy: [{ nome: "asc" }],
  });

  const managedContacts = contacts
    .map((contact) => ({
      contact,
      managedRole: resolveManagedRole(contact.nome, station.codigo),
    }))
    .filter((item) => item.managedRole !== null);

  if (!managedContacts.length) {
    console.log(`Nenhum contacto elegível encontrado para ${station.codigo}.`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const supportsPermissionOverridesInDb = await databaseSupportsPermissionOverrides();
  const legacyPermissionStore = supportsPermissionOverridesInDb ? null : await readLegacyPermissionStore();
  const summary = {
    mode: APPLY ? "apply" : "dry-run",
    station: station.codigo,
    usersCreated: 0,
    usersUpdated: 0,
    techniciansCreated: 0,
    techniciansUpdated: 0,
    skipped: 0,
    fallbackEmails: 0,
  };

  for (const { contact, managedRole } of managedContacts) {
    const name = titleCaseName(contact.nome);
    const email = normalizeEmail(contact.email) || buildFallbackEmail(name);
    const usingFallbackEmail = !normalizeEmail(contact.email);
    const permissionsOverride = buildPermissionOverride(managedRole as ManagedRole, station.codigo);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name: { equals: name, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!existingUser && usingFallbackEmail) {
      summary.fallbackEmails += 1;
    }

    if (APPLY) {
      if (!existingUser) {
        const createdUser = await prisma.user.create({
          data: {
            email,
            name,
            role: UserRole.USER,
            passwordHash,
            ...(supportsPermissionOverridesInDb
              ? { permissionsOverrideJson: JSON.stringify(permissionsOverride) }
              : {}),
          },
          select: { id: true },
        });

        if (!supportsPermissionOverridesInDb && legacyPermissionStore) {
          legacyPermissionStore[String(createdUser.id)] = permissionsOverride;
        }

        summary.usersCreated += 1;
      } else {
        const nextData: {
          email?: string;
          name?: string;
          passwordHash?: string;
          permissionsOverrideJson?: string;
        } = {};

        if ((existingUser.name || "") !== name) nextData.name = name;
        if ((existingUser.email || "") !== email) nextData.email = email;
        nextData.passwordHash = passwordHash;

        const serializedPermissions = JSON.stringify(permissionsOverride);
        const storedLegacyPermissions = legacyPermissionStore?.[String(existingUser.id)]
          ? JSON.stringify(legacyPermissionStore[String(existingUser.id)])
          : "";

        if (supportsPermissionOverridesInDb) {
          nextData.permissionsOverrideJson = serializedPermissions;
        } else if (legacyPermissionStore && storedLegacyPermissions !== serializedPermissions) {
          legacyPermissionStore[String(existingUser.id)] = permissionsOverride;
        }

        if (Object.keys(nextData).length > 0) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: nextData,
          });
          summary.usersUpdated += 1;
        } else {
          summary.skipped += 1;
        }
      }
    } else if (!existingUser) {
      summary.usersCreated += 1;
    } else {
      summary.usersUpdated += 1;
    }

    if (managedRole === "technician") {
      const existingTecnico = await prisma.tecnico.findFirst({
        where: {
          OR: [
            { email },
            { nome: { equals: name, mode: "insensitive" } },
          ],
        },
        select: { id: true, nome: true, email: true, serviceStationId: true, ativo: true },
      });

      if (APPLY) {
        if (!existingTecnico) {
          await prisma.tecnico.create({
            data: {
              nome: name,
              email,
              ativo: true,
              serviceStationId: station.id,
              observacoes: `Sincronizado a partir de contactos internos (${station.codigo}).`,
            },
          });
          summary.techniciansCreated += 1;
        } else {
          const nextTecnicoData: {
            nome?: string;
            email?: string;
            ativo?: boolean;
            serviceStationId?: number;
          } = {};

          if ((existingTecnico.nome || "") !== name) nextTecnicoData.nome = name;
          if ((existingTecnico.email || "") !== email) nextTecnicoData.email = email;
          if (existingTecnico.ativo !== true) nextTecnicoData.ativo = true;
          if (Number(existingTecnico.serviceStationId || 0) !== Number(station.id)) {
            nextTecnicoData.serviceStationId = station.id;
          }

          if (Object.keys(nextTecnicoData).length > 0) {
            await prisma.tecnico.update({
              where: { id: existingTecnico.id },
              data: nextTecnicoData,
            });
            summary.techniciansUpdated += 1;
          }
        }
      } else if (!existingTecnico) {
        summary.techniciansCreated += 1;
      } else {
        summary.techniciansUpdated += 1;
      }
    }

    console.log(
      `[${APPLY ? "SYNC" : "DRY"}] ${managedRole} :: ${name} -> ${email}${usingFallbackEmail ? " (fallback)" : ""}`
    );
  }

  if (APPLY && !supportsPermissionOverridesInDb && legacyPermissionStore) {
    await writeLegacyPermissionStore(legacyPermissionStore);
  }

  console.log("\nResumo");
  console.table(summary);
  console.log(`Password por defeito para novos utilizadores: ${DEFAULT_PASSWORD}`);
  if (!supportsPermissionOverridesInDb) {
    console.log(`Permissões gravadas no fallback legado: ${LEGACY_PERMISSION_STORE_FILE}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });