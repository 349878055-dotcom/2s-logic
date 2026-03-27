/**
 * 【表现层 · 剧本区按钮/UI 规格】（万象显影）
 *
 * 集中定义：`SCRIPTWORKBENCH_UI_*`、流水线阶段条、与按钮绑定的 Lucide `iconKey`、Tailwind 类名。
 * 改「众生造像」配色/文案 → 搜本文件 `SCRIPTWORKBENCH_UI_DISCOVER_CHARACTERS`。
 *
 * 物理请求不在此文件；编排见 `@/workflows/registry`；HTTP 见 `@/lib/atoms/transpiler_atoms`。
 */

import type { ScriptWorkbenchIconKey, ScriptWorkbenchPipelineStage } from "./scriptworkbench_types";

export const SCRIPTWORKBENCH_UI_PIPELINE_STAGES: ReadonlyArray<{
  id: ScriptWorkbenchPipelineStage;
  label: string;
  colorActive: string;
}> = [
  { id: "narrative", label: "叙事解构 · 章节重组", colorActive: "text-cyan-400" },
  { id: "semantic", label: "语义浓缩 · 剧本演化", colorActive: "text-sky-400" },
  { id: "lens", label: "镜头转译 · 视觉对位", colorActive: "text-green-400" },
  { id: "logic", label: "逻辑固化 · 指令生成", colorActive: "text-purple-400" },
];

export const SCRIPTWORKBENCH_UI_STAGE_PANEL_HEADING: Record<ScriptWorkbenchPipelineStage, string> = {
  narrative: "叙事解构 · 章节重组",
  semantic: "语义浓缩 · 剧本演化",
  lens: "镜头转译 · 视觉对位",
  logic: "逻辑固化 · 指令生成",
};

/** 架构显影：逻辑与 UI 深度对齐的叙事规格（Lucide 键在视图内映射） */
export const WF_PRESENTATION_ARCH_IMAGING = {
  id: "arch_imaging" as const,
  label: "架构显影",
  iconKey: "Folder" as const satisfies ScriptWorkbenchIconKey,
  loadingIconKey: "RefreshCw" as const satisfies ScriptWorkbenchIconKey,
  theme: "amber" as const,
  placeholderRunning: "正在解构叙事骨架...",
  toastSuccess: "万象初现，索引块已重组",
} as const;

export const SCRIPTWORKBENCH_UI_VERSION_BANNER = {
  containerClass:
    "bg-amber-500/10 border-b border-amber-500/20 px-6 py-1.5 flex items-center justify-center gap-2 flex-shrink-0 relative",
  textClass: "text-[10px] text-amber-500 font-bold tracking-widest",
  message:
    "🚀 侧边栏实验室模块已全部开放：探索 / 创作 / 编辑 / 整理 / 剧本区 / 工作区与任务均可进入；部分能力仍为占位或本地演示，与后台对接以各页实际调用为准。",
  closeButtonClass:
    "absolute right-2 p-0.5 rounded hover:bg-amber-500/20 text-amber-500/80 hover:text-amber-500 transition-colors",
  closeIconKey: "X" as const satisfies ScriptWorkbenchIconKey,
} as const;

export const SCRIPTWORKBENCH_UI_COMPILE_ERROR_PRE =
  "text-red-400 text-[10px] max-w-xl max-h-20 overflow-auto whitespace-pre-wrap break-words flex-shrink mb-2";

export const SCRIPTWORKBENCH_UI_FEED_ROW =
  "flex-shrink-0 px-6 py-3 border-b border-white/[0.06] bg-[#0a0a0c] flex flex-col gap-3";

export const SCRIPTWORKBENCH_UI_START_NEW_NARRATIVE = {
  id: "start_new_narrative" as const,
  label: "开启新叙事",
  iconKey: "Plus" as const satisfies ScriptWorkbenchIconKey,
  className:
    "flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors flex-shrink-0",
} as const;

export const SCRIPTWORKBENCH_UI_LOAD_MANUSCRIPT = {
  id: "load_manuscript" as const,
  label: "载入原稿",
  iconKey: "Upload" as const satisfies ScriptWorkbenchIconKey,
  titleTooltipRef: "SCRIPTWORKBENCH_LOAD_MANUSCRIPT_TOOLTIP" as const,
  className:
    "flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-gray-200 transition-colors flex-shrink-0",
} as const;

export const SCRIPTWORKBENCH_UI_NARRATIVE_INPUT = {
  id: "narrative_input" as const,
  className:
    "flex-[1.5] min-h-[36px] max-h-[80px] bg-[#0f0f14] border border-white/[0.05] rounded-lg px-3 py-2 text-[12px] text-[#c4cad4] outline-none focus:border-[#a78bfa]/40 transition-colors resize-none",
  placeholderEmpty: "投喂一段未知的叙事，在此见证它的高维跃迁...",
  placeholderLoadedTemplate: (wanCount: string) => `已载入 ${wanCount} 万字...`,
} as const;

export const SCRIPTWORKBENCH_UI_EXTRACT_CHAPTERS = {
  id: "extract_chapters" as const,
  label: WF_PRESENTATION_ARCH_IMAGING.label,
  loadingLabel: "正在架构显影...",
  iconKey: WF_PRESENTATION_ARCH_IMAGING.iconKey,
  loadingIconKey: WF_PRESENTATION_ARCH_IMAGING.loadingIconKey,
  wrapClass: "flex flex-col gap-0 flex-shrink-0",
  className:
    "flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/30 hover:bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-400 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  progressWrapClass: "mt-2 w-full space-y-1 min-w-[200px]",
  progressMetaClass: "flex justify-between text-[9px] text-amber-500 font-mono",
  progressTrackClass: "w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/10",
  progressFillClass:
    "h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-300",
} as const;

export const SCRIPTWORKBENCH_UI_DISCOVER_CHARACTERS = {
  id: "discover_characters" as const,
  label: "众生造像",
  loadingLabel: "分批扫描中…",
  iconKey: "Sparkles" as const satisfies ScriptWorkbenchIconKey,
  loadingIconKey: "RefreshCw" as const satisfies ScriptWorkbenchIconKey,
  wrapClass: "flex flex-col gap-0 flex-shrink-0 items-stretch",
  progressWrapClass: "mt-1.5 w-full min-w-[200px] max-w-[300px] space-y-1",
  progressDetailClass: "text-[9px] leading-snug text-emerald-500/90 font-mono break-words",
  progressTrackClass: "relative h-1 w-full overflow-hidden rounded-full bg-white/5 border border-white/10",
  progressIndeterminateClass: "discover-progress-indeterminate",
  className:
    "flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] text-emerald-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0",
} as const;

export const SCRIPTWORKBENCH_UI_SOLIDIFY_ALL = {
  id: "solidify_all" as const,
  label: "万象定格",
  loadingLabelTemplate: (pct: number) => `正在万象定格 ${pct}%`,
  iconKey: "Sparkles" as const satisfies ScriptWorkbenchIconKey,
  loadingIconKey: "RefreshCw" as const satisfies ScriptWorkbenchIconKey,
  className:
    "flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-600/30 border border-purple-500/50 text-[11px] text-purple-300 font-bold hover:bg-purple-600/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all disabled:opacity-30 flex-shrink-0",
} as const;

export const SCRIPTWORKBENCH_UI_HEADER = {
  containerClass: "px-6 py-4 flex items-center gap-6 border-b border-white/10 bg-[#0a0a0c] flex-shrink-0",
  projectTriggerClass: "flex items-center gap-2 cursor-pointer",
  projectNameClass: "text-[12px] font-semibold text-white truncate max-w-[150px]",
  chevronIconKey: "ChevronDown" as const satisfies ScriptWorkbenchIconKey,
  navClass: "flex-1 min-w-0 flex items-center justify-center px-2",
  navInnerClass: "flex w-full max-w-5xl items-stretch",
  stageSeparatorClass:
    "w-px flex-shrink-0 self-stretch my-1 bg-gradient-to-b from-transparent via-white/10 to-transparent",
  stageButtonBaseClass:
    "flex-1 min-w-0 px-2 py-2 text-center text-[11px] font-semibold leading-snug transition-colors",
  stageButtonInactiveClass: "text-gray-500 hover:text-gray-300",
} as const;

export const SCRIPTWORKBENCH_UI_SAVE_PROJECT = {
  id: "save_project" as const,
  label: "叙事沉淀",
  loadingLabel: "沉淀中...",
  iconKey: "Save" as const satisfies ScriptWorkbenchIconKey,
  className:
    "flex flex-shrink-0 items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded text-[11px] font-semibold text-white transition-colors",
} as const;

export const SCRIPTWORKBENCH_UI_PROJECT_DROPDOWN = {
  panelClass: "absolute left-0 top-full z-10 mt-2 w-64 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-lg p-2",
  emptyClass: "text-[11px] text-gray-500 p-2",
  rowClass: "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-[11px] text-white hover:bg-white/10",
  renameInputClass:
    "flex-1 min-w-0 bg-white/10 rounded px-2 py-1 text-[11px] text-white border border-cyan-500/50 outline-none",
  editIconKey: "Edit2" as const satisfies ScriptWorkbenchIconKey,
  deleteIconKey: "Trash2" as const satisfies ScriptWorkbenchIconKey,
  editButtonClass:
    "p-1 rounded text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-40",
  deleteButtonClass:
    "p-1 rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
} as const;
