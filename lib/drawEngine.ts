import { supabaseServer } from "./supabaseServer";

// ---------- Prize pool shares, fixed by PRD §07 ----------
export const POOL_SHARE = {
  "5_number": 0.4,
  "4_number": 0.35,
  "3_number": 0.25,
} as const;

const NUMBER_POOL_SIZE = 49; // numbers 1–49, 5 drawn per period
const NUMBERS_PER_TICKET = 5;

export type DrawMode = "random" | "algorithmic";

interface SubscriberForDraw {
  user_id: string;
  amount_cents: number;
  recentScores: number[]; // last 5 Stableford scores, for algorithmic weighting
}

/** Draws 5 unique numbers 1–49. */
function drawRandomNumbers(): number[] {
  const pool = Array.from({ length: NUMBER_POOL_SIZE }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < NUMBERS_PER_TICKET; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

/**
 * Generates a subscriber's ticket numbers.
 * - random mode: uniformly random, independent of performance
 * - algorithmic mode: weighted by the subscriber's average recent Stableford
 *   score, so stronger recent form nudges (not guarantees) number selection —
 *   deterministic per user+period so it's auditable and reproducible.
 */
export function generateTicketNumbers(mode: DrawMode, sub: SubscriberForDraw, seed: string): number[] {
  if (mode === "random") return drawRandomNumbers();

  const avg = sub.recentScores.length
    ? sub.recentScores.reduce((a, b) => a + b, 0) / sub.recentScores.length
    : 18; // neutral default (par-ish Stableford average)

  // Seeded PRNG so the same subscriber+period always reproduces the same ticket
  const rand = seededRandom(`${seed}:${sub.user_id}`);
  const weightBoost = Math.min(avg / 36, 1); // 0..1, higher score = slightly denser sampling
  const pool = Array.from({ length: NUMBER_POOL_SIZE }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < NUMBERS_PER_TICKET; i++) {
    const skew = Math.floor(rand() * pool.length * (1 - weightBoost * 0.3));
    const idx = Math.min(skew, pool.length - 1);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function countMatches(ticket: number[], winning: number[]): number {
  const winSet = new Set(winning);
  return ticket.filter((n) => winSet.has(n)).length;
}

function tierForMatches(matches: number): keyof typeof POOL_SHARE | null {
  if (matches >= 5) return "5_number";
  if (matches === 4) return "4_number";
  if (matches === 3) return "3_number";
  return null;
}

/**
 * Runs a full draw simulation (or live run) for a period:
 *  1. Pulls active subscribers + their last 5 scores
 *  2. Computes total pool = sum(active subscription fees) - charity portion, split 40/35/25
 *  3. Generates ticket numbers per subscriber, draws winning numbers
 *  4. Matches tickets, splits each tier's pool equally among winners in that tier
 *  5. Rolls the 5-number jackpot forward if nobody hits it
 *
 * `persist=false` => simulate only (admin preview before publish, §06 "simulation before publish").
 */
export async function runDraw(period: string, mode: DrawMode, persist: boolean, adminId?: string) {
  const supabase = supabaseServer();

  const { data: subs, error: subErr } = await supabase
    .from("subscriptions")
    .select("user_id, amount_cents")
    .eq("status", "active");
  if (subErr) throw subErr;
  if (!subs || subs.length === 0) throw new Error("No active subscribers to draw from.");

  const userIds = subs.map((s) => s.user_id);
  const { data: scoreRows } = await supabase
    .from("scores")
    .select("user_id, score")
    .in("user_id", userIds);

  const scoresByUser = new Map<string, number[]>();
  (scoreRows ?? []).forEach((r) => {
    const list = scoresByUser.get(r.user_id) ?? [];
    list.push(r.score);
    scoresByUser.set(r.user_id, list);
  });

  const { data: existingDraw } = await supabase
    .from("draws")
    .select("*")
    .eq("period", period)
    .maybeSingle();
  const previousRollover = existingDraw?.jackpot_rollover_cents ?? 0;

  const totalPoolCents = subs.reduce((sum, s) => sum + s.amount_cents, 0);
  const winningNumbers = drawRandomNumbers();

  const entries = subs.map((s) => {
    const numbers = generateTicketNumbers(mode, { user_id: s.user_id, amount_cents: s.amount_cents, recentScores: scoresByUser.get(s.user_id) ?? [] }, period);
    const matched = countMatches(numbers, winningNumbers);
    const tier = tierForMatches(matched);
    return { user_id: s.user_id, numbers, matched_count: matched, tier };
  });

  // Pool math per tier, split equally among winners, jackpot rolls if empty
  const results: Record<string, { poolCents: number; winners: string[]; prizeEachCents: number }> = {};
  (Object.keys(POOL_SHARE) as (keyof typeof POOL_SHARE)[]).forEach((tier) => {
    const tierPool = Math.round(totalPoolCents * POOL_SHARE[tier]) + (tier === "5_number" ? previousRollover : 0);
    const winners = entries.filter((e) => e.tier === tier).map((e) => e.user_id);
    const prizeEach = winners.length > 0 ? Math.floor(tierPool / winners.length) : 0;
    results[tier] = { poolCents: tierPool, winners, prizeEachCents: prizeEach };
  });

  const jackpotRollover = results["5_number"].winners.length === 0 ? results["5_number"].poolCents : 0;

  entries.forEach((e) => {
    if (e.tier) {
      // @ts-ignore
      e["prize_cents"] = results[e.tier].prizeEachCents;
    } else {
      // @ts-ignore
      e["prize_cents"] = 0;
    }
  });

  const summary = {
    period,
    mode,
    totalPoolCents,
    winningNumbers,
    tiers: results,
    jackpotRollover,
    entryCount: entries.length,
  };

  if (!persist) return { ...summary, entries, persisted: false };

  const { data: draw, error: drawErr } = await supabase
    .from("draws")
    .upsert(
      {
        period,
        mode,
        status: "published",
        total_pool_cents: totalPoolCents,
        winning_numbers: winningNumbers,
        jackpot_rollover_cents: jackpotRollover,
        simulated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        created_by: adminId,
      },
      { onConflict: "period" }
    )
    .select()
    .single();
  if (drawErr) throw drawErr;

  const entryRows = entries.map((e) => ({
    draw_id: draw.id,
    user_id: e.user_id,
    numbers: e.numbers,
    matched_count: e.matched_count,
    tier: e.tier,
    // @ts-ignore
    prize_cents: e["prize_cents"] ?? 0,
  }));
  const { data: insertedEntries, error: entriesErr } = await supabase
    .from("draw_entries")
    .upsert(entryRows, { onConflict: "draw_id,user_id" })
    .select();
  if (entriesErr) throw entriesErr;

  // Any entry that matched a tier becomes a pending winner (§09). Guarded
  // against duplicates so re-publishing the same period doesn't create a
  // second winner row for someone who already has one.
  const matchedEntries = (insertedEntries ?? []).filter((e: any) => e.tier);
  if (matchedEntries.length > 0) {
    const entryIds = matchedEntries.map((e: any) => e.id);
    const { data: existingWinners } = await supabase
      .from("winners")
      .select("draw_entry_id")
      .in("draw_entry_id", entryIds);
    const alreadyWinner = new Set((existingWinners ?? []).map((w: any) => w.draw_entry_id));
    const newWinnerRows = matchedEntries
      .filter((e: any) => !alreadyWinner.has(e.id))
      .map((e: any) => ({ draw_entry_id: e.id, user_id: e.user_id }));
    if (newWinnerRows.length > 0) {
      const { error: winnersErr } = await supabase.from("winners").insert(newWinnerRows);
      if (winnersErr) throw winnersErr;
    }
  }

  return { ...summary, entries, persisted: true, drawId: draw.id };
}
