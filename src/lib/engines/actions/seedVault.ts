"use server";

/**
 * @Snapshot engines-seedVault-v1
 * @Role Server Action：只读暴露 globalSeedCache 快照
 * @Guardrail 禁止写入磁盘
 */
import { globalSeedCache, type SeedState } from "@/lib/core/store";

/** 根据 Hex ID 获取完整 SeedState 快照（用于种子详情弹出层） */
export async function getSeedStateById(id: string): Promise<SeedState | null> {
  return globalSeedCache.get(id) ?? null;
}

export interface SeedVaultEntry {
  id: string;
  depth: number;
  isLocked: boolean;
  confidenceAvg: number;
  stress: number;
  compute: number;
  ownerId?: string;
  scriptTitle?: string;
}

/** 监管用：获取全量种子快照 */
export async function getSeedVault(): Promise<SeedVaultEntry[]> {
  const allSeeds = Array.from(globalSeedCache.entries());
  return allSeeds.map(([id, state]) => {
    const { d, o, e, s } = state.does;
    const solidification = (d: { mu: number; sigma: number; locked: boolean }) =>
      d.locked ? 1 : Math.max(0, 1 - d.sigma / 50);
    const confidenceAvg =
      (solidification(d) + solidification(o) + solidification(e) + solidification(s)) / 4;
    return {
      id,
      depth: state.depth,
      isLocked: d.locked,
      confidenceAvg: Math.round(confidenceAvg * 100) / 100,
      stress: state.stress,
      compute: state.compute,
      ownerId: "—",
      scriptTitle: "—",
    };
  });
}
