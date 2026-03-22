// ══════════════════════════════════════════════════════════
// GET /api/seed — 快速获取 Seed 状态
// 用于 EditView 数据透视，展示真实 11 维逻辑底座
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { globalSeedCache } from "@/lib/core/store";

export async function GET(req: NextRequest) {
  const seedId = req.nextUrl.searchParams.get("id");
  if (!seedId) return NextResponse.json({ error: "Missing seedId" }, { status: 400 });
  const state = globalSeedCache.get(seedId);
  if (!state) return NextResponse.json({ error: "Seed not found" }, { status: 404 });
  return NextResponse.json(state);
}
