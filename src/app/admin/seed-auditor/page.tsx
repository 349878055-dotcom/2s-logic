// ══════════════════════════════════════════════════════════
// 逻辑监管塔 (Seed Auditor) — 监管账户专用
// 访问 /admin/seed-auditor?admin=1 或通过 TranspilerView 入口进入
// ══════════════════════════════════════════════════════════

import { globalSeedCache } from "@/lib/core/store";
import SeedAuditorClient from "./SeedAuditorClient";

async function getSeedVaultData() {
  const allSeeds = Array.from(globalSeedCache.entries());
  return allSeeds.map(([id, state]) => {
    const { d, o, e, s } = state.does;
    const solidification = (x: { sigma: number; locked: boolean }) =>
      x.locked ? 1 : Math.max(0, 1 - x.sigma / 50);
    const confidenceAvg =
      (solidification(d) + solidification(o) + solidification(e) + solidification(s)) / 4;
    return {
      id,
      depth: state.depth,
      isLocked: d.locked,
      confidenceAvg: Math.round(confidenceAvg * 100) / 100,
      stress: state.stress,
      compute: state.compute,
    };
  });
}

export default async function SeedAuditorPage() {
  const seeds = await getSeedVaultData();
  return <SeedAuditorClient seeds={seeds} />;
}
