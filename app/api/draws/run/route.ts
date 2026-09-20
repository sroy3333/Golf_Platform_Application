import { NextRequest, NextResponse } from "next/server";
import { runDraw } from "@/lib/drawEngine";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { period, mode } = await req.json();
  try {
    const result = await runDraw(period, mode ?? "random", true, admin.id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
