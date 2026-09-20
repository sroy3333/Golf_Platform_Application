"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function Navbar() {
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function checkRole(userId: string | undefined) {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
      setIsAdmin(data?.role === "admin");
    }

    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      checkRole(data.user?.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
      checkRole(session?.user?.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    setSignedIn(false);
    setIsAdmin(false);
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
      <Link href="/" className="font-bold text-lg tracking-tight">
        digital<span className="text-emerald-400">.HEROES</span>
      </Link>
      <nav className="flex gap-6 text-sm text-slate-300 items-center">
        <Link href="/charities" className="hover:text-white">Charities</Link>
        {signedIn && <Link href="/dashboard" className="hover:text-white">Dashboard</Link>}
        {isAdmin && <Link href="/admin" className="hover:text-white">Admin</Link>}
        {signedIn ? (
          <button onClick={signOut} className="btn-primary !px-4 !py-1.5">Sign out</button>
        ) : (
          <>
            <Link href="/login" className="hover:text-white">Sign in</Link>
            <Link href="/signup" className="btn-primary !px-4 !py-1.5">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
