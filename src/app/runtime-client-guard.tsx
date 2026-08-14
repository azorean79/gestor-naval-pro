"use client";

import * as React from "react";

const RECOVERY_FLAG = "runtime-chunk-recovery";

function isChunkLoadRelatedError(reason: unknown) {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : typeof reason === "object" && reason !== null && "message" in reason
          ? String((reason as { message?: unknown }).message || "")
          : "";

  const normalized = message.toLowerCase();
  return (
    normalized.includes("chunkloaderror") ||
    normalized.includes("loading chunk") ||
    normalized.includes("failed to fetch dynamically imported module") ||
    (normalized.includes("_next/static/chunks") && normalized.includes("timeout"))
  );
}

async function clearDevelopmentRuntimeCaches() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch {
    // Best effort only; runtime guard should never break the app.
  }
}

export default function RuntimeClientGuard() {
  React.useEffect(() => {
    void clearDevelopmentRuntimeCaches();

    if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .catch((err) => console.warn("Service Worker registration failed:", err));
    }

    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.removeItem(RECOVERY_FLAG);
    } catch {
      // ignore storage failures
    }

    const tryRecover = () => {
      try {
        const alreadyRecovered = window.sessionStorage.getItem(RECOVERY_FLAG) === "1";
        if (alreadyRecovered) return;
        window.sessionStorage.setItem(RECOVERY_FLAG, "1");
      } catch {
        // ignore storage failures and still try reloading once
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("__chunk-reload", String(Date.now()));
      window.location.replace(nextUrl.toString());
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadRelatedError(event.error || event.message)) {
        tryRecover();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadRelatedError(event.reason)) {
        event.preventDefault();
        tryRecover();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}