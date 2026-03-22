/**
 * @Snapshot engines-engine_evolving-v1
 * @Role 创作区演化：采样、惯性偏移、采纳固化（纯计算）
 * @Guardrail 禁止 fs / 网络落盘；仅操作内存态并返回结果
 */
// ══════════════════════════════════════════════════════════
// Engine Evolving — 创作区概率演化管线
// 原创剧情发散采样、偏移与采纳算法
// ══════════════════════════════════════════════════════════

import type { SeedState } from "@/lib/core/store";
import type { ProbabilityCloud } from "@/lib/core/types";
import {
  getGenAI,
  buildGeminiRequestOptions,
  defaultProModel,
  calculateCompute,
  createDefaultSeedState,
} from "./will_engine";

function pc(mu: number, sigma = 15, locked = false): ProbabilityCloud {
  return { mu, sigma, locked };
}

// ============================================================================
// 变体偏移与采纳
// ============================================================================

const VARIANT_OFFSETS: Record<
  number,
  { d: number; o: number; e: number; s: number }
> = {
  1: { d: 0, o: 0, e: 0, s: 0 },
  2: { d: 15, o: 0, e: -10, s: -10 },
  3: { d: -10, o: 0, e: 15, s: 15 },
  4: { d: 0, o: 0, e: 0, s: 0 },
};

export function calculateInertiaShift(
  baseState: SeedState,
  targetVariant: number
): SeedState {
  const t = Math.max(1, Math.min(4, Math.round(targetVariant)));
  let offsets = VARIANT_OFFSETS[t];
  if (t === 4) {
    const j = () => Math.round(Math.random() * 30 - 15);
    offsets = { d: j(), o: j(), e: j(), s: j() };
  }
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const shiftDim = (dim: ProbabilityCloud, offset: number) =>
    dim.locked ? { ...dim } : { ...dim, mu: Math.round(clamp(dim.mu + offset * (dim.sigma / 50))) };
  return {
    ...baseState,
    does: {
      d: shiftDim(baseState.does.d, offsets.d),
      o: shiftDim(baseState.does.o, offsets.o),
      e: shiftDim(baseState.does.e, offsets.e),
      s: shiftDim(baseState.does.s, offsets.s),
    },
    compute: calculateCompute(baseState.stress, baseState.bandwidth.mu),
  };
}

export function commitAdoption(
  baseState: SeedState,
  adoptedState: SeedState,
  manualPrompt?: string
): SeedState {
  const alpha = manualPrompt ? 0.75 : 0.6;
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const convergeDim = (
    base: ProbabilityCloud,
    adopted: ProbabilityCloud
  ): ProbabilityCloud => {
    if (base.locked) return { ...base };
    const newMu = clamp(base.mu + alpha * (adopted.mu - base.mu));
    const newSigma = Math.max(0, base.sigma * (1 - alpha));
    return {
      mu: newMu,
      sigma: newSigma <= 1 ? 0 : newSigma,
      locked: newSigma <= 1,
    };
  };
  return {
    ...baseState,
    skin: adoptedState.skin,
    context: adoptedState.context,
    does: {
      d: convergeDim(baseState.does.d, adoptedState.does.d),
      o: convergeDim(baseState.does.o, adoptedState.does.o),
      e: convergeDim(baseState.does.e, adoptedState.does.e),
      s: convergeDim(baseState.does.s, adoptedState.does.s),
    },
    bandwidth: convergeDim(baseState.bandwidth, adoptedState.bandwidth),
    ego_type: adoptedState.ego_type,
    dynamic_goal: adoptedState.dynamic_goal,
    logic_link: adoptedState.logic_link,
    anchor: { value: adoptedState.anchor.value, locked: baseState.anchor.locked || !!adoptedState.anchor.value },
    stress: adoptedState.stress,
    compute: calculateCompute(adoptedState.stress, baseState.bandwidth.mu),
    depth: baseState.depth + 1,
    createdAt: Date.now(),
  };
}

// ============================================================================
// 人物提示与六元素生成
// ============================================================================

export function buildCharacterPrompt(
  state: SeedState,
  userPrompt?: string,
  originalText?: string
): string {
  const getLockTag = (dim: ProbabilityCloud) => (dim.locked ? "[已焊死]" : "[可浮动]");
  let prompt = `你是一个顶尖的影视编剧辅助系统。请以第一人称输出一段剧本台词及动作描写（80-150字）。禁止输出旁白。
【人物底色】${state.skin} 【当前场景】${state.context}
【逻辑引擎核心 D.O.E.S】
- 驱动力(D): ${state.does.d.mu} ${getLockTag(state.does.d)}
- 秩序感(O): ${state.does.o.mu} ${getLockTag(state.does.o)}
- 共情度(E): ${state.does.e.mu} ${getLockTag(state.does.e)}
- 安全感(S): ${state.does.s.mu} ${getLockTag(state.does.s)}
【自我类型】${state.ego_type.current_dominant} · 【瞬时目标】${state.dynamic_goal.current_dominant} · 【逻辑链】${state.logic_link.current_dominant}
`;
  if (originalText) prompt += `\n【当前需要重塑的原片段底片】：\n"${originalText}"\n`;
  if (userPrompt?.includes("[UPSCALE]")) {
    prompt += `\n【!!! 通用分辨率提升 !!!】保持原片段文体情感绝对不变，仅进行无损放大和锐化。由DOES决定细节方向。${userPrompt.replace("[UPSCALE]", "").trim()}\n`;
  } else if (userPrompt?.includes("[LOCK_ENV]")) {
    prompt += `\n【!!! 局部重构掩码指令 !!!】严禁修改环境布景！仅改变微动作或台词语气！方向：${userPrompt.replace("[LOCK_ENV]", "").trim()}\n`;
  } else if (userPrompt) {
    prompt += `\n【导演局部重构指令】必须严格向此方向调整：${userPrompt}\n`;
  }
  return prompt + `\n请直接输出结果，拒绝行活儿，拒绝平庸形容词：`;
}

export async function generateSixElementScript(
  state: SeedState,
  originalText: string,
  userPrompt?: string
): Promise<string> {
  const basePrompt = buildCharacterPrompt(state, userPrompt, originalText);
  const fullPrompt = `你是一个物理剧本翻译机。必须严格输出六元素格式，严禁形容词。\n\n${basePrompt}\n\n请以六元素 JSON 格式返回：{"environment":"...","action":"...","expression":"...","detail":"...","monologue":"...","dialogue":"..."}`;
  try {
    const model = getGenAI().getGenerativeModel(
      { model: defaultProModel() },
      buildGeminiRequestOptions()
    );
    const result = await model.generateContent(fullPrompt);
    const match = result.response.text().trim().match(/\{[\s\S]*\}/);
    if (match) {
      const obj = JSON.parse(match[0]) as Record<string, string>;
      return ["environment", "action", "expression", "detail", "monologue", "dialogue"]
        .filter((k) => obj[k])
        .map((k) => `[${k}] ${obj[k]}`)
        .join("\n\n");
    }
  } catch {
    /* ignore */
  }
  return originalText || "（翻译失败）";
}

export async function generateInitialSeeds(prompt: string): Promise<SeedState[]> {
  const base = createDefaultSeedState(prompt);
  return [
    { ...base, does: { d: pc(55), o: pc(90), e: pc(25), s: pc(60) }, stress: 18, compute: calculateCompute(18, 72) },
    { ...base, does: { d: pc(40), o: pc(35), e: pc(92), s: pc(30) }, stress: 35, compute: calculateCompute(35, 72) },
    { ...base, does: { d: pc(95), o: pc(60), e: pc(20), s: pc(45) }, stress: 22, compute: calculateCompute(22, 72) },
    { ...base, does: { d: pc(15), o: pc(20), e: pc(55), s: pc(80) }, stress: 82, compute: calculateCompute(82, 72) },
  ];
}

// ============================================================================
// ProductionPipeline — 创作区管线（当前为占位）
// ============================================================================

export class ProductionPipeline {
  id = `prod-${Date.now()}`;
  async processNovel(_charId?: string, _charName?: string, _inputText?: string): Promise<void> {
    throw new Error("创作区已隔离，请使用降维管线 (DehydrationPipeline)。");
  }
}
