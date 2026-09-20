import { supabaseServer } from "./supabaseServer";

export const MIN_CHARITY_PCT = 10;

export class CharityValidationError extends Error {}

export function validateContributionPct(pct: number) {
  if (pct < MIN_CHARITY_PCT || pct > 100) {
    throw new CharityValidationError(`Charity contribution must be between ${MIN_CHARITY_PCT}% and 100%.`);
  }
}

/** Computes the charity-bound amount for a subscription charge. */
export function computeCharityAmountCents(subscriptionAmountCents: number, pct: number): number {
  validateContributionPct(pct);
  return Math.round((subscriptionAmountCents * pct) / 100);
}

/**
 * Called from the subscription webhook/handler whenever a charge succeeds.
 * Writes a ledger row so admin "Reports & analytics" (§11) can total
 * charity contributions accurately without recomputing from subscriptions.
 */
export async function recordCharityContribution(params: {
  userId: string;
  charityId: string;
  subscriptionId?: string;
  subscriptionAmountCents: number;
  pct: number;
  source?: "subscription" | "voluntary";
}) {
  const amountCents = computeCharityAmountCents(params.subscriptionAmountCents, params.pct);
  const supabase = supabaseServer();
  const { error } = await supabase.from("charity_contributions").insert({
    user_id: params.userId,
    charity_id: params.charityId,
    subscription_id: params.subscriptionId,
    amount_cents: amountCents,
    source: params.source ?? "subscription",
  });
  if (error) throw error;
  return amountCents;
}

/** Independent voluntary donation, not tied to a subscription charge (§08.1). */
export async function recordVoluntaryDonation(userId: string, charityId: string, amountCents: number) {
  const supabase = supabaseServer();
  const { error } = await supabase.from("charity_contributions").insert({
    user_id: userId,
    charity_id: charityId,
    amount_cents: amountCents,
    source: "voluntary",
  });
  if (error) throw error;
}
