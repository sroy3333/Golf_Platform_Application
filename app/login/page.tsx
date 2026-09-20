"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);
    router.push("/dashboard");
  }

  return (
    <div className="px-8 py-20 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-primary">Sign in</button>
      </form>
    </div>
  );
}
