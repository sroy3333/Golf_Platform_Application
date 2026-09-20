"use client";
import { useEffect, useState } from "react";

interface Winner {
  id: string;
  admin_decision: string | null;
  payout_status: string;
  profiles: { full_name: string } | null;
  draw_entries: { tier: string; prize_cents: number; draws: { period: string } } | null;
}

export default function AdminWinners() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/winners/verify");
    if (res.ok) {
      const body = await res.json();
      setWinners(body.winners ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(winnerId: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/winners/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId, decision }),
    });
    setStatus(res.ok ? `Marked ${decision}` : "Failed to update decision");
    load();
  }

  async function markPaid(winnerId: string) {
    const res = await fetch("/api/winners/verify", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId }),
    });
    setStatus(res.ok ? "Marked paid" : "Failed — must be approved first");
    load();
  }

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Winners management</h1>
      {status && <p className="text-sm text-emerald-400 mb-4">{status}</p>}
      {winners.length === 0 ? (
        <p className="text-slate-400 text-sm">No winners yet — publish a draw with at least one match to see entries here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {winners.map((w) => (
            <div key={w.id} className="card flex items-center justify-between">
              <div className="text-sm">
                <p className="font-semibold">{w.profiles?.full_name ?? "Unknown"}</p>
                <p className="text-slate-400">
                  {w.draw_entries?.draws?.period} · {w.draw_entries?.tier?.replace("_", "-")} ·{" "}
                  ${((w.draw_entries?.prize_cents ?? 0) / 100).toFixed(2)}
                </p>
                <p className="text-slate-500">
                  Decision: {w.admin_decision ?? "pending review"} · Payout: {w.payout_status}
                </p>
              </div>
              <div className="flex gap-2">
                {!w.admin_decision && (
                  <>
                    <button onClick={() => review(w.id, "approved")} className="btn-primary !px-3 !py-1.5 text-sm">Approve</button>
                    <button onClick={() => review(w.id, "rejected")} className="btn-secondary !px-3 !py-1.5 text-sm">Reject</button>
                  </>
                )}
                {w.admin_decision === "approved" && w.payout_status === "pending" && (
                  <button onClick={() => markPaid(w.id)} className="btn-secondary !px-3 !py-1.5 text-sm">Mark paid</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}