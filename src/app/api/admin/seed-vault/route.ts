// ══════════════════════════════════════════════════════════
// 监管账户专用 API：获取全量种子快照
// GET /api/admin/seed-vault
// 需携带 X-Admin-Key 或 Authorization: Bearer <ADMIN_SECRET>
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { globalSeedCache } from "@/lib/core/store";

function isAdmin(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;
  const key = req.headers.get("x-admin-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return key === adminSecret;
}

export async function GET(req: NextRequest) {
  // 1. 权限校验 (Check if User is Admin)
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized: Admin only" }, { status: 401 });
  }

  // 2. 从 globalSeedCache 中拉取所有活跃种子
  const allSeeds = Array.from(globalSeedCache.entries());

  // 3. 返回包含置信度和深度的数据集
  const payload = allSeeds.map(([id, state]) => {
    const { d, o, e, s } = state.does;
    const solidification = (x: { sigma: number; locked: boolean }) =>
      x.locked ? 1 : Math.max(0, 1 - x.sigma / 50);
    const confidenceAvg =
      (solidification(d) + solidification(o) + solidification(e) + solidification(s)) / 4;
    return {
      id,
      depth: state.depth,
      isLocked: d.locked, // 以驱动力锁定状态为例
      confidenceAvg: Math.round(confidenceAvg * 100) / 100,
      stress: state.stress,
      compute: state.compute,
    };
  });

  return NextResponse.json(payload);
}
