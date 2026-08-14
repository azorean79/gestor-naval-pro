"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { RefreshCw } from "lucide-react";

export default function OfflineSyncButton() {
  const [offlineCount, setOfflineCount] = React.useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const items = JSON.parse(localStorage.getItem("offline_inspections") || "[]");
      return Array.isArray(items) ? items.length : 0;
    } catch {
      return 0;
    }
  });
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const checkOffline = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const items = JSON.parse(localStorage.getItem("offline_inspections") || "[]");
      setOfflineCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setOfflineCount(0);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("online", checkOffline);
      window.addEventListener("focus", checkOffline);
      // Custom event to refresh when someone saves offline
      window.addEventListener("offline-inspection-saved", checkOffline);
      return () => {
        window.removeEventListener("online", checkOffline);
        window.removeEventListener("focus", checkOffline);
        window.removeEventListener("offline-inspection-saved", checkOffline);
      };
    }
  }, [checkOffline]);

  const handleSync = async () => {
    if (offlineCount === 0 || isSyncing) return;
    setIsSyncing(true);
    setToast({ message: "A iniciar sincronização de dados offline...", severity: "info" });

    try {
      const items = JSON.parse(localStorage.getItem("offline_inspections") || "[]");
      if (!Array.isArray(items) || items.length === 0) {
        setIsSyncing(false);
        checkOffline();
        return;
      }

      const remainingItems = [...items];
      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        try {
          const { jangadaId, shipId, id, payload } = item;

          // 1. Atualizar Jangada
          if (jangadaId) {
            const jangadaRes = await fetch(`/api/jangadas/${jangadaId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!jangadaRes.ok) {
              const errData = await jangadaRes.json().catch(() => ({}));
              throw new Error(errData.error || `Erro ao atualizar jangada ${jangadaId}`);
            }
          }

          // 2. Atualizar Navio se necessário
          if (shipId && payload.shipName) {
            await fetch(`/api/navios/${shipId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                proprietario: payload.owner,
                bandeira: payload.shipFlag,
                imo: payload.shipImo,
                callSignal: payload.shipCallSign,
              }),
            }).catch((err) => console.warn("Erro ao atualizar navio associado:", err));
          }

          // 3. Gravar Inspeção
          const isNew = String(id).startsWith("offline_");
          const method = isNew ? "POST" : "PUT";
          const url = isNew ? "/api/inspecoes" : `/api/inspecoes?id=${id}`;

          const inspRes = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!inspRes.ok) {
            const errData = await inspRes.json().catch(() => ({}));
            throw new Error(errData.error || `Erro ao gravar inspeção`);
          }

          // Remover item com sucesso
          const idx = remainingItems.findIndex((x) => x.id === id);
          if (idx !== -1) {
            remainingItems.splice(idx, 1);
          }
          successCount++;
        } catch (err) {
          console.error("Erro na sincronização de item offline:", err);
          failCount++;
        }
      }

      localStorage.setItem("offline_inspections", JSON.stringify(remainingItems));
      checkOffline();

      if (failCount === 0) {
        setToast({ message: `Sincronização concluída com sucesso! (${successCount} inspeção/inspeções)`, severity: "success" });
      } else {
        setToast({ message: `Sincronizados: ${successCount} com sucesso, ${failCount} falharam.`, severity: "error" });
      }
    } catch (error) {
      console.error("Erro geral na sincronização:", error);
      setToast({ message: "Ocorreu um erro ao sincronizar os dados offline.", severity: "error" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (offlineCount === 0) return null;

  return (
    <>
      <Button
        variant="contained"
        color="warning"
        size="small"
        onClick={handleSync}
        disabled={isSyncing}
        startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} className="animate-spin-slow" />}
        sx={{
          borderRadius: 999,
          fontWeight: 700,
          textTransform: "none",
          fontSize: "12px",
          px: 2,
          py: 0.5,
          color: "white",
          boxShadow: "0 2px 8px rgba(237, 108, 2, 0.3)",
          mr: 1.5,
          "&.Mui-disabled": {
            bgcolor: "warning.main",
            color: "white",
            opacity: 0.8,
          }
        }}
      >
        {isSyncing ? "A Sincronizar..." : `Enviar Offline (${offlineCount})`}
      </Button>

      <Snackbar
        open={toast !== null}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setToast(null)} severity={toast?.severity || "info"} sx={{ width: "100%" }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
