import { supabaseServer } from "./supabaseServer";

export interface ScoreEntry {
  id: string;
  score: number;
  played_on: string; // ISO date
}

const MIN_SCORE = 1;
const MAX_SCORE = 45; // Stableford points ceiling per PRD §05
const MAX_RETAINED = 5;

export class ScoreValidationError extends Error {}

/** Validates a raw score submission against PRD §05 rules. */
export function validateScoreInput(score: number, playedOn: string) {
  if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
    throw new ScoreValidationError(`Score must be an integer between ${MIN_SCORE} and ${MAX_SCORE}.`);
  }
  const date = new Date(playedOn);
  if (Number.isNaN(date.getTime())) {
    throw new ScoreValidationError("A valid date is required.");
  }
  if (date > new Date()) {
    throw new ScoreValidationError("Score date cannot be in the future.");
  }
}

/**
 * Adds a score for a user, enforcing:
 *  - one entry per date (duplicate date => reject, caller should call editScore instead)
 *  - only the latest 5 scores are ever retained (oldest is dropped automatically)
 * The DB trigger `trg_score_rolling_window` is the authoritative backstop;
 * this function mirrors the same rule at the application layer so the API
 * can return a clean, predictable response without a second round-trip.
 */
export async function addScore(userId: string, score: number, playedOn: string) {
  validateScoreInput(score, playedOn);
  const supabase = supabaseServer();

  const { data: existing } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", userId)
    .eq("played_on", playedOn)
    .maybeSingle();

  if (existing) {
    throw new ScoreValidationError(
      "A score already exists for this date. Edit or delete it instead of adding a new one."
    );
  }

  const { data: inserted, error } = await supabase
    .from("scores")
    .insert({ user_id: userId, score, played_on: playedOn })
    .select()
    .single();

  if (error) throw error;

  // Trigger has already trimmed to 5 rows server-side; fetch the fresh window.
  return getScoreHistory(userId);
}

export async function editScore(userId: string, scoreId: string, score: number, playedOn: string) {
  validateScoreInput(score, playedOn);
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("scores")
    .update({ score, played_on: playedOn })
    .eq("id", scoreId)
    .eq("user_id", userId);
  if (error) throw error;
  return getScoreHistory(userId);
}

export async function deleteScore(userId: string, scoreId: string) {
  const supabase = supabaseServer();
  const { error } = await supabase.from("scores").delete().eq("id", scoreId).eq("user_id", userId);
  if (error) throw error;
  return getScoreHistory(userId);
}

/** Returns the user's scores, most recent first, capped at 5 (§05 display rule). */
export async function getScoreHistory(userId: string): Promise<ScoreEntry[]> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("scores")
    .select("id, score, played_on")
    .eq("user_id", userId)
    .order("played_on", { ascending: false })
    .limit(MAX_RETAINED);
  if (error) throw error;
  return data ?? [];
}
