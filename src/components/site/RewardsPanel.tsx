import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { getRewardsOverview, redeemPoints } from "@/lib/rewards.functions";
import { REDEMPTION_TIERS, formatInr, nextTier } from "@/lib/loyalty";

/** Blooms Rewards — points balance, redemption tiers and issued codes. */
export function RewardsPanel() {
  const fetchRewards = useServerFn(getRewardsOverview);
  const redeem = useServerFn(redeemPoints);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-rewards"],
    queryFn: () => fetchRewards({}),
  });

  const mutation = useMutation({
    mutationFn: (points: number) => redeem({ data: { points } }),
    onSuccess: (res) => {
      toast.success(`Reward code ${res.code} unlocked — ${formatInr(res.discountInr)} off`);
      void qc.invalidateQueries({ queryKey: ["my-rewards"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not redeem points"),
  });

  const balance = data?.balance ?? 0;
  const upcoming = nextTier(balance);

  return (
    <section className="glass-card rounded-2xl p-6 md:p-8 mb-10 max-w-3xl">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[color:var(--gold)]" />
        <h2 className="font-serif text-2xl">Blooms Rewards</h2>
      </div>
      <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
        Earn 1 point for every ₹100 paid. Redeem points for a one-time discount code at checkout.
      </p>

      {isLoading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your points…
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="font-serif text-4xl text-[color:var(--gold)]">{balance}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
              points available · {data?.lifetimeEarned ?? 0} earned lifetime
            </p>
          </div>
          {upcoming ? (
            <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
              {upcoming.points - balance} more points to unlock {upcoming.label}.
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {REDEMPTION_TIERS.map((tier) => (
              <button
                key={tier.points}
                type="button"
                disabled={balance < tier.points || mutation.isPending}
                onClick={() => mutation.mutate(tier.points)}
                className="rounded-xl border hairline p-4 text-left transition disabled:opacity-40 hover:border-[color:var(--gold)]"
              >
                <p className="text-sm text-[color:var(--gold)]">{tier.label}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
                  {tier.points} points
                </p>
              </button>
            ))}
          </div>

          {data?.codes.length ? (
            <div className="mt-6 border-t hairline pt-4">
              <p className="eyebrow mb-3">Your reward codes</p>
              <ul className="space-y-2 text-sm">
                {data.codes.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3">
                    <Gift className="h-4 w-4 text-[color:var(--gold)]" />
                    <span className="font-mono">{c.code}</span>
                    <span className="text-[color:var(--muted-foreground)]">
                      {formatInr(c.discount_inr)} off · expires{" "}
                      {new Date(c.expires_at).toLocaleDateString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
