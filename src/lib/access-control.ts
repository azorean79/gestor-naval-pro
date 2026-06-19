import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import { APP_CONFIG } from "@/lib/app-config";
import { hasElevatedAccess } from "@/lib/permission-access";
import { buildVisibleServiceStationWhere } from "@/lib/service-station-visibility";
import { normalizeCodeToken } from "@/lib/text-normalization";
import {
  resolveEffectivePermissions,
  type EffectiveUserPermissions,
} from "@/lib/user-permissions";

export type AccessContext = {
  userId: number;
  email: string;
  role: "ADMIN" | "USER";
  isAdmin: boolean;
  stationId: number | null;
  allowedStationIds: number[];
  permissions: EffectiveUserPermissions;
};

function normalizeStationCodeToken(value: unknown) {
  return normalizeCodeToken(value || "");
}

async function resolveDefaultStationId() {
  const station = await prisma.serviceStation.findFirst({
    where: buildVisibleServiceStationWhere({ ativo: true, codigo: APP_CONFIG.defaultServiceStationCode }),
    select: { id: true },
  });
  return station?.id ?? null;
}

async function resolveAllowedStationIds(permissions: EffectiveUserPermissions) {
  const allowedCodes = Array.isArray(permissions.allowedStationCodes)
    ? permissions.allowedStationCodes.map((value) => normalizeStationCodeToken(value)).filter(Boolean)
    : [];

  if (!allowedCodes.length) return [] as number[];

  const allowedSet = new Set(allowedCodes);
  const stations = await prisma.serviceStation.findMany({
    where: buildVisibleServiceStationWhere({ ativo: true }),
    select: { id: true, codigo: true, nome: true },
  });

  return stations
    .filter((station) => (
      allowedSet.has(normalizeStationCodeToken(station.codigo))
      || allowedSet.has(normalizeStationCodeToken(station.nome))
    ))
    .map((station) => station.id);
}

async function resolveAllVisibleStationIds() {
  const stations = await prisma.serviceStation.findMany({
    where: buildVisibleServiceStationWhere({ ativo: true }),
    select: { id: true },
  });

  return stations.map((station) => station.id);
}

export async function getAccessContext(): Promise<AccessContext | null> {
  const session = await getAuthSession();
  const user = session?.user;
  if (!user?.id || !user?.email) return null;

  const parsedId = Number(user.id);
  if (!Number.isFinite(parsedId) || parsedId <= 0) return null;

  const role = user.role === "ADMIN" ? "ADMIN" : "USER";
  const permissions = await resolveEffectivePermissions({
    userId: parsedId,
    role,
  });
  let allowedStationIds = await resolveAllowedStationIds(permissions);
  const isAdmin = hasElevatedAccess({ role, permissions });
  if (isAdmin && allowedStationIds.length === 0) {
    allowedStationIds = await resolveAllVisibleStationIds();
  }
  const defaultStationId = await resolveDefaultStationId();
  const stationId = isAdmin
    ? null
    : allowedStationIds.length === 1
      ? allowedStationIds[0]
      : allowedStationIds.length > 1
        ? null
        : defaultStationId;

  if (isAdmin) {
    return {
      userId: parsedId,
      email: user.email,
      role,
      isAdmin,
      stationId,
      allowedStationIds,
      permissions,
    };
  }

  return {
    userId: parsedId,
    email: user.email,
    role,
    isAdmin,
    stationId,
    allowedStationIds,
    permissions,
  };
}
