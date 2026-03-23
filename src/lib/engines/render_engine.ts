/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/lib/engines/render_engine.ts
 * =====================================================================
 * 🎯 [业务逻辑]: 环节 C — 将 LEX + 叙事上下文压成极简 System 侧提示（供大模型渲染）
 * 🔗 [牵连与边界]: 纯字符串拼装；禁止 I/O
 * =====================================================================
 */

export function buildRenderPrompt(lexCode: string, narrativeContext: string): string {
  return [
    "你是一个文本渲染器。",
    "严格遵循以下性格简码对应的指令风格进行续写。",
    `简码：${lexCode}`,
    `上下文：${narrativeContext}`,
  ].join(" ");
}
