import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — OMORA BLOOMS" },
      { name: "description", content: "Set a new password for your OMORA BLOOMS partner portal account." },
      { property: "og:title", content: "Reset password — OMORA BLOOMS" },
      { property: "og:description", content: "Set a new password for your OMORA BLOOMS partner portal account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (active && session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else setNotice("Open this page from the password reset link in your email.");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      setNotice("Passwords do not match.");
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/auth" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update password";
      setNotice(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-luxe py-16 md:py-24 max-w-md">
      <p className="eyebrow mb-3">Partner Portal</p>
      <h1 className="font-serif text-4xl md:text-5xl mb-8">Set a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-5 glass-card rounded-2xl p-6">
        {notice && <p className="text-xs text-[color:var(--gold)] border hairline rounded-xl px-4 py-3">{notice}</p>}
        <div>
          <label className="text-xs eyebrow block mb-2">New password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="text-xs eyebrow block mb-2">Confirm password</label>
          <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm" />
        </div>
        <button disabled={loading || !ready} type="submit" className="btn-gold w-full py-3 rounded-full text-sm">
          {loading ? "Please wait…" : "Update password"}
        </button>
        <p className="text-[11px] text-center text-[color:var(--muted-foreground)]">
          <Link to="/auth">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
