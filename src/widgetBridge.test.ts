import { describe, expect, it, vi } from "vitest";
import { createWidgetBridgeMessage, installWidgetBridge, WIDGET_BRIDGE_MESSAGE_TYPE, WIDGET_BRIDGE_READY } from "./widgetBridge";
import { createWidgetSnapshot } from "./widgetSnapshot";

const snapshot = createWidgetSnapshot({
  group: {
    id: "friends",
    name: "Friends",
    people: [],
    planner: { date: "2026-08-18", hour: 12, title: "", durationMinutes: 60, eventMode: "timed", location: "", notes: "" },
    updatedAt: "2026-08-18T00:00:00.000Z",
  },
  deviceTimeZone: "America/Sao_Paulo",
  selectedAt: new Date("2026-08-18T12:00:00.000Z"),
  now: new Date("2026-08-18T10:00:00.000Z"),
});

describe("Android widget bridge", () => {
  it("wraps only the reviewed widget snapshot", () => {
    expect(JSON.parse(createWidgetBridgeMessage(snapshot))).toEqual({
      type: WIDGET_BRIDGE_MESSAGE_TYPE,
      payload: snapshot,
    });
  });

  it("rejects untrusted origins and publishes after the native handshake", () => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const target = {
      addEventListener: (_: string, listener: EventListenerOrEventListenerObject) => listeners.add(listener),
      removeEventListener: (_: string, listener: EventListenerOrEventListenerObject) => listeners.delete(listener),
    };
    const port = { postMessage: vi.fn(), start: vi.fn() };
    const bridge = installWidgetBridge({ origin: "https://kikroo.example", getSnapshot: () => snapshot, target });
    const dispatch = (event: MessageEvent) => listeners.forEach((listener) => {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    });

    dispatch({ origin: "https://attacker.example", data: WIDGET_BRIDGE_READY, ports: [port] } as unknown as MessageEvent);
    expect(port.postMessage).not.toHaveBeenCalled();

    dispatch({ origin: "https://kikroo.example", data: WIDGET_BRIDGE_READY, ports: [port] } as unknown as MessageEvent);
    expect(port.start).toHaveBeenCalledOnce();
    expect(JSON.parse(port.postMessage.mock.calls[0][0])).toEqual({ type: WIDGET_BRIDGE_MESSAGE_TYPE, payload: snapshot });

    bridge.dispose();
    expect(listeners.size).toBe(0);
  });
});
