/**
 * 剧本区表现层入口（再导出）。
 *
 * 三位一体（改按钮时按此找文件）：
 *   1. 原子层     → `@/lib/atoms/transpiler_atoms`（剧本区 HTTP，无业务）
 *   2. 工作流     → `@/workflows/registry`（`workflow_*`）
 *   3. 按钮视觉   → `./scriptworkbench_ui_specs`（`SCRIPTWORKBENCH_UI_*`）
 */

export * from "./scriptworkbench_types";
export * from "./scriptworkbench_ui_specs";

export const SCRIPTWORKBENCH_LOAD_MANUSCRIPT_TOOLTIP =
  "支持 TXT / PDF / EPUB 格式，建议 30 万字以内";

export const SCRIPTWORKBENCH_MANUSCRIPT_REJECT_MESSAGE =
  "不支持的文件格式，请上传 TXT / PDF 或 EPUB";

/** 壳层「剧本区」标题条（与侧边栏「剧本区」对应） */
export const PRESENTATION_SCRIPTWORKBENCH_VIEWPORT = {
  navLabel: "剧本区",
  title: "剧本区",
  subtitle: "叙事切片 · 万象显影",
} as const;

/** 新建叙事容器默认名：孤岛文本 01、02 … */
export function scriptworkbenchNextIsolatedTextLabel(projectCount: number): string {
  return `孤岛文本 ${String(projectCount + 1).padStart(2, "0")}`;
}
