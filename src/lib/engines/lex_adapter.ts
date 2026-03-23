/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/lib/engines/lex_adapter.ts
 * =====================================================================
 * 🎯 [业务逻辑]:
 * 环节 B — 将归一化 11 维向量量化为 11D-LEX 简码串。
 * 📥 [进 (Input)]:
 * - ElevenDimensions（0.0–1.0）
 * 📤 [出 (Output)]:
 * - 拼接后的 LEX 字符串，如 `<D2><O8><E9>...`
 * 🔗 [牵连与边界]:
 * - 仅依赖 types；禁止 I/O 与 React。
 * =====================================================================
 */

import type { ElevenDimensions } from "@/lib/core/types";

/** 单维 0–1 → 档位 0–9：floor(v*10)，且 1.0 收敛为 9 */
function quantize01(v: number): number {
  const clamped = Math.max(0, Math.min(1, v));
  return Math.min(9, Math.floor(clamped * 10));
}

function tok(prefix: string, v: number): string {
  return `<${prefix}${quantize01(v)}>`;
}

/**
 * 将 11 维连续值转为固定顺序的 LEX 简码串。
 * 映射：D O E S T C B L G A P（Stress→T 避免与 Sociality 的 S 冲突）
 */
export function convert11DToLex(dimensions: ElevenDimensions): string {
  return [
    tok("D", dimensions.dominance),
    tok("O", dimensions.order),
    tok("E", dimensions.ego),
    tok("S", dimensions.sociality),
    tok("T", dimensions.stress),
    tok("C", dimensions.compute),
    tok("B", dimensions.bandwidth),
    tok("L", dimensions.logic_link),
    tok("G", dimensions.target_goal),
    tok("A", dimensions.anchor),
    tok("P", dimensions.ego_type),
  ].join("");
}
