/**
 * 风格工坊（StyleTunerView）工作流
 */
import * as tools from "@/lib/toolkit/compat_tools";

export const WORKFLOW_ROUTE_DOC_PAGE6_STYLE = `
当前校准在弹层内完成，视图未调专线。预留：
完成人物校准 → workflow_Style_CompleteCharacterCalibration
完成环境校准 → workflow_Style_CompleteEnvironmentCalibration
`.trim();

export function workflow_Style_CompleteCharacterCalibration() {
  return tools.toolPlaceholderNoop();
}

export function workflow_Style_CompleteEnvironmentCalibration() {
  return tools.toolPlaceholderNoop();
}
