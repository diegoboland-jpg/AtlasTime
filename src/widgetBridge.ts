import type { WidgetSnapshot } from "./widgetSnapshot";

export const WIDGET_BRIDGE_READY = "kikroo-widget-ready:v1";
export const WIDGET_BRIDGE_MESSAGE_TYPE = "kikroo.widget.snapshot";

type WidgetMessagePort = Pick<MessagePort, "postMessage" | "start">;

export function createWidgetBridgeMessage(snapshot: WidgetSnapshot) {
  return JSON.stringify({ type: WIDGET_BRIDGE_MESSAGE_TYPE, payload: snapshot });
}

export function installWidgetBridge({
  origin,
  getSnapshot,
  target = window,
}: {
  origin: string;
  getSnapshot: () => WidgetSnapshot;
  target?: Pick<Window, "addEventListener" | "removeEventListener">;
}) {
  let port: WidgetMessagePort | null = null;

  const publish = () => {
    if (!port) return false;
    port.postMessage(createWidgetBridgeMessage(getSnapshot()));
    return true;
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== origin || event.data !== WIDGET_BRIDGE_READY || !event.ports[0]) return;
    port = event.ports[0];
    port.start();
    publish();
  };

  target.addEventListener("message", onMessage as EventListener);
  return {
    publish,
    dispose() {
      target.removeEventListener("message", onMessage as EventListener);
      port = null;
    },
  };
}
