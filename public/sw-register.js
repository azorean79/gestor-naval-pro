if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (reg) => console.log("[SW] Registado:", reg.scope),
      (err) => console.warn("[SW] Falha ao registar:", err)
    );
  });
}
