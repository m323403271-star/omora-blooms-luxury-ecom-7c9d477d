import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface UserOccasion {
  id: string;
  name: string;
  relationship: string;
  occasion_date: string;
  flower_preference: string | null;
  created_at: string;
}

export interface OccasionInput {
  id?: string | null;
  name: string;
  relationship: string;
  occasion_date: string;
  flower_preference?: string | null;
}

function clean(input: OccasionInput): OccasionInput {
  const name = String(input.name ?? "").trim().slice(0, 80);
  const relationship = String(input.relationship ?? "").trim().slice(0, 40);
  const occasion_date = String(input.occasion_date ?? "").slice(0, 10);
  if (!name) throw new Error("Please add a name");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occasion_date)) throw new Error("Please pick a valid date");
  return {
    id: input.id ? String(input.id) : null,
    name,
    relationship,
    occasion_date,
    flower_preference: input.flower_preference ? String(input.flower_preference).trim().slice(0, 120) : null,
  };
}

/** Saved occasions for the signed-in shopper. */
export const listOccasions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserOccasion[]> => {
    const { data, error } = await context.supabase
      .from("user_occasions")
      .select("id, name, relationship, occasion_date, flower_preference, created_at")
      .order("occasion_date", { ascending: true });
    if (error) throw new Error("Could not load your occasions");
    return (data ?? []) as UserOccasion[];
  });

/** Creates or updates one occasion owned by the caller (RLS scopes both paths). */
export const saveOccasion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: OccasionInput) => clean(input))
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      name: data.name,
      relationship: data.relationship,
      occasion_date: data.occasion_date,
      flower_preference: data.flower_preference ?? null,
    };
    const query = data.id
      ? context.supabase.from("user_occasions").update(row).eq("id", data.id)
      : context.supabase.from("user_occasions").insert(row);
    const { error } = await query;
    if (error) throw new Error("Could not save this occasion");
    return { ok: true };
  });

/** Removes one of the caller's occasions. */
export const deleteOccasion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_occasions").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove this occasion");
    return { ok: true };
  });

/** Current loyalty points balance for the signed-in shopper. */
export const getLoyaltyBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ balance: number }> => {
    const { data } = await context.supabase
      .from("loyalty_points")
      .select("points_balance")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { balance: Number(data?.points_balance ?? 0) };
  });
