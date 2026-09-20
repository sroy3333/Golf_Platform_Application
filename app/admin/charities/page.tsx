"use client";
import { useEffect, useState } from "react";

export default function AdminCharities() {
  const [charities, setCharities] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const res = await fetch("/api/charities");
    const body = await res.json();
    setCharities(body.charities ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/charities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName(""); setDescription("");
    load();
  }

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Charity management</h1>
      <form onSubmit={add} className="card flex flex-col gap-3 mb-8">
        <input required placeholder="Charity name" value={name} onChange={(e) => setName(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2" />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2" />
        <button className="btn-primary self-start">Add charity</button>
      </form>
      <ul className="space-y-3">
        {charities.map((c) => (
          <li key={c.id} className="card">
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-sm text-slate-400">{c.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
