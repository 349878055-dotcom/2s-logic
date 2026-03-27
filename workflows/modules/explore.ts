/**
 * 探索区（ExploreView）工作流
 */
import * as tools from "@/lib/toolkit/compat_tools";

export const WORKFLOW_ROUTE_DOC_PAGE1_EXPLORE = `
本页无专线。用户点「AI 重写」由 page.tsx 切到「创作」并带 initialContext。
`.trim();

/** 【预留】探索页重写上下文（当前空操作，无专线 UI） */
export function workflow_Explore_PrepareRewriteContext() {
  return tools.toolPlaceholderNoop();
}
