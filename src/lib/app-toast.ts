export const APP_TOAST_EVENT = "app:toast";

export type AppToastSeverity = "success" | "error" | "info" | "warning";

export type AppToastPayload = {
  message: string;
  severity?: AppToastSeverity;
  duration?: number;
};

function emitToast(payload: AppToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppToastPayload>(APP_TOAST_EVENT, { detail: payload }));
}

export const appToast = {
  show(payload: AppToastPayload) {
    emitToast(payload);
  },
  success(message: string, duration = 3200) {
    emitToast({ message, severity: "success", duration });
  },
  error(message: string, duration = 4200) {
    emitToast({ message, severity: "error", duration });
  },
  info(message: string, duration = 3200) {
    emitToast({ message, severity: "info", duration });
  },
  warning(message: string, duration = 3800) {
    emitToast({ message, severity: "warning", duration });
  },
};
