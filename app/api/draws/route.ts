import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Lists draws for display. RLS already restricts what a non-admin can read
 * (published only), so this route just passes the query through — it also
 * attaches the requesting user's own draw_entries row per draw, so the
 * dashboard's Participation card can show "you matched 3 numbers" inline
 * instead of a second round trip per draw.
 */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseServer();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("draws")
    .select("id, period, mode, status, total_pool_cents, winning_numbers, jackpot_rollover_cents, published_at")
    .order("period", { ascending: false });

  if (!isAdmin) {
    query = query.eq("status", "published");
  }

  const { data: draws, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const drawIds = (draws ?? []).map((d) => d.id);
  const { data: myEntries } = drawIds.length
    ? await supabase
        .from("draw_entries")
        .select("draw_id, numbers, matched_count, tier, prize_cents")
        .eq("user_id", user.id)
        .in("draw_id", drawIds)
    : { data: [] };

  const entriesByDraw = new Map((myEntries ?? []).map((e) => [e.draw_id, e]));
  const enriched = (draws ?? []).map((d) => ({ ...d, myEntry: entriesByDraw.get(d.id) ?? null }));

  return NextResponse.json({ draws: enriched });
}