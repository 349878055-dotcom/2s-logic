/** 剧本区 UI 类型：供表现层 specs 与视图引用（无 I/O）。 */

export type ScriptWorkbenchIconKey =
  | "Plus"
  | "Upload"
  | "Folder"
  | "RefreshCw"
  | "Sparkles"
  | "Save"
  | "Edit2"
  | "Trash2"
  | "ChevronDown"
  | "X";

export type ScriptWorkbenchPipelineStage = "narrative" | "semantic" | "lens" | "logic";

export type ScriptWorkbenchManuscriptKind = "txt" | "pdf" | "epub" | "unsupported";
