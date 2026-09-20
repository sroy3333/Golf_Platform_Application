import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("charities").select("*").order("is_spotlight", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ charities: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("charities").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ charity: data });
}
