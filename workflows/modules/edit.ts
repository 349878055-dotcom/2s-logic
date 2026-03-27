/**
 * 编辑区（EditView）工作流
 */
import type { EditRewritePayload } from "./hub/types";
import * as tools from "@/lib/toolkit/compat_tools";

export const WORKFLOW_ROUTE_DOC_PAGE3_EDIT = `
选中片段后拉 seed 快照       → workflow_Edit_FetchSeedSnapshot
「灵感重塑（重写该角色）」   → workflow_Edit_RewriteFragment
稳健 / 激烈 / 温和 / 变数 四钮 → workflow_Edit_RewriteByVariant
「一键 Upscale」             → workflow_Edit_UpscaleFragment
`.trim();

/** 【页面三 · 编辑】选中带 seedId 的片段时自动拉取 */
export async function workflow_Edit_FetchSeedSnapshot(原材料: { seedId: string }) {
  return tools.toolApiGetSeedState(原材料.seedId);
}

/** 【页面三 · 编辑】侧栏「灵感重塑（重写该角色）」 */
export async function workflow_Edit_RewriteFragment(原材料: EditRewritePayload) {
  const raw = await tools.toolApiPostEditRewriteVaryJson({
    action: "vary",
    seed: 原材料.seed,
    prompt: 原材料.prompt,
    originalText: 原材料.originalText,
    manualDoes: 原材料.manualDoes,
    target: 原材料.target,
  });

  return tools.toolParseEditRewriteFirstHit(raw);
}

/** 【页面三 · 编辑】长卷片段底栏四钮 */
export async function workflow_Edit_RewriteByVariant(原材料: EditRewritePayload) {
  return workflow_Edit_RewriteFragment(原材料);
}

/** 【页面三 · 编辑】侧栏「一键 Upscale」 */
export async function workflow_Edit_UpscaleFragment(原材料: EditRewritePayload) {
  return workflow_Edit_RewriteFragment(原材料);
}
