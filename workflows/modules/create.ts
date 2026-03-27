/**
 * 创作区（CreateView）工作流
 */
import type { ElevenDimensions } from "@/lib/core/types";
import { extractSeedLogic, evolveSeedLogic } from "@/lib/engines/seed_engine";
import { convert11DToLex } from "@/lib/engines/lex_adapter";
import { buildRenderPrompt } from "@/lib/engines/render_engine";
import { planCreateGenerateQuadrants, pickVaryTargetFocus } from "@/lib/engines/create_workbench";
import { requestAdopt, requestContentStream } from "@/lib/engines/utils";
import * as tools from "@/lib/toolkit/compat_tools";

export const WORKFLOW_ROUTE_DOC_PAGE2_CREATE = `
未接线：「定调」、参考条「×」、输入框 onChange（仅 Enter 走「生成」）。
「生成」 / 输入框 Enter（当前 UI） → workflow_Create_RunContentStream（非四宫）；四宫管线 → workflow_Create_GenerateQuad
「【稳健】～【变数】」四钮 → workflow_Create_VaryCard
卡片 temp_variant「采纳」落盘 → workflow_Create_PersistAdopt；带 11 维演化采纳 → workflow_Create_AdoptStream
进入页面自动拉历史         → workflow_Create_LoadHistory
`.trim();

/** 【页面二 · 创作】对应按钮：主栏「生成」或提示输入框按 Enter（四宫格一次生成） */
export async function workflow_Create_GenerateQuad(原材料: {
  sourceText: string;
  manualOverrides?: Partial<ElevenDimensions>;
  narrativeContext: string;
  referenceSeed?: string;
}) {
  const quadrantPlans = await planCreateGenerateQuadrants({
    sourceText: 原材料.sourceText,
    manualOverrides: 原材料.manualOverrides,
    narrativeContext: 原材料.narrativeContext,
  });
  const dimensions = quadrantPlans[0]?.dimensions;
  const lexCode = quadrantPlans.map((q) => q.lexCode).join(" · ");
  const promptForModel = quadrantPlans[0]?.finalSystemPrompt ?? "";
  const quadrants = quadrantPlans.map((q) => ({
    dimensions: q.dimensions,
    finalSystemPrompt: q.finalSystemPrompt,
  }));

  const streams = await tools.toolApiPostGenerateQuadrantsJson({
    prompt: 原材料.sourceText,
    sourceText: 原材料.sourceText,
    quadrants,
    seed: 原材料.referenceSeed,
  });
  return { dimensions, lexCode, promptForModel, streams };
}

/** 【页面二 · 创作】对应按钮：卡片悬停底栏「【稳健】/【激烈】/【温和】/【变数】」定向演化 */
export async function workflow_Create_VaryCard(原材料: {
  seed: string;
  target: number;
  baseText: string;
  targetFocus: Partial<ElevenDimensions>;
  narrativeContext: string;
}) {
  const mergedFocus = { ...pickVaryTargetFocus(原材料.target), ...原材料.targetFocus };

  const dimensions = await extractSeedLogic(原材料.baseText, mergedFocus);
  const lexCode = convert11DToLex(dimensions);
  const finalPrompt = buildRenderPrompt(lexCode, 原材料.narrativeContext);

  return tools.toolRequestContentStreamForVariants({
    action: "vary",
    seed: 原材料.seed,
    target: 原材料.target,
    prompt: 原材料.baseText,
    narrativeContext: 原材料.narrativeContext,
    lexCode,
    varyPipeline: { finalSystemPrompt: finalPrompt, dimensions },
  });
}

/** 【页面二 · 创作】对应按钮：卡片上「采纳」（固化 seed 并进编辑草稿链路） */
export async function workflow_Create_AdoptStream(原材料: {
  seedId: string;
  adoptedText: string;
  targetDimensions: Partial<ElevenDimensions>;
}) {
  const base = await tools.toolApiGetSeedState(原材料.seedId);

  const nextDimensions = base
    ? evolveSeedLogic(base, 原材料.targetDimensions)
    : evolveSeedLogic(await extractSeedLogic(原材料.adoptedText), 原材料.targetDimensions);

  const tempState = tools.toolSynthesizeAdoptTempState(base, nextDimensions, 原材料.adoptedText);

  await tools.toolApiRequestAdopt({
    seedId: 原材料.seedId,
    tempState,
    prompt: 原材料.adoptedText.slice(0, 120),
  });
  return { status: "success" as const, evolvedDimensions: nextDimensions };
}

/** 【页面二 · 创作】进入页面自动拉历史 */
export function workflow_Create_LoadHistory() {
  return tools.toolApiGetHistoryLastJob();
}

/** 主栏「生成」等非四宫管线：直出 ContentStream[] */
export function workflow_Create_RunContentStream(原材料: Parameters<typeof requestContentStream>[0]) {
  return requestContentStream(原材料);
}

/** temp_variant 采纳落盘（不做 11 维演化；演化链见 workflow_Create_AdoptStream） */
export function workflow_Create_PersistAdopt(原材料: Parameters<typeof requestAdopt>[0]) {
  return requestAdopt(原材料);
}
