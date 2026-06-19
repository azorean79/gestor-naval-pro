"use client";
import * as React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { APP_CONFIG } from "@/lib/app-config";
import { APP_TOAST_EVENT, type AppToastPayload } from "@/lib/app-toast";
import { canonicalizePermissionPathPrefix } from "@/lib/permission-access";
import { getAccessRoleLabel, hasElevatedAccess } from "@/lib/permission-access";
import { LEGACY_OT_CREATION_ROUTE, OT_CREATION_ROUTE } from "@/lib/permissions-catalog";
import { getServiceStationProfile } from "@/lib/service-station-profile";
import { AppThemeName } from "@/theme";
import GlobalSearch from "@/components/GlobalSearch";
import { useAppThemeController } from "./providers";

const drawerWidth = 244;
const tabletDrawerWidth = 216;

type NavItem = {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  roles?: Array<"ADMIN" | "USER">;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type LoginAlertEvent = {
  sessionId: string;
  userId: number;
  email: string;
  name?: string | null;
  createdAt: string;
  lastPath?: string;
};

const navSections: NavSection[] = [
  {
    label: "Operação",
    items: [

      { label: "Agenda", href: "/agenda", icon: "🗓️", roles: ["ADMIN"] },

      { label: "Estação de Serviço", href: "/estacao-servico", icon: "🏭", roles: ["ADMIN"] },
      { label: "Logística", href: "/logistica", icon: "🚚", roles: ["ADMIN"] },
      { label: "Alertas", href: "/alertas", icon: "🚨", roles: ["ADMIN"] },
      { label: "Importação IA", href: "/ia-importacao", icon: "🤖", roles: ["ADMIN"] },
      { label: "Backups", href: "/backups", icon: "💾", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Frota e Clientes",
    items: [
      { label: "Jangadas (início)", href: "/", icon: "🛟", roles: ["ADMIN", "USER"] },
      { label: "Jangadas", href: "/jangadas", icon: "🛶", roles: ["ADMIN", "USER"] },
      { label: "Inspeções", href: "/inspecoes", icon: "📋", roles: ["ADMIN", "USER"] },
      { label: "Packs", href: "/packs", icon: "🎒", roles: ["ADMIN", "USER"] },
      { label: "Navios", href: "/navios", icon: "🚢", roles: ["ADMIN"] },
      { label: "EPIRBs", href: "/epirbs", icon: "📡", roles: ["ADMIN"] },
      { label: "Clientes", href: "/clientes", icon: "👥", roles: ["ADMIN"] },
      { label: "Técnicos", href: "/tecnicos", icon: "🧑‍🔧", roles: ["ADMIN"] },
      { label: "Coletes", href: "/equipamentos", icon: "🦺", roles: ["ADMIN"] },
      { label: "Stock", href: "/stock", icon: "📦", roles: ["ADMIN"] },
      { label: "Reposições Stock", href: "/stock/reposicoes", icon: "🔁", roles: ["ADMIN"] },
      { label: "Cilindros", href: "/cilindros", icon: "🫙", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Suporte e Documentação",
    items: [
      { label: "Departamento Técnico", href: "/departamento-tecnico", icon: "🧠", roles: ["ADMIN"] },
      { label: "Legislação", href: "/legislacao", icon: "⚖️", roles: ["ADMIN"] },
      { label: "DGRM", href: "/dgrm", icon: "🏛️", roles: ["ADMIN"] },
      { label: "Auditorias", href: "/auditorias", icon: "🔍", roles: ["ADMIN"] },
      { label: "Certificados Externos (PDF)", href: "/fotos", icon: "📄", roles: ["ADMIN"] },
      { label: "Contactos Internos", href: "/contactos-internos", icon: "☎️", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Utilizadores", href: "/utilizadores", icon: "👤", roles: ["ADMIN"] },
      { label: "Registar", href: "/registar", icon: "➕", roles: ["ADMIN"] },
    ],
  },
];

function isNavItemActive(pathname: string, href: string) {
  const normalizedPathname = canonicalizePermissionPathPrefix(pathname);
  const normalizedHref = canonicalizePermissionPathPrefix(href);

  if (normalizedHref === "/") {
    return normalizedPathname === "/";
  }

  if (normalizedHref === "/stock" && normalizedPathname.startsWith("/stock/reposicoes")) {
    return false;
  }

  return normalizedPathname === normalizedHref || normalizedPathname.startsWith(`${normalizedHref}/`);
}

function pathMatchesPrefix(pathname: string, prefix: string) {
  const normalizedPathname = canonicalizePermissionPathPrefix(pathname);
  const normalizedPrefix = canonicalizePermissionPathPrefix(prefix);

  if (normalizedPrefix === "/") return normalizedPathname === "/";
  return normalizedPathname === normalizedPrefix || normalizedPathname.startsWith(`${normalizedPrefix}/`);
}

export default function ModernLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [accountAnchorEl, setAccountAnchorEl] = React.useState<null | HTMLElement>(null);
  const [activeStationCode, setActiveStationCode] = React.useState<string | null>(null);
  const [loginAlertsQueue, setLoginAlertsQueue] = React.useState<LoginAlertEvent[]>([]);
  const [activeLoginAlert, setActiveLoginAlert] = React.useState<LoginAlertEvent | null>(null);
  const [appToastQueue, setAppToastQueue] = React.useState<AppToastPayload[]>([]);
  const [activeAppToast, setActiveAppToast] = React.useState<AppToastPayload | null>(null);
  const loginAlertSeenRef = React.useRef<Set<string>>(new Set());
  const loginAlertInitializedRef = React.useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const canRenderInteractiveHeader = mounted;
  const { themeName, setThemeName, themeOptions } = useAppThemeController();

  const isLoginPage = pathname === "/login";
  const user = session?.user;
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || user?.email?.trim()?.charAt(0)?.toUpperCase() || "U";
  const userRole = user?.role === "ADMIN" ? "ADMIN" : "USER";
  const userIsAdmin = user?.role === "ADMIN";
  const hasElevatedUserAccess = hasElevatedAccess({ role: user?.role, permissions: user?.permissions });
  const userAccessLabel = getAccessRoleLabel({ role: user?.role, permissions: user?.permissions });
  const stationProfile = React.useMemo(() => getServiceStationProfile(activeStationCode), [activeStationCode]);
  const hiddenModuleKeys = React.useMemo(() => new Set(stationProfile.hiddenModuleKeys), [stationProfile]);
  const visibleModuleKeys = new Set<string>(Array.isArray(user?.permissions?.visibleModules) ? user.permissions.visibleModules : []);
  const visiblePagePrefixes = Array.isArray(user?.permissions?.visiblePages) ? user.permissions.visiblePages.map((item) => String(item)) : [];
  const moduleKeyByHref: Record<string, string> = {
    "/": "jangadas",
    "/": "dashboard",

    "/agenda": "agenda",
    "/estacao-servico": "estacao-servico",
    "/logistica": "logistica",
    "/alertas": "alertas",
    "/inspecoes": "jangadas",

    "/relatorios": "relatorios",
    "/jangadas": "jangadas",
    "/packs": "packs",
    "/navios": "navios",
    "/epirbs": "epirbs",
    "/clientes": "clientes",
    "/tecnicos": "tecnicos",
    "/equipamentos": "equipamentos",
    "/stock": "stock",
    "/stock/reposicoes": "stock",
    "/cilindros": "cilindros",
    [OT_CREATION_ROUTE]: "obras",
    [LEGACY_OT_CREATION_ROUTE]: "obras",
    "/departamento-tecnico": "departamento-tecnico",
    "/dgrm": "dgrm",
    "/auditorias": "auditorias",
    "/fotos": "fotos",
    "/contactos-internos": "contactos-internos",
    "/ia-importacao": "ia-importacao",
    "/legislacao": "legislacao",
    "/utilizadores": "utilizadores",
    "/registar": "registar",
  };

  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const key = moduleKeyByHref[item.href] || item.href;
        if (hiddenModuleKeys.has(key)) return false;
        const explicitlyGranted = visibleModuleKeys.has(key) || visiblePagePrefixes.some((prefix) => pathMatchesPrefix(item.href, prefix));

        // Compatibilidade: ADMIN deve continuar a ver todos os módulos
        // mesmo quando existem overrides antigos incompletos.
        if (userIsAdmin) return true;

        // Se o ADMIN tiver overrides (ex: limitamos o que ele vê explicitamente):
        const hasOverrides = visibleModuleKeys.size > 0 || visiblePagePrefixes.length > 0;
        if (hasOverrides && !explicitlyGranted) return false;
        if (explicitlyGranted) return true;
        if (hasOverrides) return false;
        if (item.roles && !item.roles.includes(userRole)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !user) return;
    let active = true;

    fetch("/api/active-service-station", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setActiveStationCode(payload?.activeStation?.codigo || null);
      })
      .catch(() => {
        if (!active) return;
        setActiveStationCode(null);
      });

    return () => {
      active = false;
    };
  }, [mounted, user?.id]);

  React.useEffect(() => {
    if (isLoginPage) {
      setMobileOpen(false);
    }
  }, [isLoginPage]);

  React.useEffect(() => {
    if (!mounted || !user || !hasElevatedUserAccess) return;

    const storageKey = `admin-login-alert-seen:${user.id}`;
    let active = true;

    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        loginAlertSeenRef.current = new Set(parsed.map((item) => String(item || "")).filter(Boolean));
      }
    } catch {
      loginAlertSeenRef.current = new Set();
    }

    const saveSeenIds = () => {
      try {
        const ids = Array.from(loginAlertSeenRef.current).slice(-400);
        window.localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch {
        // no-op
      }
    };

    const pollLoginAlerts = async () => {
      try {
        const response = await fetch("/api/user/presence?sinceMinutes=45", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        const events = Array.isArray(payload?.events) ? (payload.events as LoginAlertEvent[]) : [];
        if (!active || events.length === 0) return;

        if (!loginAlertInitializedRef.current) {
          events.forEach((event) => {
            if (event?.sessionId) loginAlertSeenRef.current.add(String(event.sessionId));
          });
          loginAlertInitializedRef.current = true;
          saveSeenIds();
          return;
        }

        const currentUserId = Number(user.id);
        const fresh = [...events]
          .reverse()
          .filter((event) => {
            const sessionId = String(event?.sessionId || "");
            if (!sessionId) return false;
            if (Number(event.userId) === currentUserId) {
              loginAlertSeenRef.current.add(sessionId);
              return false;
            }
            if (loginAlertSeenRef.current.has(sessionId)) return false;
            loginAlertSeenRef.current.add(sessionId);
            return true;
          });

        if (fresh.length > 0) {
          setLoginAlertsQueue((prev) => [...prev, ...fresh]);
          saveSeenIds();
        }
      } catch {
        // no-op
      }
    };

    void pollLoginAlerts();
    const intervalId = window.setInterval(() => {
      void pollLoginAlerts();
    }, 20_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [mounted, user?.id, hasElevatedUserAccess]);

  React.useEffect(() => {
    if (activeLoginAlert || loginAlertsQueue.length === 0) return;
    const [next, ...rest] = loginAlertsQueue;
    setActiveLoginAlert(next);
    setLoginAlertsQueue(rest);
  }, [activeLoginAlert, loginAlertsQueue]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAppToast = (event: Event) => {
      const customEvent = event as CustomEvent<AppToastPayload>;
      const payload = customEvent.detail;
      if (!payload?.message) return;
      setAppToastQueue((prev) => [...prev, payload]);
    };

    window.addEventListener(APP_TOAST_EVENT, handleAppToast as EventListener);
    return () => {
      window.removeEventListener(APP_TOAST_EVENT, handleAppToast as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (activeAppToast || appToastQueue.length === 0) return;
    const [next, ...rest] = appToastQueue;
    setActiveAppToast(next);
    setAppToastQueue(rest);
  }, [activeAppToast, appToastQueue]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };



  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAccountAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountAnchorEl(null);
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    handleAccountMenuClose();
    await fetch("/api/user/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname, offline: true }),
      keepalive: true,
    }).catch(() => undefined);
    await signOut({ callbackUrl: "/login" });
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main", fontSize: 16 }}>⚓</Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            {APP_CONFIG.name}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 1.25, py: 1.5 }}>
        {visibleNavSections.map((section, sectionIndex) => (
          <Box
            key={section.label}
            sx={{
              mb: sectionIndex === visibleNavSections.length - 1 ? 0 : 1.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(248,250,252,0.8)",
              borderRadius: 2,
              px: 0.75,
              py: 0.75,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                pb: 0.75,
                display: "block",
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {section.label}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item.href);

                return (
                  <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={active}
                      sx={{
                        borderRadius: 2,
                        px: 1.75,
                        py: 1,
                        border: "1px solid transparent",
                        '&.Mui-selected': {
                            bgcolor: 'rgba(59, 130, 246, 0.16)',
                            color: 'primary.main',
                            borderColor: 'rgba(59, 130, 246, 0.24)',
                        },
                        '&.Mui-selected:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.22)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: active ? 'primary.main' : 'text.secondary' }}>
                        <Typography component="span" sx={{ fontSize: 15.5, lineHeight: 1 }}>{item.icon || "•"}</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: 14.5,
                          fontWeight: active ? 700 : 500,
                          color: 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "primary.main",
          backgroundImage: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <Toolbar>
          {!isLoginPage && <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>}
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: "-0.02em", textShadow: "0 1px 0 rgba(15,23,42,0.22)" }}>
            {APP_CONFIG.name}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {!isLoginPage && canRenderInteractiveHeader ? <GlobalSearch showTrigger /> : null}
          {!isLoginPage && canRenderInteractiveHeader ? (
            <FormControl
              size="small"
              sx={{
                minWidth: 165,
                mr: 1.5,
                display: { xs: "none", lg: "block" },
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  borderRadius: 999,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.65)' },
                  '&.Mui-focused fieldset': { borderColor: '#fff' },
                },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              <Select
                native
                value={themeName}
                onChange={(event) => setThemeName(event.target.value as AppThemeName)}
                inputProps={{ 'aria-label': 'Selecionar tema visual' }}
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          ) : null}
          {!canRenderInteractiveHeader ? null : status === "loading" ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : user ? (
            <>
              <Button color="inherit" onClick={handleAccountMenuOpen} startIcon={<Avatar src={user.image || undefined} sx={{ width: 32, height: 32 }}>{userInitial}</Avatar>} sx={{ textTransform: "none", borderRadius: 999, px: 1.5 }} suppressHydrationWarning>
                <Stack spacing={0} sx={{ alignItems: "flex-start", display: { xs: "none", md: "flex" } }}>
                  <span className="text-sm font-semibold leading-tight">{user.name || user.email}</span>
                  <span className="text-[11px] leading-tight opacity-90">{userAccessLabel}</span>
                </Stack>
              </Button>
              <Menu anchorEl={accountAnchorEl} open={Boolean(accountAnchorEl)} onClose={handleAccountMenuClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
                <MenuItem disabled>{user.email}</MenuItem>
                <MenuItem disabled>{userAccessLabel}</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Terminar sessão</MenuItem>
              </Menu>
            </>
          ) : !isLoginPage ? (
            <Button color="inherit" variant="outlined" onClick={handleLogin} sx={{ borderColor: "rgba(255,255,255,0.5)", color: "white", textTransform: "none", '&:hover': { borderColor: "white", bgcolor: "rgba(255,255,255,0.08)" } }}>
              Entrar
            </Button>
          ) : null}
        </Toolbar>
      </AppBar>
      {!isLoginPage && <Box component="nav" sx={{ width: { md: tabletDrawerWidth, lg: drawerWidth }, flexShrink: { md: 0 } }} aria-label="menu principal">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: { md: tabletDrawerWidth, lg: drawerWidth },
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>}
      <Box component="main" sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, px: { xs: 1.5, sm: 2, md: 2.5, lg: 3.5 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 10 }, width: isLoginPage ? "100%" : { md: `calc(100% - ${tabletDrawerWidth}px)`, lg: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          {children}
        </Box>
      </Box>
      <Box
        component="footer"
        sx={{
          position: "fixed",
          left: isLoginPage ? 0 : { md: `${tabletDrawerWidth}px`, lg: `${drawerWidth}px` },
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.appBar - 1,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          px: { xs: 1.5, sm: 2, md: 2.5, lg: 3.5 },
          py: 1.25,
          textAlign: "center",
          color: "primary.main",
        }}
      >
        <Typography variant="body2">
          {APP_CONFIG.name} &copy; 2026
        </Typography>
      </Box>
      <Snackbar
        open={Boolean(activeAppToast)}
        autoHideDuration={activeAppToast?.duration || 3500}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setActiveAppToast(null)}
      >
        <Alert
          onClose={() => setActiveAppToast(null)}
          severity={activeAppToast?.severity || "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {activeAppToast?.message || ""}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(activeLoginAlert)}
        autoHideDuration={6500}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setActiveLoginAlert(null)}
        sx={{ mb: activeAppToast ? 8 : 0 }}
      >
        <Alert onClose={() => setActiveLoginAlert(null)} severity="info" variant="filled" sx={{ width: "100%" }}>
          {activeLoginAlert
            ? `${activeLoginAlert.name || activeLoginAlert.email} iniciou sessão${activeLoginAlert.lastPath ? ` em ${activeLoginAlert.lastPath}` : ""}.`
            : ""}
        </Alert>
      </Snackbar>
    </Box>
  );
}
