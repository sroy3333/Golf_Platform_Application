import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { recordCharityContribution } from "@/lib/charityLogic";

const PLAN_PRICE_CENTS = { monthly: 1500, yearly: 15000 } as const; // yearly = ~2 months free

/**
 * MVP subscription handler. PRD §04 specifies "Stripe (or equivalent
 * PCI-compliant provider)" — Stripe requires an invite for India-based
 * accounts, so this build targets Razorpay instead. In production this
 * creates a Razorpay Order, the user pays via the Razorpay Checkout widget,
 * and activation happens in a `/api/razorpay/webhook` route listening for
 * `payment.captured` (one-off) or `subscription.charged` (recurring). That
 * webhook is intentionally out of scope for this sample build — see README
 * §"What's stubbed" — but the activation logic below (status + ledger
 * write) is the exact code the webhook would call.
 */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseServer();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ subscription });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, charityId, charityPct } = await req.json();
  if (!["monthly", "yearly"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!charityId) {
    return NextResponse.json({ error: "A charity selection is required." }, { status: 400 });
  }

  const amountCents = PLAN_PRICE_CENTS[plan as "monthly" | "yearly"];
  const supabase = supabaseServer();

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (plan === "yearly" ? 12 : 1));

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan,
      status: "active",
      amount_cents: amountCents,
      current_period_end: periodEnd.toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase
    .from("profiles")
    .update({ charity_id: charityId, charity_contribution_pct: charityPct ?? 10 })
    .eq("id", user.id);

  try {
    await recordCharityContribution({
      userId: user.id,
      charityId,
      subscriptionId: subscription.id,
      subscriptionAmountCents: amountCents,
      pct: charityPct ?? 10,
    });
  } catch (e) {
    return NextResponse.json({ error: `Subscription created but charity ledger failed: ${(e as Error).message}` }, { status: 500 });
  }

  return NextResponse.json({ subscription });
}