// ══════════════════════════════════════════════════════════
// GET /api/history — 按 OWNER 拉取最近一次四宫格任务（jobs.json）
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getLastJob } from "@/lib/vault/io_engine";

export async function GET(req: NextRequest) {
  try {
    const ownerId =
      req.nextUrl.searchParams.get("admin")?.trim() ||
      req.nextUrl.searchParams.get("ownerId")?.trim() ||
      "default";
    const lastJob = await getLastJob(ownerId);
    return NextResponse.json({ lastJob });
  } catch (err) {
    console.error("[/api/history]", err);
    return NextResponse.json({ lastJob: null });
  }
}
