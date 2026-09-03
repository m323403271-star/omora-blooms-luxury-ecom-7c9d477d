import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarHeart, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  listOccasions,
  saveOccasion,
  deleteOccasion,
  getLoyaltyBalance,
  type OccasionInput,
  type UserOccasion,
} from "@/lib/occasions.functions";

const EMPTY: OccasionInput = { id: null, name: "", relationship: "", occasion_date: "", flower_preference: "" };
const FIELD =
  "w-full bg-[color:var(--noir)] hairline border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]";

/** Occasion reminders + loyalty balance for the signed-in shopper. */
export function OccasionsPanel() {
  const fetchOccasions = useServerFn(listOccasions);
  const fetchBalance = useServerFn(getLoyaltyBalance);
  const save = useServerFn(saveOccasion);
  const remove = useServerFn(deleteOccasion);
  const qc = useQueryClient();

  const [form, setForm] = useState<OccasionInput>(EMPTY);
  const [open, setOpen] = useState(false);

  const { data: occasions, isLoading } = useQuery({ queryKey: ["my-occasions"], queryFn: () => fetchOccasions({}) });
  const { data: points } = useQuery({ queryKey: ["my-points"], queryFn: () => fetchBalance({}) });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["my-occasions"] });

  const saveMutation = useMutation({
    mutationFn: (data: OccasionInput) => save({ data }),
    onSuccess: () => {
      toast.success("Occasion saved — we'll remind you 5 days before.");
      setForm(EMPTY);
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save this occasion"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Occasion removed"); invalidate(); },
    onError: () => toast.error("Could not remove this occasion"),
  });

  const edit = (o: UserOccasion) => {
    setForm({
      id: o.id,
      name: o.name,
      relationship: o.relationship,
      occasion_date: o.occasion_date,
      flower_preference: o.flower_preference ?? "",
    });
    setOpen(true);
  };

  return (
    <section className="glass-card rounded-2xl p-6 md:p-8 mb-10 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarHeart className="h-5 w-5 text-[color:var(--gold)]" />
          <h2 className="font-serif text-2xl">Occasion Reminders</h2>
        </div>
        <span className="rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--gold)]">
          {points?.balance ?? 0} loyalty points
        </span>
      </div>
      <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
        Save birthdays and anniversaries — we'll remind you 5 days before, with their favourite blooms in mind.
      </p>

      {isLoading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your occasions…
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {(occasions ?? []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl hairline border px-4 py-3">
              <div className="text-sm">
                <p className="font-medium">
                  {o.name}
                  {o.relationship ? <span className="text-[color:var(--muted-foreground)]"> · {o.relationship}</span> : null}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {new Date(`${o.occasion_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  {o.flower_preference ? ` · Prefers ${o.flower_preference}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => edit(o)} aria-label="Edit occasion" className="rounded-lg hairline border p-2 hover:border-[color:var(--gold)]/60">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => deleteMutation.mutate(o.id)} aria-label="Delete occasion" className="rounded-lg hairline border p-2 hover:border-red-500/60">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {occasions && occasions.length === 0 && !open ? (
            <p className="text-sm text-[color:var(--muted-foreground)]">No occasions saved yet.</p>
          ) : null}
        </div>
      )}

      {open ? (
        <form
          className="mt-5 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
        >
          <input className={FIELD} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={FIELD} placeholder="Relationship (Wife, Mother…)" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
          <input className={FIELD} type="date" value={form.occasion_date} onChange={(e) => setForm({ ...form, occasion_date: e.target.value })} />
          <input className={FIELD} placeholder="Flower preference" value={form.flower_preference ?? ""} onChange={(e) => setForm({ ...form, flower_preference: e.target.value })} />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saveMutation.isPending} className="btn-gold rounded-full px-6 py-2.5 text-xs disabled:opacity-50">
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save occasion"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setForm(EMPTY); }} className="btn-outline-gold rounded-full px-6 py-2.5 text-xs">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-outline-gold mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add occasion
        </button>
      )}
    </section>
  );
}
