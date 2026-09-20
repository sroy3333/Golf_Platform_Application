"use client";
import { useEffect, useState } from "react";

interface PastDraw {
  id: string;
  period: string;
  mode: string;
  status: string;
  total_pool_cents: number;
  winning_numbers: number[];
  published_at: string | null;
}

export default function AdminDraws() {
  const [period, setPeriod] = useState("2026-04");
  const [mode, setMode] = useState<"random" | "algorithmic">("random");
  const [result, setResult] = useState<any>(null);
  const [pastDraws, setPastDraws] = useState<PastDraw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPastDraws() {
    const res = await fetch("/api/draws");
    if (res.ok) {
      const body = await res.json();
      setPastDraws(body.draws ?? []);
    }
  }

  useEffect(() => {
    loadPastDraws();
  }, []);

  async function call(path: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, mode }),
    });
    setLoading(false);
    const body = await res.json();
    if (!res.ok) return setError(body.error);
    setResult(body);
    if (body.persisted) loadPastDraws();
  }

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Draw management</h1>

      <div className="card mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Period</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic (score-weighted)</option>
          </select>
        </div>
        <button onClick={() => call("/api/draws/simulate")} className="btn-secondary" disabled={loading}>
          Simulate
        </button>
        <button onClick={() => call("/api/draws/run")} className="btn-primary" disabled={loading}>
          Publish
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {result && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">
            {result.persisted ? "Published" : "Simulation preview"} — {result.period}
          </h2>
          <p className="text-sm text-slate-400 mb-1">Total pool: ${(result.totalPoolCents / 100).toFixed(2)}</p>
          <p className="text-sm text-slate-400 mb-4">Winning numbers: {result.winningNumbers?.join(", ")}</p>
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-left">
              <tr><th>Tier</th><th>Pool</th><th>Winners</th><th>Prize each</th></tr>
            </thead>
            <tbody>
              {Object.entries(result.tiers ?? {}).map(([tier, t]: any) => (
                <tr key={tier} className="border-t border-white/10">
                  <td className="py-2">{tier.replace("_", "-")}</td>
                  <td>${(t.poolCents / 100).toFixed(2)}</td>
                  <td>{t.winners.length}</td>
                  <td>${(t.prizeEachCents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.jackpotRollover > 0 && (
            <p className="text-amber-400 text-sm mt-3">
              Jackpot rolls over: ${(result.jackpotRollover / 100).toFixed(2)} added to next period's 5-number pool.
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Past draws</h2>
        {pastDraws.length === 0 ? (
          <p className="text-sm text-slate-400">No draws published yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-left">
              <tr><th className="pb-2">Period</th><th>Mode</th><th>Pool</th><th>Winning numbers</th><th>Status</th></tr>
            </thead>
            <tbody>
              {pastDraws.map((d) => (
                <tr key={d.id} className="border-t border-white/10">
                  <td className="py-2">{d.period}</td>
                  <td>{d.mode}</td>
                  <td>${(d.total_pool_cents / 100).toFixed(2)}</td>
                  <td>{d.winning_numbers?.join(", ")}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}