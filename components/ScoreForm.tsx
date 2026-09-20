"use client";
import { useState } from "react";

export default function ScoreForm({ onAdded }: { onAdded: () => void }) {
  const [score, setScore] = useState("");
  const [playedOn, setPlayedOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(score), playedOn }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong");
      return;
    }
    setScore("");
    setPlayedOn("");
    onAdded();
  }

  return (
    <form onSubmit={submit} className="flex gap-3 items-end flex-wrap">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Stableford score (1–45)</label>
        <input
          type="number"
          min={1}
          max={45}
          required
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 w-32"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Date played</label>
        <input
          type="date"
          required
          value={playedOn}
          onChange={(e) => setPlayedOn(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2"
        />
      </div>
      <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Add score"}</button>
      {error && <p className="text-red-400 text-sm w-full">{error}</p>}
    </form>
  );
}
