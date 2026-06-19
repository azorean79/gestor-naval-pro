import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import {
  ACTIVE_SERVICE_STATION_COOKIE,
  clearActiveServiceStationCookie,
  resolveActiveServiceStationId,
  setActiveServiceStationCookie,
} from "@/lib/station-selection";
import { getServiceStationProfile } from "@/lib/service-station-profile";
import { buildVisibleServiceStationWhere } from "@/lib/service-station-visibility";

async function listAllowedStations(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return prisma.serviceStation.findMany({
    where: buildVisibleServiceStationWhere({
      ativo: true,
      ...(access.stationId
        ? { id: access.stationId }
        : access.isAdmin
          ? {}
          : { id: { in: access.allowedStationIds.length ? access.allowedStationIds : [-1] } }),
    }),
    orderBy: [{ nome: "asc" }],
    select: {
      id: true,
      codigo: true,
      nome: true,
      empresa: true,
      localizacao: true,
      territorioTipo: true,
      regiaoOperacional: true,
    },
  });
}

export async function GET(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  const availableStations = await listAllowedStations(access);
  const activeStationId = resolveActiveServiceStationId(req, access);
  const activeStation = availableStations.find((station) => station.id === activeStationId) || null;
  const profile = getServiceStationProfile(activeStation?.codigo || null);

  return NextResponse.json({
    cookieName: ACTIVE_SERVICE_STATION_COOKIE,
    activeStationId,
    activeStation,
    availableStations,
    canSelectStation: access.isAdmin || availableStations.length > 1,
    canViewAllStations: access.isAdmin && availableStations.length > 1,
    profile,
  });
}

export async function POST(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawStationId = body?.stationId;

  if (rawStationId === null || rawStationId === "") {
    const response = NextResponse.json({ success: true, activeStationId: null, activeStation: null });
    clearActiveServiceStationCookie(response);
    return response;
  }

  const stationId = Number(rawStationId);
  if (!Number.isFinite(stationId) || stationId <= 0) {
    return NextResponse.json({ error: "Estação inválida." }, { status: 400 });
  }

  const availableStations = await listAllowedStations(access);
  const selectedStation = availableStations.find((station) => station.id === stationId);
  if (!selectedStation) {
    return NextResponse.json({ error: "Sem acesso à estação selecionada." }, { status: 403 });
  }

  const response = NextResponse.json({
    success: true,
    activeStationId: selectedStation.id,
    activeStation: selectedStation,
    profile: getServiceStationProfile(selectedStation.codigo),
  });
  setActiveServiceStationCookie(response, selectedStation.id);
  return response;
}