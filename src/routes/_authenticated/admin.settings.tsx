import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { getFalApiKeyStatus, saveFalApiKey } from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Try-On API Settings — OMORA BLOOMS Admin" },
      {
        name: "description",
        content: "Save the fal.ai API key used for OMORA BLOOMS Virtual Try-On generations beyond the free trials.",
      },
      { property: "og:title", content: "Try-On API Settings — OMORA BLOOMS Admin" },
      {
        property: "og:description",
        content: "Save the fal.ai API key used for OMORA BLOOMS Virtual Try-On generations beyond the free trials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

type Status = {
  savedInDashboard: boolean;
  updatedAt: string | null;
  envConfigured: boolean;
};

function AdminSettings() {
  const loadStatus = useServerFn(getFalApiKeyStatus);
  const saveKey = useServerFn(saveFalApiKey);

  const [status, setStatus] = useState<Status | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [denied, setDenied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await loadStatus());
    } catch {
      setDenied(true);
    }
  }, [loadStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSave() {
    const value = apiKey.trim();
    if (value.length < 20) {
      toast.error("Please paste the full fal.ai API key.");
      return;
    }
    setSaving(true);
    try {
      const res = await saveKey({ data: { apiKey: value } });
      if (res.ok) {
        toast.success("API key saved securely");
        setApiKey("");
        await refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Could not save the key. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (denied) {
    return (
      <div className="container-luxe py-16 max-w-2xl">
        <h1 className="font-serif text-3xl md:text-4xl">Admins only</h1>
        <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
          This page is restricted to store administrators.
        </p>
      </div>
    );
  }

  const configured = Boolean(status && (status.savedInDashboard || status.envConfigured));

  return (
    <div className="container-luxe py-10 md:py-16 max-w-2xl">
      <p className="eyebrow mb-2">Admin</p>
      <h1 className="font-serif text-3xl md:text-5xl">Virtual Try-On API Key</h1>
      <p className="mt-3 text-sm text-[color:var(--muted-foreground)] leading-relaxed">
        Every customer gets 4 free try-ons. Generations beyond that use your fal.ai account, billed
        to this key.
      </p>

      <div className="mt-6 glass-card rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex items-start gap-3 text-sm">
          {status === null ? (
            <>
              <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-[color:var(--gold)]" />
              <span className="text-[color:var(--muted-foreground)]">Checking current status…</span>
            </>
          ) : configured ? (
            <>
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-[color:var(--gold)] shrink-0" />
              <div>
                <p className="font-medium">A fal.ai key is configured</p>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                  {status.savedInDashboard
                    ? `Saved from this dashboard${
                        status.updatedAt
                          ? ` on ${new Date(status.updatedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : ""
                      }. Paste a new key below to replace it.`
                    : "Currently using the stored environment key. Saving a key below will take priority."}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 mt-0.5 text-[color:var(--gold)] shrink-0" />
              <div>
                <p className="font-medium">No key configured yet</p>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                  Try-ons past the 4 free trials will be unavailable until a key is saved.
                </p>
              </div>
            </>
          )}
        </div>

        <div>
          <label htmlFor="fal-key" className="text-xs eyebrow block mb-2">
            fal.ai API Key
          </label>
          <div className="relative">
            <KeyRound className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <input
              id="fal-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your fal.ai key"
              className="w-full bg-transparent hairline border rounded-full pl-11 pr-4 py-3 text-sm"
            />
          </div>
          <p className="mt-2 text-[11px] text-[color:var(--muted-foreground)]">
            Find it in your fal.ai dashboard under API Keys.
          </p>
        </div>

        <button
          onClick={onSave}
          disabled={saving || apiKey.trim().length === 0}
          className="btn-gold w-full py-3 rounded-full text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? "Saving…" : "Save key securely"}
        </button>

        <p className="text-[11px] text-[color:var(--muted-foreground)] leading-relaxed border-t hairline pt-4">
          The key is stored on the server only and is never sent back to any browser — not even to
          this page. It cannot be read by customers, other staff, or anyone inspecting the site.
        </p>
      </div>
    </div>
  );
}
