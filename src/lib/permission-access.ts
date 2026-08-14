import { LEGACY_OT_CREATION_ROUTE, OT_CREATION_ROUTE } from "@/lib/permissions-catalog";

type PermissionSnapshotLike = {
  visibleModules?: string[];
  visiblePages?: string[];
  editablePages?: string[];
  editableFields?: Record<string, string[]>;
} | null | undefined;

export function canonicalizePermissionModuleKey(value: string) {
  const normalized = String(value || "").trim();
  if (normalized === "obras") return "ordens-servico";
  if (normalized === "inspecoes") return "jangadas";
  return normalized;
}

export function canonicalizePermissionPathPrefix(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return normalized;

  if (normalized === "/inspecoes" || normalized.startsWith("/inspecoes/")) {
    return `/jangadas${normalized.slice("/inspecoes".length)}`;
  }

  if (normalized === LEGACY_OT_CREATION_ROUTE || normalized.startsWith(`${LEGACY_OT_CREATION_ROUTE}/`)) {
    return `/ordens-servico${normalized.slice(LEGACY_OT_CREATION_ROUTE.length)}`;
  }

  if (normalized === OT_CREATION_ROUTE || normalized.startsWith(`${OT_CREATION_ROUTE}/`)) {
    return `/ordens-servico${normalized.slice(OT_CREATION_ROUTE.length)}`;
  }

  return normalized;
}

export function pathMatchesPrefix(pathname: string, prefix: string) {
  const normalizedPathname = canonicalizePermissionPathPrefix(pathname);
  const normalizedPrefix = canonicalizePermissionPathPrefix(prefix);

  if (normalizedPrefix === "/") return normalizedPathname === "/";
  return normalizedPathname === normalizedPrefix || normalizedPathname.startsWith(`${normalizedPrefix}/`);
}

export function hasModulePermission(permissions: PermissionSnapshotLike, moduleKey: string) {
  const expectedModuleKey = canonicalizePermissionModuleKey(moduleKey);
  return Array.isArray(permissions?.visibleModules)
    && permissions.visibleModules.some((value) => canonicalizePermissionModuleKey(String(value)) === expectedModuleKey);
}

export function hasVisiblePathPermission(permissions: PermissionSnapshotLike, pathname: string) {
  return Array.isArray(permissions?.visiblePages)
    && permissions.visiblePages.some((prefix) => pathMatchesPrefix(pathname, String(prefix)));
}

export function hasEditablePathPermission(permissions: PermissionSnapshotLike, pathname: string) {
  return Array.isArray(permissions?.editablePages)
    && permissions.editablePages.some((prefix) => pathMatchesPrefix(pathname, String(prefix)));
}

export function hasElevatedAccess(args: {
  role?: "ADMIN" | "USER" | string | null;
  permissions?: PermissionSnapshotLike;
}) {
  if (args.role === "ADMIN") return true;

  const permissions = args.permissions;
  return hasModulePermission(permissions, "utilizadores")
    && hasVisiblePathPermission(permissions, "/utilizadores")
    && hasEditablePathPermission(permissions, "/utilizadores");
}

export function getAccessRoleLabel(args: {
  role?: "ADMIN" | "USER" | "CLIENTE" | string | null;
  permissions?: PermissionSnapshotLike;
}) {
  if (args.role === "ADMIN") return "Administrador";
  if (args.role === "CLIENTE") return "Cliente";
  if (hasElevatedAccess(args)) return "Testador";
  return "Utilizador";
}