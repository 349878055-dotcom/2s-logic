/**
 * 综合区 · 旧 action 字符串调度（`dispatchWorkflow`）
 */
import type { ProcessUnit } from "@/lib/contracts/script_workbook";
import type { NovelChapter } from "@/lib/core/store";
import type {
  EditRewritePayload,
  PayloadDefault,
  TranspilerCompileChapterPayload,
  TranspilerCompileFullBookPayload,
  TranspilerExtractPayload,
  TranspilerGenerateVariantsPayload,
  TranspilerSolidifyPayload,
} from "./types";
import { workflow_Explore_PrepareRewriteContext } from "../explore";
import {
  workflow_Create_AdoptStream,
  workflow_Create_GenerateQuad,
  workflow_Create_LoadHistory,
  workflow_Create_VaryCard,
} from "../create";
import {
  workflow_Edit_FetchSeedSnapshot,
  workflow_Edit_RewriteByVariant,
  workflow_Edit_RewriteFragment,
  workflow_Edit_UpscaleFragment,
} from "../edit";
import { workflow_Organize_CommitCharacterProfile } from "../organize";
import {
  workflow_Admin_SeedVaultSnapshot,
  workflow_ScriptWorkbench_StartNewNarrative,
  workflow_Transpiler_AdoptVariant,
  workflow_Transpiler_CompileChapter,
  workflow_Transpiler_CompileFullBook,
  workflow_Transpiler_DeleteProject,
  workflow_Transpiler_DiscoverCharacters,
  workflow_Transpiler_ExtractChapters,
  workflow_Transpiler_GenerateVariants,
  workflow_Transpiler_InitPersona,
  workflow_Transpiler_ListProjects,
  workflow_Transpiler_LoadProject,
  workflow_Transpiler_NewProject,
  workflow_Transpiler_RenameProject,
  workflow_Transpiler_SaveProject,
  workflow_Transpiler_SolidifyAll,
  workflow_Transpiler_UploadManuscript,
} from "../transpiler";
import {
  workflow_Style_CompleteCharacterCalibration,
  workflow_Style_CompleteEnvironmentCalibration,
} from "../style";
import { workflow_Task_LabRankSession } from "../task";

export type WorkflowRequest =
  | { action: "CREATE_GENERATE_QUAD"; payload: Parameters<typeof workflow_Create_GenerateQuad>[0] }
  | { action: "CREATE_VARY_CARD"; payload: Parameters<typeof workflow_Create_VaryCard>[0] }
  | { action: "CREATE_ADOPT_STREAM"; payload: Parameters<typeof workflow_Create_AdoptStream>[0] }
  | { action: "CREATE_LOAD_HISTORY"; payload: Record<string, never> }
  | { action: "EDIT_FETCH_SEED_SNAPSHOT"; payload: Parameters<typeof workflow_Edit_FetchSeedSnapshot>[0] }
  | { action: "EDIT_REWRITE_FRAGMENT"; payload: EditRewritePayload }
  | { action: "EDIT_REWRITE_BY_VARIANT"; payload: EditRewritePayload }
  | { action: "EDIT_UPSCALE_FRAGMENT"; payload: EditRewritePayload }
  | { action: "EXPLORE_PREPARE_REWRITE_CONTEXT"; payload: PayloadDefault }
  | { action: "TRANSPILER_EXTRACT_CHAPTERS"; payload: TranspilerExtractPayload }
  | { action: "TRANSPILER_NEW_PROJECT"; payload: Parameters<typeof workflow_Transpiler_NewProject>[0] }
  | { action: "SCRIPTWORKBENCH_START_NEW_NARRATIVE"; payload: Parameters<typeof workflow_ScriptWorkbench_StartNewNarrative>[0] }
  | { action: "TRANSPILER_LIST_PROJECTS"; payload: { ownerId: string } }
  | { action: "TRANSPILER_LOAD_PROJECT"; payload: { projectId: string } }
  | { action: "TRANSPILER_SAVE_PROJECT"; payload: { projectId: string; body: Record<string, unknown> } }
  | { action: "TRANSPILER_DELETE_PROJECT"; payload: { projectId: string } }
  | { action: "TRANSPILER_DISCOVER_CHARACTERS"; payload: { inputText: string; chapters: NovelChapter[] } }
  | { action: "TRANSPILER_INIT_PERSONA"; payload: { projectId: string; characters: Array<{ name: string; summary: string }> } }
  | { action: "TRANSPILER_SOLIDIFY_ALL"; payload: TranspilerSolidifyPayload }
  | { action: "TRANSPILER_COMPILE_CHAPTER"; payload: TranspilerCompileChapterPayload }
  | { action: "TRANSPILER_COMPILE_FULL_BOOK"; payload: TranspilerCompileFullBookPayload }
  | { action: "TRANSPILER_GENERATE_VARIANTS"; payload: TranspilerGenerateVariantsPayload }
  | { action: "TRANSPILER_ADOPT_VARIANT"; payload: { unit: ProcessUnit; variantIndex: number } }
  | { action: "TRANSPILER_UPLOAD_MANUSCRIPT"; payload: PayloadDefault }
  | { action: "TRANSPILER_RENAME_PROJECT"; payload: { projectId: string; name: string } }
  | { action: "ORGANIZE_COMMIT_CHARACTER_PROFILE"; payload: { snapshot: unknown } }
  | { action: "STYLE_COMPLETE_CHARACTER_CALIBRATION"; payload: PayloadDefault }
  | { action: "STYLE_COMPLETE_ENVIRONMENT_CALIBRATION"; payload: PayloadDefault }
  | { action: "TASK_LAB_RANK_SESSION"; payload: PayloadDefault }
  | { action: "ADMIN_SEED_VAULT_SNAPSHOT"; payload: PayloadDefault };

export type WorkflowAction = WorkflowRequest["action"];

export async function dispatchWorkflow(request: WorkflowRequest): Promise<unknown> {
  const p = request.payload;

  switch (request.action) {
    case "CREATE_GENERATE_QUAD":
      return workflow_Create_GenerateQuad(request.payload);
    case "CREATE_VARY_CARD":
      return workflow_Create_VaryCard(request.payload);
    case "CREATE_ADOPT_STREAM":
      return workflow_Create_AdoptStream(request.payload);
    case "CREATE_LOAD_HISTORY":
      return workflow_Create_LoadHistory();

    case "EDIT_FETCH_SEED_SNAPSHOT":
      return workflow_Edit_FetchSeedSnapshot(p as Parameters<typeof workflow_Edit_FetchSeedSnapshot>[0]);
    case "EDIT_REWRITE_FRAGMENT":
      return workflow_Edit_RewriteFragment(p as EditRewritePayload);
    case "EDIT_REWRITE_BY_VARIANT":
      return workflow_Edit_RewriteByVariant(p as EditRewritePayload);
    case "EDIT_UPSCALE_FRAGMENT":
      return workflow_Edit_UpscaleFragment(p as EditRewritePayload);

    case "EXPLORE_PREPARE_REWRITE_CONTEXT":
      return workflow_Explore_PrepareRewriteContext();

    case "TRANSPILER_LIST_PROJECTS":
      return workflow_Transpiler_ListProjects((p as { ownerId: string }).ownerId);
    case "TRANSPILER_NEW_PROJECT":
      return workflow_Transpiler_NewProject(p as Parameters<typeof workflow_Transpiler_NewProject>[0]);
    case "SCRIPTWORKBENCH_START_NEW_NARRATIVE":
      return workflow_ScriptWorkbench_StartNewNarrative(
        p as Parameters<typeof workflow_ScriptWorkbench_StartNewNarrative>[0]
      );
    case "TRANSPILER_LOAD_PROJECT":
      return workflow_Transpiler_LoadProject((p as { projectId: string }).projectId);
    case "TRANSPILER_SAVE_PROJECT":
      return workflow_Transpiler_SaveProject(
        (p as { projectId: string }).projectId,
        (p as { body: Record<string, unknown> }).body
      );
    case "TRANSPILER_DELETE_PROJECT":
      return workflow_Transpiler_DeleteProject((p as { projectId: string }).projectId);
    case "TRANSPILER_RENAME_PROJECT":
      return workflow_Transpiler_RenameProject(
        (p as { projectId: string }).projectId,
        (p as { name: string }).name
      );
    case "TRANSPILER_EXTRACT_CHAPTERS":
      return workflow_Transpiler_ExtractChapters(p as TranspilerExtractPayload);
    case "TRANSPILER_DISCOVER_CHARACTERS": {
      const d = p as { inputText: string; chapters: NovelChapter[]; projectId?: string };
      return workflow_Transpiler_DiscoverCharacters(d.inputText, d.chapters, d.projectId);
    }
    case "TRANSPILER_INIT_PERSONA":
      return workflow_Transpiler_InitPersona(
        (p as { projectId: string }).projectId,
        (p as { characters: Array<{ name: string; summary: string }> }).characters
      );
    case "TRANSPILER_SOLIDIFY_ALL":
      return workflow_Transpiler_SolidifyAll(p as TranspilerSolidifyPayload);
    case "TRANSPILER_COMPILE_CHAPTER":
      return workflow_Transpiler_CompileChapter(p as TranspilerCompileChapterPayload);
    case "TRANSPILER_COMPILE_FULL_BOOK":
      return workflow_Transpiler_CompileFullBook(p as TranspilerCompileFullBookPayload);
    case "TRANSPILER_GENERATE_VARIANTS":
      return workflow_Transpiler_GenerateVariants(p as TranspilerGenerateVariantsPayload);
    case "TRANSPILER_ADOPT_VARIANT": {
      const { unit, variantIndex } = p as { unit: ProcessUnit; variantIndex: number };
      return workflow_Transpiler_AdoptVariant(unit, variantIndex);
    }
    case "TRANSPILER_UPLOAD_MANUSCRIPT":
      return workflow_Transpiler_UploadManuscript();

    case "ORGANIZE_COMMIT_CHARACTER_PROFILE":
      return workflow_Organize_CommitCharacterProfile(p as { snapshot: unknown });

    case "STYLE_COMPLETE_CHARACTER_CALIBRATION":
      return workflow_Style_CompleteCharacterCalibration();
    case "STYLE_COMPLETE_ENVIRONMENT_CALIBRATION":
      return workflow_Style_CompleteEnvironmentCalibration();

    case "TASK_LAB_RANK_SESSION":
      return workflow_Task_LabRankSession(p);

    case "ADMIN_SEED_VAULT_SNAPSHOT":
      return workflow_Admin_SeedVaultSnapshot();

    default: {
      const _漏单检查: never = request;
      return _漏单检查;
    }
  }
}
