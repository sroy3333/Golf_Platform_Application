"use client";
import { useEffect, useState } from "react";

interface Charity {
  id: string;
  name: string;
  description: string;
  is_spotlight: boolean;
}

export default function Charities() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/charities")
      .then((r) => r.json())
      .then((b) => setCharities(b.charities ?? []));
  }, []);

  const filtered = charities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Choose a cause to play for</h1>
      <input
        placeholder="Search charities…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 mb-8 w-full max-w-sm"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{c.name}</h3>
              {c.is_spotlight && <span className="text-xs bg-emerald-400 text-slate-900 px-2 py-1 rounded-full">Spotlight</span>}
            </div>
            <p className="text-sm text-slate-400">{c.description}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-400">No charities found.</p>}
      </div>
    </div>
  );
}
