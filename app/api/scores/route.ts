import { NextRequest, NextResponse } from "next/server";
import { addScore, getScoreHistory, ScoreValidationError } from "@/lib/scoreLogic";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scores = await getScoreHistory(user.id);
  return NextResponse.json({ scores });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // §04: "Non-subscribers receive restricted access to platform features."
  // Score entry is gated on having an active subscription — not on role.
  // This also naturally covers admin accounts: an admin with no active
  // subscription is blocked here just like any other non-subscriber, while
  // an admin who also happens to hold a subscription is treated the same
  // as any other subscriber. Role and subscription status are separate
  // concerns and shouldn't be conflated.
  const admin = supabaseServer();
  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!activeSub) {
    return NextResponse.json({ error: "An active subscription is required to enter scores." }, { status: 403 });
  }

  const { score, playedOn } = await req.json();
  try {
    const scores = await addScore(user.id, Number(score), playedOn);
    return NextResponse.json({ scores });
  } catch (e) {
    const status = e instanceof ScoreValidationError ? 400 : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}