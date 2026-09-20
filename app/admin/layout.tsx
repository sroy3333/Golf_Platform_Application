"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

/**
 * Applies to every page under app/admin/ automatically (Next.js layout
 * nesting). This is the UI-side half of role enforcement — the API routes
 * under app/api/admin/, app/api/draws/, etc. already check role='admin'
 * server-side via requireAdmin() in lib/auth.ts, which is the real security
 * boundary. This layout exists so a subscriber never even sees the admin
 * page shell, whether they click a link or type the URL directly.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const supabase = supabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setAllowed(true);
    }
    check();
  }, [router]);

  if (allowed === null) {
    return <div className="px-8 py-10 text-slate-400">Checking access…</div>;
  }
  return <>{children}</>;
}