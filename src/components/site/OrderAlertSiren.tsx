import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, BellOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  acknowledgeOrderAlert,
  getPushPublicKey,
  saveNativePushDevice,
  savePushSubscription,
  sendTestOrderAlert,
} from "@/lib/alerts.functions";
import {
  enableNativeOrderAlerts,
  isNativeAndroid,
  stopNativeOrderAlarm,
} from "@/lib/native-order-alarm";

type Alert = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  pincode: string | null;
  amount: number | null;
  priority: string | null;
  items_summary: string | null;
  created_at: string;
};

/** Loud, looping two-tone siren built with Web Audio — no asset needed. */
function useSiren() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  const unlock = useCallback(async () => {
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
  }, []);

  const start = useCallback(async () => {
    await unlock();
    const ctx = ctxRef.current;
    if (!ctx || nodesRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    const now = ctx.currentTime;
    // Rising/falling wail, repeated for a long time (restarted while unacknowledged).
    for (let i = 0; i < 600; i++) {
      const t = now + i * 1.2;
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(1100, t + 0.6);
      osc.frequency.linearRampToValueAtTime(600, t + 1.2);
    }
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    nodesRef.current = { osc, gain };
  }, [unlock]);

  const stop = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    try {
      nodes.gain.gain.value = 0;
      nodes.osc.stop();
      nodes.osc.disconnect();
    } catch {
      /* already stopped */
    }
    nodesRef.current = null;
  }, []);

  return { start, stop, unlock };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Persistent new-order alarm for staff screens.
 * Rings until an order is accepted, and registers this device for phone
 * push alerts that fire even when the dashboard is closed.
 */
export default function OrderAlertSiren() {
  const ackAlert = useServerFn(acknowledgeOrderAlert);
  const loadKey = useServerFn(getPushPublicKey);
  const saveSub = useServerFn(savePushSubscription);
  const saveNativeDevice = useServerFn(saveNativePushDevice);
  const testAlert = useServerFn(sendTestOrderAlert);

  const [pending, setPending] = useState<Alert[]>([]);
  const [busy, setBusy] = useState(false);
  const [pushState, setPushState] = useState<"unknown" | "on" | "off" | "unsupported">("unknown");
  const { start, stop, unlock } = useSiren();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("order_alerts")
      .select("id, customer_name, customer_phone, pincode, amount, priority, items_summary, created_at")
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    setPending((data ?? []) as Alert[]);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("order-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_alerts" }, () => {
        void load();
      })
      .subscribe();
    const poll = window.setInterval(() => void load(), 20000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  // Ring while anything is unacknowledged; restart the wail periodically.
  useEffect(() => {
    if (pending.length === 0) {
      stop();
      return;
    }
    void start();
    const restart = window.setInterval(() => {
      stop();
      void start();
    }, 60000);
    return () => window.clearInterval(restart);
  }, [pending.length, start, stop]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativeAndroid()) {
      setPushState("off");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushState("unsupported");
      return;
    }
    void navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setPushState(sub ? "on" : "off");
    });
    const onMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "OMORA_ORDER_ALERT") void load();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [load]);

  async function enablePush() {
    setBusy(true);
    try {
      await unlock();
      if (isNativeAndroid()) {
        const registration = await enableNativeOrderAlerts();
        const result = await saveNativeDevice({ data: registration });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setPushState("on");
        toast.success("Native order alarm enabled on this Android device.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Allow notifications so alerts reach this phone.");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const { publicKey } = await loadKey();
      if (!publicKey) {
        toast.error("Push alerts are not configured yet.");
        return;
      }
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        }));
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const res = await saveSub({
        data: {
          endpoint: json.endpoint ?? "",
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          userAgent: navigator.userAgent.slice(0, 300),
        },
      });
      if (res.ok) {
        setPushState("on");
        toast.success("This device will now siren for every new order.");
      } else toast.error(res.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not turn on alerts.");
    } finally {
      setBusy(false);
    }
  }

  async function accept(id: string) {
    setBusy(true);
    stop();
    try {
      const res = await ackAlert({ data: { alertId: id } });
      if (!res.ok) toast.error("Could not accept. Try again.");
      else await stopNativeOrderAlarm(id);
      setPending((p) => p.filter((a) => a.id !== id));
      await load();
    } finally {
      setBusy(false);
    }
  }

  const top = pending[0];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-2">
        <button
          type="button"
          onClick={() => void enablePush()}
          disabled={busy || pushState === "unsupported"}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/40 px-3 py-1.5 text-xs"
        >
          {pushState === "on" ? <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--gold)]" /> : <BellRing className="h-3.5 w-3.5" />}
          {pushState === "on"
            ? "Phone alerts ON"
            : pushState === "unsupported"
              ? "Alerts unsupported on this browser"
              : "Turn ON phone siren alerts"}
        </button>
        <button
          type="button"
          onClick={async () => {
            const r = await testAlert();
            toast.success(`Test alert sent to ${r.sent} device(s).`);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs"
        >
          Send test alert
        </button>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs"
          >
            <BellOff className="h-3.5 w-3.5" /> Mute siren
          </button>
        )}
      </div>

      {top && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 md:p-4">
          <div className="mx-auto max-w-xl rounded-2xl border border-[color:var(--gold)] bg-[#140404] p-4 shadow-2xl animate-pulse">
            <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">
              New order · {pending.length} waiting
            </p>
            <p className="mt-1 font-serif text-xl">{top.customer_name ?? "New customer"}</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{top.items_summary}</p>
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              {top.customer_phone ?? "—"} · {top.pincode ?? "—"}
              {top.amount != null ? ` · ₹${top.amount}` : ""}
              {top.priority ? ` · ${top.priority.toUpperCase()}` : ""}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void accept(top.id)}
              className="mt-3 w-full rounded-full bg-[color:var(--gold)] py-2.5 text-sm font-medium text-black disabled:opacity-60"
            >
              {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Accept order & stop siren"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
