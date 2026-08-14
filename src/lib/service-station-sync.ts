const CHANNEL_NAME = "orey-service-station-sync";
const EVENT_NAME = "orey:service-station-sync";

type SyncPayload = {
  reason?: string;
  at: string;
};

function buildPayload(reason?: string): SyncPayload {
  return {
    reason: reason || "update",
    at: new Date().toISOString(),
  };
}

export function broadcastServiceStationSync(reason?: string) {
  if (typeof window === "undefined") return;

  const payload = buildPayload(reason);

  window.dispatchEvent(new CustomEvent<SyncPayload>(EVENT_NAME, { detail: payload }));

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(payload);
    channel.close();
  }
}

export function subscribeServiceStationSync(callback: (payload: SyncPayload) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleWindowEvent = (event: Event) => {
    const customEvent = event as CustomEvent<SyncPayload>;
    callback(customEvent.detail || buildPayload("window-event"));
  };

  window.addEventListener(EVENT_NAME, handleWindowEvent);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<SyncPayload>) => {
      callback(event.data || buildPayload("broadcast-channel"));
    };
  }

  return () => {
    window.removeEventListener(EVENT_NAME, handleWindowEvent);
    channel?.close();
  };
}
