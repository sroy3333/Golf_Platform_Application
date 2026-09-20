"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import ScoreForm from "@/components/ScoreForm";
import ScoreList from "@/components/ScoreList";
import SubscribeForm from "@/components/SubscribeForm";
import type { ScoreEntry } from "@/lib/scoreLogic";

interface Profile {
  full_name: string;
  role: string;
  charity_contribution_pct: number;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
}

interface DrawEntry {
  id: string;
  period: string;
  status: string;
  winning_numbers: number[];
  myEntry: { numbers: number[]; matched_count: number; tier: string | null; prize_cents: number } | null;
}

interface WinningRow {
  id: string;
  admin_decision: string | null;
  payout_status: string;
  draw_entries: { tier: string; prize_cents: number; draws: { period: string } } | null;
}

export default function Dashboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [draws, setDraws] = useState<DrawEntry[]>([]);
  const [winnings, setWinnings] = useState<WinningRow[]>([]);
  const router = useRouter();

  async function loadScores() {
    const res = await fetch("/api/scores");
    if (res.ok) {
      const body = await res.json();
      setScores(body.scores);
    }
  }

  async function loadSubscription() {
    setSubLoading(true);
    const res = await fetch("/api/subscribe");
    if (res.ok) {
      const body = await res.json();
      setSubscription(body.subscription);
    }
    setSubLoading(false);
  }

  async function loadDraws() {
    const res = await fetch("/api/draws");
    if (res.ok) {
      const body = await res.json();
      setDraws(body.draws ?? []);
    }
  }

  async function loadWinnings(userId: string) {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from("winners")
      .select("id, admin_decision, payout_status, draw_entries(tier, prize_cents, draws(period))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setWinnings((data as any) ?? []);
  }

  async function loadProfile() {
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setEmail(user.email ?? null);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, charity_contribution_pct")
      .eq("id", user.id)
      .single();
    setProfile(data);
    loadWinnings(user.id);
  }

  useEffect(() => {
    loadScores();
    loadProfile();
    loadSubscription();
    loadDraws();
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{profile ? `Welcome back, ${profile.full_name}` : "Welcome back"}</h1>
        {email && <p className="text-sm text-slate-400">{email}</p>}
      </div>

      {isAdmin ? (
        <div className="card">
          <h2 className="font-semibold mb-2">You're signed in as an administrator</h2>
          <p className="text-sm text-slate-400 mb-4">
            Score entry, subscriptions, and charity selection are subscriber features (PRD §03) — administrator
            capabilities live in the admin control center instead.
          </p>
          <a href="/admin" className="btn-primary inline-block">Go to Admin control center</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card md:col-span-2">
            <h2 className="font-semibold mb-1">Subscription</h2>
            {subLoading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : subscription ? (
              <div className="text-sm text-slate-300">
                <p className="mb-1"><span className="text-emerald-400 font-semibold">Active</span> — {subscription.plan} plan</p>
                <p className="text-slate-400">Renews {new Date(subscription.current_period_end).toLocaleDateString()}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-4">You don't have an active subscription yet. Pick a plan and charity to get started.</p>
                <SubscribeForm onSubscribed={() => { loadSubscription(); loadProfile(); }} />
              </>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-1">Charity</h2>
            <p className="text-sm text-slate-400 mb-4">Your selected charity and contribution percentage.</p>
            <div className="text-sm text-slate-300">
              {profile?.charity_contribution_pct ? `Contributing ${profile.charity_contribution_pct}% per subscription.` : "Set when you subscribe — editable anytime in Settings."}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-1">Participation</h2>
            {draws.length === 0 ? (
              <p className="text-sm text-slate-400">No draws published yet.</p>
            ) : (
              <ul className="text-sm text-slate-300 space-y-2 mt-2">
                {draws.map((d) => (
                  <li key={d.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
                    <p className="font-medium">{d.period}</p>
                    {d.myEntry ? (
                      <p className="text-slate-400">
                        Matched {d.myEntry.matched_count} · {d.myEntry.tier ? d.myEntry.tier.replace("_", "-") : "no tier"}
                        {d.myEntry.prize_cents > 0 && ` · $${(d.myEntry.prize_cents / 100).toFixed(2)}`}
                      </p>
                    ) : (
                      <p className="text-slate-500">Not entered</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card md:col-span-2">
            <h2 className="font-semibold mb-4">Your scores</h2>
            {subscription ? (
              <>
                <ScoreForm onAdded={loadScores} />
                <div className="mt-6">
                  <ScoreList scores={scores} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                Score entry unlocks once you have an active subscription — pick a plan above to get started.
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-1">Winnings</h2>
            {winnings.length === 0 ? (
              <p className="text-sm text-slate-400">No wins yet.</p>
            ) : (
              <ul className="text-sm text-slate-300 space-y-2 mt-2">
                {winnings.map((w) => (
                  <li key={w.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
                    <p className="font-medium">
                      {w.draw_entries?.draws?.period} · ${((w.draw_entries?.prize_cents ?? 0) / 100).toFixed(2)}
                    </p>
                    <p className="text-slate-400">
                      {w.admin_decision ?? "pending review"} · {w.payout_status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}