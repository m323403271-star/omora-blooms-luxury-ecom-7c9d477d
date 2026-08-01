import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — OMORA BLOOMS" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const routeByRole = async (userId: string) => {
    try {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (roles?.some((r) => r.role === "admin")) return navigate({ to: "/admin/referrals" });
    } catch {
      /* fall through to partner dashboard */
    }
    navigate({ to: "/partner" });
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) void routeByRole(data.user.id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("Sign in failed. Please try again.");
        toast.success("Welcome back");
        await routeByRole(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          toast.success("Check your email to confirm your account");
          setMode("signin");
        } else {
          toast.success("Account created");
          await routeByRole(data.user!.id);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setNotice(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="container-luxe py-16 md:py-24 max-w-md">
      <p className="eyebrow mb-3">Partner Portal</p>
      <h1 className="font-serif text-4xl md:text-5xl mb-8">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={handleSubmit} className="space-y-5 glass-card rounded-2xl p-6">
        {notice && (
          <p className="text-xs text-[color:var(--gold)] border hairline rounded-xl px-4 py-3">{notice}</p>
        )}
        <div>
          <label className="text-xs eyebrow block mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs eyebrow block mb-2">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent hairline border rounded-full px-4 py-3 text-sm"
          />
        </div>
        <button disabled={loading} type="submit" className="btn-gold w-full py-3 rounded-full text-sm">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <p className="text-xs text-center text-[color:var(--muted-foreground)]">
          {mode === "signin" ? "Need an account?" : "Have an account?"}{" "}
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-[color:var(--gold)] underline underline-offset-2">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
        <p className="text-[11px] text-center text-[color:var(--muted-foreground)]">
          <Link to="/">Back to store</Link>
        </p>
      </form>
    </div>
  );
}
