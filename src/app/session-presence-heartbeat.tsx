"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL_MS = 60_000;

function sendPresence(payload: Record<string, unknown>, keepalive = false) {
  return fetch("/api/user/presence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive,
    cache: "no-store",
  }).catch(() => undefined);
}

export default function SessionPresenceHeartbeat() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.sessionId) return;

    void sendPresence({ pathname });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void sendPresence({ pathname });
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendPresence({ pathname });
      }
    };

    const handlePageHide = () => {
      if (!navigator.sendBeacon) {
        void sendPresence({ pathname, offline: true }, true);
        return;
      }

      const blob = new Blob([JSON.stringify({ pathname, offline: true })], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/user/presence", blob);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [pathname, session?.user?.sessionId, status]);

  return null;
}
