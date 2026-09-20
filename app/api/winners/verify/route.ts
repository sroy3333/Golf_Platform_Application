import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

/** Lists winners with enough context for the admin screen to render without a manual ID. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("winners")
    .select(
      "id, admin_decision, payout_status, created_at, profiles!winners_user_id_fkey(full_name), draw_entries(tier, prize_cents, draws(period))"
    )
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ winners: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { winnerId, decision } = await req.json(); // decision: 'approved' | 'rejected'
  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("winners")
    .update({
      admin_decision: decision,
      admin_reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", winnerId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ winner: data });
}

export async function PATCH(req: NextRequest) {
  // Mark payout as completed (Pending -> Paid)
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { winnerId } = await req.json();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("winners")
    .update({ payout_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", winnerId)
    .eq("admin_decision", "approved")
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ winner: data });
}
