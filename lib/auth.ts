import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "./supabaseServer";

/** Resolves the logged-in user from the Supabase auth cookie on the request. */
export async function requireUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Same as requireUser, but also asserts the profile has role='admin'. */
export async function requireAdmin(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return null;
  const admin = supabaseServer();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}
