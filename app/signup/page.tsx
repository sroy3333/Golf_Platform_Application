"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return setError(error.message);

    // With "Confirm email" on, signUp() returns a user but no session yet —
    // the person has to click the emailed link first. With it off, a session
    // comes back immediately and we can go straight to the dashboard, where
    // the subscription picker takes over (see components/SubscribeForm.tsx).
    if (data.session) {
      router.push("/dashboard");
    } else {
      setConfirmationSent(true);
    }
  }

  if (confirmationSent) {
    return (
      <div className="px-8 py-20 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="text-slate-400">
          We sent a confirmation link to {email}. Click it, then log in — you'll pick a plan and charity right from your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-20 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create your account</h1>
      <form onSubmit={createAccount} className="flex flex-col gap-4">
        <input required placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2" />
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-primary">Create account</button>
      </form>
    </div>
  );
}