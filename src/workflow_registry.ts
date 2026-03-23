/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/workflow_registry.ts
 * =====================================================================
 * 全厂总调度室：三层——原料从哪来 → 工单绑哪条传送带 → 车间怎么加工、成品往哪送。
 * 具体 HTTP/引擎见 lib/workflow/fulfillment.ts；本文件只做分拣与派单。
 * =====================================================================
 */

import type { ElevenDimensions } from "@/lib/core/types";
import * as wf from "@/lib/workflow/fulfillment";

// ═══════════════════════════════════════════════════════════════════════════
// 第一层：原材料清单（数据哪里来）
// ═══════════════════════════════════════════════════════════════════════════

export interface PayloadDefault {
  [key: string]: any;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 1：创作台 — 造四宫格、拉历史、变体、采纳
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface PayloadCreateGenerateQuad {
  sourceText: string;
  manualOverrides?: Partial<ElevenDimensions>;
  narrativeContext: string;
  /** 来自：挂载参考片段时带来的父 seed（可无） */
  referenceSeed?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 2～8：占位（字段写在 PayloadDefault 筐里随单走）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ═══════════════════════════════════════════════════════════════════════════
// 第二层：工单分拣处
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowRequest =
  | { action: "CREATE_GENERATE_QUAD"; payload: PayloadCreateGenerateQuad }
  | { action: "CREATE_LOAD_HISTORY"; payload: PayloadDefault }
  | { action: "CREATE_VARY_CARD"; payload: PayloadDefault }
  | { action: "CREATE_ADOPT_STREAM"; payload: PayloadDefault }
  | { action: "EDIT_FETCH_SEED_SNAPSHOT"; payload: PayloadDefault }
  | { action: "EDIT_REWRITE_FRAGMENT"; payload: PayloadDefault }
  | { action: "EDIT_REWRITE_BY_VARIANT"; payload: PayloadDefault }
  | { action: "EDIT_UPSCALE_FRAGMENT"; payload: PayloadDefault }
  | { action: "EXPLORE_PREPARE_REWRITE_CONTEXT"; payload: PayloadDefault }
  | { action: "TRANSPILER_EXTRACT_CHAPTERS"; payload: PayloadDefault }
  | { action: "TRANSPILER_NEW_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_LIST_PROJECTS"; payload: PayloadDefault }
  | { action: "TRANSPILER_LOAD_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_SAVE_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_DELETE_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_DISCOVER_CHARACTERS"; payload: PayloadDefault }
  | { action: "TRANSPILER_INIT_PERSONA"; payload: PayloadDefault }
  | { action: "TRANSPILER_SOLIDIFY_ALL"; payload: PayloadDefault }
  | { action: "TRANSPILER_COMPILE_CHAPTER"; payload: PayloadDefault }
  | { action: "TRANSPILER_COMPILE_FULL_BOOK"; payload: PayloadDefault }
  | { action: "TRANSPILER_GENERATE_VARIANTS"; payload: PayloadDefault }
  | { action: "TRANSPILER_ADOPT_VARIANT"; payload: PayloadDefault }
  | { action: "TRANSPILER_UPLOAD_MANUSCRIPT"; payload: PayloadDefault }
  | { action: "TRANSPILER_RENAME_PROJECT"; payload: PayloadDefault }
  | { action: "ORGANIZE_COMMIT_CHARACTER_PROFILE"; payload: PayloadDefault }
  | { action: "STYLE_COMPLETE_CHARACTER_CALIBRATION"; payload: PayloadDefault }
  | { action: "STYLE_COMPLETE_ENVIRONMENT_CALIBRATION"; payload: PayloadDefault }
  | { action: "TASK_LAB_RANK_SESSION"; payload: PayloadDefault }
  | { action: "ADMIN_SEED_VAULT_SNAPSHOT"; payload: PayloadDefault };

export type WorkflowAction = WorkflowRequest["action"];

// ═══════════════════════════════════════════════════════════════════════════
// 第三层：自动化流水线 — 总车间主任只派活给 fulfillment
// ═══════════════════════════════════════════════════════════════════════════

export async function dispatchWorkflow(request: WorkflowRequest): Promise<unknown> {
  const p = request.payload;

  switch (request.action) {
    case "CREATE_GENERATE_QUAD":
      return wf.fulfillCreateGenerateQuad({
        ...request.payload,
        referenceSeed: (p as PayloadCreateGenerateQuad).referenceSeed,
      });

    case "CREATE_LOAD_HISTORY":
      return wf.fulfillCreateLoadHistory();

    case "CREATE_VARY_CARD":
      return wf.fulfillCreateVaryCard(p as { prompt: string; target: number; seed: string });

    case "CREATE_ADOPT_STREAM":
      return wf.fulfillCreateAdoptStream(p as { seedId: string; tempState: import("@/lib/core/store").SeedState; prompt?: string });

    case "EDIT_FETCH_SEED_SNAPSHOT":
      return wf.fulfillEditFetchSeedSnapshot(String((p as { seedId: string }).seedId));

    case "EDIT_REWRITE_FRAGMENT":
    case "EDIT_REWRITE_BY_VARIANT":
    case "EDIT_UPSCALE_FRAGMENT":
      return wf.fulfillEditRewrite(p as Parameters<typeof wf.fulfillEditRewrite>[0]);

    case "EXPLORE_PREPARE_REWRITE_CONTEXT":
      return undefined;

    case "TRANSPILER_LIST_PROJECTS":
      return wf.fulfillTranspilerListProjects(String((p as { ownerId: string }).ownerId));

    case "TRANSPILER_NEW_PROJECT":
      return wf.fulfillTranspilerNewProject(p as { ownerId: string; name: string });

    case "TRANSPILER_LOAD_PROJECT":
      return wf.fulfillTranspilerLoadProject(String((p as { projectId: string }).projectId));

    case "TRANSPILER_SAVE_PROJECT":
      return wf.fulfillTranspilerSaveProject(String((p as { projectId: string }).projectId), (p as { body: Record<string, unknown> }).body);

    case "TRANSPILER_DELETE_PROJECT":
      return wf.fulfillTranspilerDeleteProject(String((p as { projectId: string }).projectId));

    case "TRANSPILER_RENAME_PROJECT":
      return wf.fulfillTranspilerRenameProject(
        String((p as { projectId: string }).projectId),
        String((p as { name: string }).name)
      );

    case "TRANSPILER_EXTRACT_CHAPTERS":
      return wf.fulfillTranspilerExtractChapters(
        p as {
          fullText: string;
          ownerId: string;
          projectsCount: number;
          activeProjectId: string | null;
          onProgress?: (progress: number, log: string) => void;
        }
      );

    case "TRANSPILER_DISCOVER_CHARACTERS":
      return wf.fulfillTranspilerDiscoverCharacters(String((p as { inputText: string }).inputText));

    case "TRANSPILER_INIT_PERSONA":
      return wf.fulfillTranspilerInitPersona(
        String((p as { projectId: string }).projectId),
        (p as { characters: Array<{ name: string; summary: string }> }).characters
      );

    case "TRANSPILER_SOLIDIFY_ALL":
      return wf.fulfillTranspilerSolidifyAll(
        p as { projectId: string; personaNames: string[]; fullText: string }
      );

    case "TRANSPILER_COMPILE_CHAPTER":
      return wf.fulfillTranspilerCompileChapter(
        p as {
          chapterText: string;
          projectId: string;
          chapterIndex: number;
          chapterStartIndex: number;
          charName: string;
        }
      );

    case "TRANSPILER_COMPILE_FULL_BOOK":
      return wf.fulfillTranspilerCompileFullBook(p as { inputText: string; projectId: string });

    case "TRANSPILER_GENERATE_VARIANTS":
      return wf.fulfillTranspilerGenerateVariants(
        p as {
          prompt: string;
          originalText: string;
          userPrompt?: string;
          currentSeedId: string | null;
          baseState: import("@/lib/core/store").SeedState;
          hasVary: boolean;
        }
      );

    case "TRANSPILER_ADOPT_VARIANT":
      return wf.fulfillTranspilerAdoptVariant(
        (p as { unit: import("@/lib/workflow/fulfillment").ProcessUnit }).unit,
        Number((p as { variantIndex: number }).variantIndex)
      );

    case "TRANSPILER_UPLOAD_MANUSCRIPT":
      return undefined;

    case "ORGANIZE_COMMIT_CHARACTER_PROFILE":
      return { ok: true };

    case "STYLE_COMPLETE_CHARACTER_CALIBRATION":
    case "STYLE_COMPLETE_ENVIRONMENT_CALIBRATION":
      return undefined;

    case "TASK_LAB_RANK_SESSION":
      return { ok: true };

    case "ADMIN_SEED_VAULT_SNAPSHOT":
      return wf.fulfillAdminSeedVaultSnapshot();

    default: {
      const _漏单检查: never = request;
      return _漏单检查;
    }
  }
}
