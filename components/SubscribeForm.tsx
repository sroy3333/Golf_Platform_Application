"use client";
import { useEffect, useState } from "react";

interface Charity {
  id: string;
  name: string;
}

export default function SubscribeForm({ onSubscribed }: { onSubscribed: () => void }) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [charityPct, setCharityPct] = useState(10);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/charities")
      .then((r) => r.json())
      .then((b) => {
        setCharities(b.charities ?? []);
        if (b.charities?.length) setCharityId(b.charities[0].id);
      });
  }, []);

  async function subscribe() {
    if (!charityId) return setError("Pick a charity before subscribing.");
    setError(null);
    setLoading(true);
    // Razorpay Checkout would normally intercept here — see README.
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, charityId, charityPct }),
    });
    setLoading(false);
    if (res.ok) {
      onSubscribed();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Subscription failed.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <button onClick={() => setPlan("monthly")} className={plan === "monthly" ? "btn-primary" : "btn-secondary"}>Monthly</button>
        <button onClick={() => setPlan("yearly")} className={plan === "yearly" ? "btn-primary" : "btn-secondary"}>Yearly (save)</button>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Charity</label>
        {charities.length === 0 ? (
          <p className="text-sm text-amber-400">
            No charities exist yet — an admin needs to add one from /admin/charities before you can subscribe.
          </p>
        ) : (
          <select value={charityId} onChange={(e) => setCharityId(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 w-full">
            {charities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Charity contribution: {charityPct}%</label>
        <input type="range" min={10} max={100} value={charityPct} onChange={(e) => setCharityPct(Number(e.target.value))} className="w-full" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={subscribe} className="btn-primary self-start" disabled={charities.length === 0 || loading}>
        {loading ? "Subscribing…" : "Subscribe"}
      </button>
    </div>
  );
}