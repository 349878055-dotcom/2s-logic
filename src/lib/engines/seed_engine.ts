/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/lib/engines/seed_engine.ts
 * =====================================================================
 * 🎯 [业务逻辑]: 环节 A — 从上下文抽取 / 推导 11 维归一化向量（可替换为本地小模型）
 * 🔗 [牵连与边界]: 仅依赖 types；禁止 React / I/O
 * =====================================================================
 */

import type { ElevenDimensions } from "@/lib/core/types";

const DEFAULT_11: ElevenDimensions = {
  dominance: 0.5,
  order: 0.5,
  ego: 0.5,
  sociality: 0.5,
  bandwidth: 0.72,
  stress: 0.28,
  compute: 0.55,
  logic_link: 0.5,
  target_goal: 0.5,
  anchor: 0.5,
  ego_type: 0.5,
};

/** Mock：用文本长度扰动主导维，便于联调；后续可换本地小模型 */
export async function extractSeedLogic(
  context: string,
  manualOverrides?: Partial<ElevenDimensions>
): Promise<ElevenDimensions> {
  const hint = (context.length % 10) / 10;
  return {
    ...DEFAULT_11,
    dominance: hint,
    stress: Math.min(1, 0.2 + hint * 0.08),
    ...manualOverrides,
  };
}
