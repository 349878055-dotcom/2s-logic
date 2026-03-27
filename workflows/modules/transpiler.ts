/**
 * =============================================================================
 * 剧本区工作流（TranspilerView · 叙事工作室）
 * =============================================================================
 *
 * 【这一文件管什么】
 *   只负责「剧本区」里各按钮触发的 **编排步骤**（先调什么 API、再 codec、再落盘）。
 *   不写界面：按钮文案 / 颜色 / class → `presentation/scriptworkbench_ui_specs.ts`（SCRIPTWORKBENCH_UI_*）。
 *   不写裸 HTTP 聚合入口 → `@/lib/atoms/transpiler_atoms`（项目 / 章节流 / SSE 等）。
 *
 * -----------------------------------------------------------------------------
 * 【叙事工作室建议怎么走】（操作顺序，便于你「从投喂到落盘」一眼看懂）
 * -----------------------------------------------------------------------------
 *
 *   1) 容器
 *        · 顶栏「开启新叙事」→ workflow_ScriptWorkbench_StartNewNarrative（等同新建项目）
 *        · 或进入页面时已 workflow_Transpiler_ListProjects，下拉切换 → workflow_Transpiler_LoadProject
 *
 *   2) 投喂正文
 *        · 「载入原稿」选文件 → 视图内解析 TXT/PDF/EPUB；扩展名分流用 workflow_ScriptWorkbench_ClassifyManuscriptFile
 *        · 正文进编辑器后，才谈得上后面几步
 *
 *   3) 叙事解构（顶栏阶段条：叙事解构 · 章节重组）
 *        · 点「架构显影」→ workflow_Transpiler_ExtractChapters（章节流式索引或同步降级 → 落盘）
 *
 *   4) 语义 / 人物（顶栏：语义浓缩 · 剧本演化）
 *        · 「众生造像」→ workflow_Transpiler_DiscoverCharacters
 *        · 用户在弹层确认后 → workflow_Transpiler_InitPersona 写入项目 persona
 *        · 按章「编译」或「全书编译」→ workflow_Transpiler_CompileChapter / workflow_Transpiler_CompileFullBook
 *          （再自动 save-segments）
 *
 *   5) 镜头 / 变体（顶栏：镜头转译 · 视觉对位）
 *        · 分镜单元里「生成变体」→ workflow_Transpiler_GenerateVariants
 *        · 点某一变体「采纳」→ workflow_Transpiler_AdoptVariant（仅改内存里的 unit，须再「叙事沉淀」）
 *
 *   6) 逻辑固化（顶栏：逻辑固化 · 指令生成）
 *        · 「万象定格」→ workflow_Transpiler_SolidifyAll
 *        · 「叙事沉淀」→ workflow_Transpiler_SaveProject（把当前整包状态 PATCH 到项目）
 *
 *   7) 管理 / 其它
 *        · 项目下拉里删除 → workflow_Transpiler_DeleteProject；重命名失焦 → workflow_Transpiler_RenameProject
 *        · Admin 种子库类界面 → workflow_Admin_SeedVaultSnapshot（Server Action，非 REST）
 *
 * 【dispatch 占位】workflow_Transpiler_UploadManuscript / workflow_ScriptWorkbench_LoadManuscriptUiBoundary
 *   与旧 action 字符串对齐；真正读文件在 TranspilerView，不进本文件。
 *
 * =============================================================================
 */
import { read_json_body } from "@/lib/toolkit/codec/json_codec";
import { decode_project_create_row, decode_projects_list_payload } from "@/lib/toolkit/codec/project_codec";
import { create_text_index_sse_folder, decode_text_index_sync_result } from "@/lib/toolkit/codec/text_index_codec";
import {
  map_api_row_to_script_project_dto,
  map_empty_script_project_from_create_row,
} from "@/lib/toolkit/transform/script_project_map";
import {
  delete_project,
  get_project,
  list_projects,
  patch_project,
  post_index_write_snapshot,
  post_project_create,
  post_text_index_stream,
  post_text_index_sync,
  pump_sse_data_json_events,
} from "@/lib/atoms/transpiler_atoms";
import {
  scriptworkbenchNextIsolatedTextLabel,
  type ScriptWorkbenchManuscriptKind,
} from "@/workflows/presentation/scriptworkbench";
import * as tools from "@/lib/toolkit/compat_tools";
import type { DiscoverPersonaListItem } from "@/lib/toolkit/compat_tools";
import type { ProcessUnit } from "@/lib/contracts/script_workbook";
import type { NovelChapter } from "@/lib/core/store";
import type {
  TranspilerCompileChapterPayload,
  TranspilerCompileFullBookPayload,
  TranspilerExtractChaptersResult,
  TranspilerExtractPayload,
  TranspilerGenerateVariantsPayload,
  TranspilerSolidifyPayload,
} from "./hub/types";

/** 人类可读的「按钮 ↔ 工作流」总表（与 TranspilerView 顶栏、侧栏、下拉一致）。 */
export const WORKFLOW_ROUTE_DOC_PAGE5_TRANSPILER = `
【顶栏 · 第一行工具条】
  「开启新叙事」········ workflow_ScriptWorkbench_StartNewNarrative（UI：SCRIPTWORKBENCH_UI_START_NEW_NARRATIVE）
  「载入原稿」········ 视图内选档 + Classify；扩展名 → workflow_ScriptWorkbench_ClassifyManuscriptFile（UI：SCRIPTWORKBENCH_UI_LOAD_MANUSCRIPT）
  叙事正文区·········· 仅 UI（SCRIPTWORKBENCH_UI_NARRATIVE_INPUT）；不入工作流
  「架构显影」········ workflow_Transpiler_ExtractChapters（UI：SCRIPTWORKBENCH_UI_EXTRACT_CHAPTERS）
  「众生造像」········ workflow_Transpiler_DiscoverCharacters(inputText, chapters, projectId?)（须已架构显影；UI：SCRIPTWORKBENCH_UI_DISCOVER_CHARACTERS）
  「万象定格」········ workflow_Transpiler_SolidifyAll（UI：SCRIPTWORKBENCH_UI_SOLIDIFY_ALL）

【顶栏 · 项目区】
  点击项目名打开下拉···· 列表数据来自进入页 workflow_Transpiler_ListProjects（UI：SCRIPTWORKBENCH_UI_HEADER / PROJECT_DROPDOWN）
  切换未加载项目······ workflow_Transpiler_LoadProject
  下拉内重命名失焦···· workflow_Transpiler_RenameProject
  下拉内删除·········· workflow_Transpiler_DeleteProject
  「叙事沉淀」········ workflow_Transpiler_SaveProject（UI：SCRIPTWORKBENCH_UI_SAVE_PROJECT）

【顶栏 · 四阶段条】（SCRIPTWORKBENCH_UI_PIPELINE_STAGES，仅导航语义；具体仍由上面按钮触发）
  叙事解构 · 章节重组 → 典型：载入原稿 + 架构显影
  语义浓缩 · 剧本演化 → 典型：众生造像、InitPersona、编译本章/全书
  镜头转译 · 视觉对位 → 典型：分镜单元生成变体、采纳变体
  逻辑固化 · 指令生成 → 典型：万象定格、叙事沉淀

【兼容 / 底层别名】
  workflow_Transpiler_NewProject ··· 等同「开启新叙事」底层 POST 项目
  workflow_Transpiler_UploadManuscript · dispatch 占位；正文在 View

【Admin】
  种子库快照 ·········· workflow_Admin_SeedVaultSnapshot
`.trim();

/**
 * 【载入原稿 · 选档之后】
 * 对应：file input 已选文件名；无网络请求。
 * 视图据返回值选用 TXT / PDF / EPUB 解析器；不支持的格式见 SCRIPTWORKBENCH_MANUSCRIPT_REJECT_MESSAGE。
 */
export function workflow_ScriptWorkbench_ClassifyManuscriptFile(fileName: string): ScriptWorkbenchManuscriptKind {
  const n = String(fileName ?? "").toLowerCase();
  if (n.endsWith(".txt")) return "txt";
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".epub")) return "epub";
  return "unsupported";
}

/**
 * 【顶栏按钮 · 开启新叙事】
 * UI 文案见 SCRIPTWORKBENCH_UI_START_NEW_NARRATIVE。
 * 内部转调 workflow_Transpiler_NewProject：POST /api/projects，得到空壳 ScriptProjectDTO。
 */
export async function workflow_ScriptWorkbench_StartNewNarrative(原材料: { ownerId: string; name: string }) {
  return workflow_Transpiler_NewProject(原材料);
}

/**
 * 【载入原稿 · 编排边界占位】
 * 与 dispatch TRANSPILER_UPLOAD_MANUSCRIPT 对齐文档；真实读文件在 TranspilerView。
 */
export function workflow_ScriptWorkbench_LoadManuscriptUiBoundary() {
  return tools.toolPlaceholderNoop();
}

/**
 * 【新建项目 · 底层】
 * 与顶栏「开启新叙事」同一套；也可被架构显影在无当前项目时隐式新建项目（自动起名「孤岛文本 xx」）。
 */
export async function workflow_Transpiler_NewProject(原材料: { ownerId: string; name: string }) {
  const createRes = await post_project_create(原材料.ownerId, 原材料.name);
  const createJson = await read_json_body(createRes);
  if (!createRes.ok) {
    throw new Error((createJson as { error?: string }).error ?? "项目创建失败");
  }
  const row = decode_project_create_row(createJson);
  return map_empty_script_project_from_create_row(row);
}

/**
 * 【项目下拉 · 切换到尚未在内存里的项目】
 * GET /api/projects/:id，codec + map 成 ScriptProjectDTO。
 */
export async function workflow_Transpiler_LoadProject(projectId: string) {
  const res = await get_project(projectId);
  const data = await read_json_body(res);
  if (!res.ok) return null;
  const d = data as { project?: Parameters<typeof map_api_row_to_script_project_dto>[0] };
  if (!d.project) return null;
  return map_api_row_to_script_project_dto(d.project);
}

/**
 * 【顶栏 · 叙事沉淀】
 * PATCH 整包（units、chapters、inputText 等由视图组 body）。
 */
export async function workflow_Transpiler_SaveProject(projectId: string, body: Record<string, unknown>) {
  await patch_project(projectId, body);
}

/**
 * 【项目下拉 · 删除当前项目】
 * DELETE /api/projects/:id。
 */
export async function workflow_Transpiler_DeleteProject(projectId: string) {
  const res = await delete_project(projectId);
  return res.ok;
}

/**
 * 【进入剧本区 · useEffect】
 * GET /api/projects?ownerId=…，解码为项目列表数组。
 */
export async function workflow_Transpiler_ListProjects(ownerId: string) {
  const res = await list_projects(ownerId);
  const json = await read_json_body(res);
  return decode_projects_list_payload(json);
}

/**
 * 【Admin · 种子库 / 审计类页面】
 * 非 REST；Server Action 读全局种子缓存快照。
 */
export async function workflow_Admin_SeedVaultSnapshot() {
  return tools.toolServerGetSeedVaultSnapshot();
}

/**
 * 【顶栏工具条 · 架构显影】
 * UI：SCRIPTWORKBENCH_UI_EXTRACT_CHAPTERS（与 WF_PRESENTATION_ARCH_IMAGING 文案一致）。
 * 步骤概要：若无项目则先建项目 → POST 章节索引（多策略识别章节行 + 章内 subBlocks 物理切片）→ save-index → PATCH inputText。
 */
export async function workflow_Transpiler_ExtractChapters(
  原材料: TranspilerExtractPayload
): Promise<TranspilerExtractChaptersResult> {
  const full = 原材料.fullText.trim();
  if (!full) return { ok: false, error: "请提供小说文本" };

  let currentProjectId = 原材料.activeProjectId;
  let createdProject: null | { id: string; name: string } = null;

  if (!currentProjectId) {
    const defaultName = scriptworkbenchNextIsolatedTextLabel(原材料.projectsCount);
    const createRes = await post_project_create(原材料.ownerId, defaultName);
    const createJson = await read_json_body(createRes);
    if (!createRes.ok) {
      return { ok: false, error: (createJson as { error?: string }).error ?? "项目创建失败" };
    }
    try {
      const row = decode_project_create_row(createJson);
      createdProject = { id: row.id, name: row.name };
      currentProjectId = row.id;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "项目创建失败" };
    }
  }

  const streamRes = await post_text_index_stream(full);

  if (!streamRes.ok || !streamRes.body) {
    const syncFallbackLog = "流式接口不可用，改用普通接口...";
    原材料.onProgress?.(0, syncFallbackLog);
    const syncRes = await post_text_index_sync(full);
    const syncJson = await read_json_body(syncRes);
    const parsed = decode_text_index_sync_result(syncRes, syncJson);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    const chapters = parsed.blocks;

    const saveRes = await post_index_write_snapshot({ projectId: currentProjectId, chapters });
    const saveJson = await read_json_body(saveRes);
    if (!saveRes.ok) {
      return { ok: false, error: (saveJson as { error?: string }).error ?? "索引落盘失败" };
    }

    await patch_project(currentProjectId, { inputText: full });

    return {
      ok: true,
      chapters,
      projectId: currentProjectId,
      fullText: full,
      createdProject,
      usedSyncFallback: true,
      syncFallbackLog,
    };
  }

  const folder = create_text_index_sse_folder(原材料.onProgress);
  await pump_sse_data_json_events(streamRes.body, (j) => folder.ingest(j));
  const folded = folder.finish();
  if (!folded.ok) return { ok: false, error: folded.error };
  const chapters = folded.blocks;

  const saveRes = await post_index_write_snapshot({ projectId: currentProjectId, chapters });
  const saveJson = await read_json_body(saveRes);
  if (!saveRes.ok) {
    return { ok: false, error: (saveJson as { error?: string }).error ?? "索引落盘失败" };
  }

  await patch_project(currentProjectId, { inputText: full });

  return {
    ok: true,
    chapters,
    projectId: currentProjectId,
    fullText: full,
    createdProject,
    usedSyncFallback: false,
  };
}

/**
 * 【顶栏工具条 · 众生造像】
 * UI：SCRIPTWORKBENCH_UI_DISCOVER_CHARACTERS。
 * POST discover-characters（`inputText` + `chapters` / L2，可选 `projectId` 落盘 `coref_spans`）；返回角色列表供弹层展示。
 */
export async function workflow_Transpiler_DiscoverCharacters(
  inputText: string,
  chapters: NovelChapter[],
  projectId?: string,
) {
  const res = await tools.toolApiPostDiscoverCharactersJson(inputText, chapters, projectId);
  const data = (await read_json_body(res)) as {
    characters?: Array<{
      name: string;
      summary?: string;
      bio?: string;
      entityId?: string;
      personaId?: string;
    }>;
    corefSpanCount?: number;
    error?: string;
  };
  if (!res.ok) return { ok: false as const, error: data.error ?? `HTTP ${res.status}` };

  return {
    ok: true as const,
    list: tools.ensureDiscoverPersonaIds(tools.toolMapDiscoverCharactersApiToList(data.characters)),
  };
}

/**
 * 【众生造像确认后】
 * POST init-persona，把选定角色写入当前项目。
 */
export async function workflow_Transpiler_InitPersona(
  projectId: string,
  characters: DiscoverPersonaListItem[],
) {
  await tools.toolApiPostInitPersonaJson(projectId, characters);
}

/**
 * 【顶栏工具条 · 万象定格】
 * UI：SCRIPTWORKBENCH_UI_SOLIDIFY_ALL。
 * POST solidify-all。
 */
export async function workflow_Transpiler_SolidifyAll(原材料: TranspilerSolidifyPayload) {
  return tools.toolApiPostSolidifyAllJson(原材料);
}

/**
 * 【章节目录 · 编译本章】
 * POST compile（单章）→ 坐标偏移 → POST save-segments。
 */
export async function workflow_Transpiler_CompileChapter(原材料: TranspilerCompileChapterPayload) {
  const res = await tools.toolApiPostCompileChapterJson({
    chapterText: 原材料.chapterText,
    projectId: 原材料.projectId,
    chapterIndex: 原材料.chapterIndex,
    chapterStartIndex: 原材料.chapterStartIndex,
    charName: 原材料.charName,
  });
  const data = (await read_json_body(res)) as {
    units?: ProcessUnit[];
    primarySeedId?: string | null;
    lockProgress?: number;
    error?: string;
  };
  const list = data.units ?? [];
  if (!res.ok) return { ok: false as const, error: data.error ?? `HTTP ${res.status}` };
  if (list.length === 0) return { ok: false as const, error: data.error ?? "编译完成但未提取到任何逻辑片段" };

  const adjusted = tools.toolOffsetProcessUnitTextRanges(list, 原材料.chapterStartIndex);

  await tools.toolApiPostSaveSegmentsJson(原材料.projectId, 原材料.chapterIndex, adjusted);
  return {
    ok: true as const,
    units: adjusted,
    primarySeedId: tools.toolResolvePrimarySeedId(data.primarySeedId, adjusted.length) ?? undefined,
    lockProgress: data.lockProgress,
  };
}

/**
 * 【脱水流程 · 全书编译】
 * POST compile（全书）→ save-segments（chapterIndex = -1）。
 */
export async function workflow_Transpiler_CompileFullBook(原材料: TranspilerCompileFullBookPayload) {
  const res = await tools.toolApiPostCompileFullBookJson(原材料);
  const data = (await read_json_body(res)) as {
    units?: ProcessUnit[];
    primarySeedId?: string | null;
    lockProgress?: number;
    error?: string;
  };
  const list = data.units ?? [];
  if (!res.ok || (list.length === 0 && data.error))
    return { ok: false as const, error: data.error ?? `HTTP ${res.status}` };

  await tools.toolApiPostSaveSegmentsJson(原材料.projectId, -1, list);
  return {
    ok: true as const,
    units: list,
    primarySeedId: tools.toolResolvePrimarySeedId(data.primarySeedId, list.length) ?? undefined,
    lockProgress: data.lockProgress,
  };
}

/**
 * 【分镜单元 · 生成变体】
 * POST /api/generate（无 vary 或 vary+seed）；结果映射为 { text, state }[]。
 */
export async function workflow_Transpiler_GenerateVariants(原材料: TranspilerGenerateVariantsPayload) {
  const results = await tools.toolRequestContentStreamForVariants({
    prompt: 原材料.prompt,
    originalText: 原材料.originalText,
    userPrompt: 原材料.userPrompt,
    ...(原材料.hasVary && 原材料.currentSeedId
      ? { action: "vary" as const, seed: 原材料.currentSeedId, baseState: 原材料.baseState }
      : {}),
  });

  return tools.toolMapStreamResultsToVariantStates(results);
}

/**
 * 【分镜单元 · 采纳某一变体】
 * 纯内存合并进 ProcessUnit；**不会**自动 PATCH 项目，须用户再点「叙事沉淀」。
 */
export function workflow_Transpiler_AdoptVariant(unit: ProcessUnit, variantIndex: number) {
  return tools.toolMergeAdoptedVariantIntoUnit(unit, variantIndex);
}

/**
 * 【项目下拉 · 重命名输入框失焦】
 * PATCH 项目 name。
 */
export async function workflow_Transpiler_RenameProject(projectId: string, name: string) {
  await patch_project(projectId, { name });
}

/**
 * 【dispatch 兼容 · 载入原稿】
 * 占位；语义同 workflow_ScriptWorkbench_LoadManuscriptUiBoundary。
 */
export function workflow_Transpiler_UploadManuscript() {
  return workflow_ScriptWorkbench_LoadManuscriptUiBoundary();
}
