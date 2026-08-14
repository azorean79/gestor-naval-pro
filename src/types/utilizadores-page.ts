type UserPermissions = {
  visibleModules?: string[];
  visiblePages?: string[];
  editablePages?: string[];
  editableFields?: Record<string, string[]>;
};

type PermissionModuleOption = { key: string; label: string; href: string };
type PermissionPageOption = { key: string; label: string; prefix: string };
type PermissionFieldOption = { key: string; label: string };

type PermissionsCatalog = {
  modules: PermissionModuleOption[];
  pages: PermissionPageOption[];
  editableFields: Record<string, PermissionFieldOption[]>;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER" | "CLIENTE";
  image?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
  onlineSessions?: number;
  presenceLastSeenAt?: string | null;
  activeSessions?: Array<{
    sessionId: string;
    createdAt: string;
    lastSeenAt: string;
    lastPath?: string;
  }>;
  permissions?: UserPermissions;
  clienteId?: number | null;
  cliente?: {
    id: number;
    nome: string;
  } | null;
  _count?: {
    posts?: number;
  };
};

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER" | "CLIENTE";
  clienteId?: number;
};

const INITIAL_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  clienteId: undefined,
};

export type {
  UserPermissions,
  PermissionModuleOption,
  PermissionPageOption,
  PermissionFieldOption,
  PermissionsCatalog,
  UserRow,
  UserFormState,
};
export { INITIAL_FORM };
