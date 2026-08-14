"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserRow, UserPermissions, PermissionsCatalog } from "@/types/utilizadores-page";

async function fetchUsers(search: string, roleFilter: string): Promise<UserRow[]> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("email", search.trim());
    params.set("name", search.trim());
  }
  if (roleFilter) params.set("role", roleFilter);

  const res = await fetch(`/api/user${params.toString() ? `?${params.toString()}` : ""}`);
  const payload = await res.json().catch(() => []);
  if (!res.ok) throw new Error(payload?.error || "Erro ao carregar utilizadores.");
  return Array.isArray(payload) ? payload : [];
}

export function useUsers(search: string, roleFilter: string, enabled: boolean) {
  return useQuery<UserRow[]>({
    queryKey: ["users", search.trim(), roleFilter],
    queryFn: () => fetchUsers(search, roleFilter),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

async function fetchClients(): Promise<{ id: number; nome: string }[]> {
  const res = await fetch("/api/clientes");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function useClients(enabled: boolean) {
  return useQuery<{ id: number; nome: string }[]>({
    queryKey: ["clients", "list"],
    queryFn: fetchClients,
    enabled,
  });
}

type PermissionsResponse = {
  permissions: UserPermissions;
  catalog: PermissionsCatalog;
};

async function fetchUserPermissions(userId: string): Promise<PermissionsResponse> {
  const res = await fetch(`/api/user/permissions?userId=${encodeURIComponent(userId)}`);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || "Erro ao carregar permissões.");
  return {
    permissions: payload?.permissions || {},
    catalog: payload?.catalog || { modules: [], pages: [], editableFields: {} },
  };
}

export function useUserPermissions(userId: string, enabled: boolean) {
  return useQuery<PermissionsResponse>({
    queryKey: ["user-permissions", userId],
    queryFn: () => fetchUserPermissions(userId),
    enabled,
  });
}
