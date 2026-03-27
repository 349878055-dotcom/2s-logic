/**
 * 综合区 · 全站工作流路由文档汇总（供对照侧边栏页序）
 */
import { WORKFLOW_ROUTE_DOC_PAGE1_EXPLORE } from "../explore";
import { WORKFLOW_ROUTE_DOC_PAGE2_CREATE } from "../create";
import { WORKFLOW_ROUTE_DOC_PAGE3_EDIT } from "../edit";
import { WORKFLOW_ROUTE_DOC_PAGE4_ORGANIZE } from "../organize";
import { WORKFLOW_ROUTE_DOC_PAGE5_TRANSPILER } from "../transpiler";
import { WORKFLOW_ROUTE_DOC_PAGE6_STYLE } from "../style";
import { WORKFLOW_ROUTE_DOC_PAGE7_TASK } from "../task";

export const WORKFLOW_ROUTE_DOC_RESERVED = `
workflow_Explore_PrepareRewriteContext
workflow_Transpiler_UploadManuscript（载入原稿 dispatch 占位，正文抽取在 View）
`.trim();

export const WORKFLOW_ROUTE_DOC_ALL = [
  "【页面一 探索】",
  WORKFLOW_ROUTE_DOC_PAGE1_EXPLORE,
  "【页面二 创作】",
  WORKFLOW_ROUTE_DOC_PAGE2_CREATE,
  "【页面三 编辑】",
  WORKFLOW_ROUTE_DOC_PAGE3_EDIT,
  "【页面四 整理】",
  WORKFLOW_ROUTE_DOC_PAGE4_ORGANIZE,
  "【页面五 剧本区】",
  WORKFLOW_ROUTE_DOC_PAGE5_TRANSPILER,
  "【页面六 风格工坊】",
  WORKFLOW_ROUTE_DOC_PAGE6_STYLE,
  "【页面七 任务】",
  WORKFLOW_ROUTE_DOC_PAGE7_TASK,
  "【预留】",
  WORKFLOW_ROUTE_DOC_RESERVED,
].join("\n\n");
