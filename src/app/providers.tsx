"use client";
import * as React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { APP_THEME_OPTIONS, AppThemeName, createAppTheme, DEFAULT_APP_THEME } from "../theme";
import SessionPresenceHeartbeat from "./session-presence-heartbeat";
import OfflineSyncStatus from "@/components/OfflineSyncStatus";
import { flushOfflineSyncQueue, updateOfflineSyncConnectivity } from "@/lib/offline-sync/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const STORAGE_KEY = "app-theme-v2";

type ThemeControllerContextValue = {
  themeName: AppThemeName;
  setThemeName: (next: AppThemeName) => void;
  themeOptions: Array<{ value: AppThemeName; label: string }>;
};

const ThemeControllerContext = React.createContext<ThemeControllerContextValue | null>(null);

function isAppThemeName(value: unknown): value is AppThemeName {
  return typeof value === "string" && APP_THEME_OPTIONS.some((option) => option.value === value);
}

const themeChangeListeners = new Set<() => void>();

function readStoredTheme(): AppThemeName {
  if (typeof window === "undefined") return DEFAULT_APP_THEME;
  try {
    const persisted = window.localStorage.getItem(STORAGE_KEY);
    if (isAppThemeName(persisted)) return persisted;
  } catch {
    // no-op
  }
  return DEFAULT_APP_THEME;
}

function subscribeToThemeStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  themeChangeListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    themeChangeListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function setStoredThemeName(next: AppThemeName) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // no-op
  }
  themeChangeListeners.forEach((listener) => listener());
}

export function useAppThemeController() {
  const context = React.useContext(ThemeControllerContext);
  if (!context) {
    throw new Error("useAppThemeController must be used inside <Providers />.");
  }

  return context;
}

function OfflineSyncBootstrap() {
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker register fail:", err));
    }

    updateOfflineSyncConnectivity(navigator.onLine);

    const handleOnline = () => {
      updateOfflineSyncConnectivity(true);
      void flushOfflineSyncQueue().catch(() => {
        // error state is handled in the sync store/UI
      });
    };
    const handleOffline = () => {
      updateOfflineSyncConnectivity(false);
    };
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        void flushOfflineSyncQueue().catch(() => {
          // error state is handled in the sync store/UI
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (navigator.onLine) {
      void flushOfflineSyncQueue().catch(() => {
        // error state is handled in the sync store/UI
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <OfflineSyncStatus />;
}

export default function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  const [queryClient] = React.useState(() => new QueryClient());
  const themeName = React.useSyncExternalStore(
    subscribeToThemeStore,
    readStoredTheme,
    () => DEFAULT_APP_THEME,
  );

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeName);
  }, [themeName]);

  const muiTheme = React.useMemo(() => createAppTheme(themeName), [themeName]);
  const controller = React.useMemo<ThemeControllerContextValue>(() => ({
    themeName,
    setThemeName: setStoredThemeName,
    themeOptions: APP_THEME_OPTIONS,
  }), [themeName]);

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <SessionPresenceHeartbeat />
      <OfflineSyncBootstrap />
      <ThemeControllerContext.Provider value={controller}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </ThemeControllerContext.Provider>
    </SessionProvider>
  );
}
