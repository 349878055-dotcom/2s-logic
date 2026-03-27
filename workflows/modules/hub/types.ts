/**
 * 综合区 · 跨页面共享的请求体 / 结果类型（无 `workflow_*` 实现）。
 */
import type { NovelChapter, SeedState } from "@/lib/core/store";
import type { DoesValues, ElevenDimensions } from "@/lib/core/types";

/** 编辑区：POST /api/generate vary 的请求体（与 tools.toolApiPostEditRewriteVaryJson 一致） */
export type EditRewritePayload = {
  seed: string;
  prompt: string;
  originalText: string;
  manualDoes?: DoesValues;
  target?: number;
};

export type TranspilerExtractPayload = {
  fullText: string;
  ownerId: string;
  projectsCount: number;
  activeProjectId: string | null;
  onProgress?: (progress: number, log: string) => void;
};

/** 「架构显影」工作流输出（供视图摊平到 React state，不在视图里拼 API） */
export type TranspilerExtractChaptersResult =
  | {
      ok: true;
      chapters: NovelChapter[];
      projectId: string;
      fullText: string;
      createdProject: null | { id: string; name: string };
      usedSyncFallback: boolean;
      syncFallbackLog?: string;
    }
  | { ok: false; error: string };

export type TranspilerCompileChapterPayload = {
  chapterText: string;
  projectId: string;
  chapterIndex: number;
  chapterStartIndex: number;
  charName: string;
};

export type TranspilerCompileFullBookPayload = { inputText: string; projectId: string };

export type TranspilerGenerateVariantsPayload = {
  prompt: string;
  originalText: string;
  userPrompt?: string;
  currentSeedId: string | null;
  baseState: SeedState;
  hasVary: boolean;
};

export type TranspilerSolidifyPayload = {
  projectId: string;
  personaNames: string[];
  fullText: string;
};

export interface PayloadDefault {
  [key: string]: any;
}
