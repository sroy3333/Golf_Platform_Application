import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Lists every subscriber for the admin User management screen (§11).
 * Uses a nested select so Postgres/PostgREST returns each profile's
 * subscriptions in one round trip; we then pick out the active one
 * (a user may have historical cancelled/lapsed rows too).
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, subscriptions(plan, status, current_period_end)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (data ?? []).map((p: any) => {
    const active = (p.subscriptions ?? []).find((s: any) => s.status === "active");
    return {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      plan: active?.plan ?? null,
      status: active?.status ?? "inactive",
    };
  });

  return NextResponse.json({ users });
}