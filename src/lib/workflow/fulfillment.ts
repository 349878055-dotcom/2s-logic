/**
 * ⚛️ 总厂执行层：所有 HTTP / 引擎调用集中于此，views 禁止直连。
 */
import type { ContentStream, DoesValues } from "@/lib/core/types";
import type { SeedState, NovelChapter } from "@/lib/core/store";
import { requestContentStream, requestAdopt } from "@/lib/engines/utils";
import { seedToSoraPrompt } from "@/lib/engines/will_engine";
import { commitAdoption } from "@/lib/engines/engine_evolving";
import { getSeedVault, type SeedVaultEntry } from "@/lib/engines/actions/seedVault";
import { extractSeedLogic } from "@/lib/engines/seed_engine";
import { convert11DToLex } from "@/lib/engines/lex_adapter";
import { buildRenderPrompt } from "@/lib/engines/render_engine";
import type { PayloadCreateGenerateQuad } from "@/workflow_registry";

// ── 与剧本区 API 对齐的最小单元类型（原 TranspilerView 内定义）────────
export interface ProcessUnit {
  id: string;
  novel: string;
  script: string;
  storyboard: string;
  seedState: SeedState;
  textRange?: { start: number; end: number };
  anchorText?: string;
  event_trace?: { trigger: string };
  identity?: { character_name?: string; social_profile: string; social_background?: string };
  characters?: Array<{ name: string; seedId: string; seed: SeedState }>;
  isReconstructing?: boolean;
  variants?: Array<{ text: string; state: SeedState }>;
  chapterIndex?: number;
}

export interface ScriptProjectDTO {
  id: string;
  name: string;
  inputText: string;
  units: ProcessUnit[];
  chapters?: NovelChapter[];
  seedId?: string | null;
  lockProgress?: number;
  personas?: Array<{ name: string; summary: string }>;
}

function toScriptProject(raw: {
  id: string;
  name: string;
  inputText?: string;
  chapters?: NovelChapter[];
  segments?: ProcessUnit[];
  seedId?: string | null;
  lockProgress?: number;
  personas?: Array<{ name: string; summary: string }>;
}): ScriptProjectDTO {
  return {
    id: raw.id,
    name: raw.name,
    inputText: raw.inputText ?? "",
    units: raw.segments ?? [],
    chapters: raw.chapters,
    seedId: raw.seedId,
    lockProgress: raw.lockProgress,
    personas: raw.personas,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 1：创作台
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fulfillCreateGenerateQuad(p: PayloadCreateGenerateQuad & { referenceSeed?: string }) {
  const dimensions = await extractSeedLogic(p.sourceText, p.manualOverrides);
  const lexCode = convert11DToLex(dimensions);
  const finalPrompt = buildRenderPrompt(lexCode, p.narrativeContext);
  const promptForModel = `${finalPrompt}\n\n【合成段】\n${p.sourceText}`;
  const streams = await requestContentStream({ prompt: promptForModel, seed: p.referenceSeed });
  console.log("🏭 [执行层] 创作台·四宫格 流水线就绪：", { lexCode });
  return { dimensions, lexCode, finalPrompt, streams };
}

export async function fulfillCreateLoadHistory(): Promise<{ lastJob: { samples: ContentStream[]; prompt: string } | null } | null> {
  const r = await fetch("/api/history");
  if (!r.ok) return null;
  return r.json();
}

export async function fulfillCreateVaryCard(payload: {
  prompt: string;
  target: number;
  seed: string;
}) {
  return requestContentStream({ ...payload, action: "vary" as const });
}

export async function fulfillCreateAdoptStream(payload: {
  seedId: string;
  tempState: SeedState;
  prompt?: string;
}) {
  return requestAdopt(payload);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 2：编辑区
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fulfillEditFetchSeedSnapshot(seedId: string): Promise<SeedState | null> {
  const r = await fetch(`/api/seed?id=${encodeURIComponent(seedId)}`);
  if (!r.ok) return null;
  return r.json();
}

export async function fulfillEditRewrite(payload: {
  seed: string;
  prompt: string;
  originalText: string;
  manualDoes?: DoesValues;
  target?: number;
}): Promise<{ text: string; seed: string } | null> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "vary",
      seed: payload.seed,
      prompt: payload.prompt,
      originalText: payload.originalText,
      manualDoes: payload.manualDoes,
      target: payload.target,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "请求失败");
  const results = Array.isArray(data) ? data : [data];
  const first = results[0];
  if (first?.text && first?.meta?.seed) return { text: first.text, seed: first.meta.seed };
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 4：剧本区
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function fulfillTranspilerListProjects(ownerId: string): Promise<ScriptProjectDTO[]> {
  const r = await fetch(`/api/projects?ownerId=${encodeURIComponent(ownerId)}`);
  const data = (await r.json()) as {
    projects?: Array<{
      id: string;
      name: string;
      inputText?: string;
      chapters?: NovelChapter[];
      segments?: ProcessUnit[];
      seedId?: string | null;
      lockProgress?: number;
      personas?: Array<{ name: string; summary: string }>;
    }>;
  };
  return (data.projects ?? []).map(toScriptProject);
}

export async function fulfillTranspilerNewProject(payload: { ownerId: string; name: string }): Promise<ScriptProjectDTO> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId: payload.ownerId, name: payload.name }),
  });
  const data = (await res.json()) as { project?: { id: string; name: string }; error?: string };
  if (!res.ok || !data.project) throw new Error(data.error ?? "项目创建失败");
  return toScriptProject({ ...data.project, inputText: "", segments: [], chapters: [] });
}

export async function fulfillTranspilerLoadProject(projectId: string): Promise<ScriptProjectDTO | null> {
  const res = await fetch(`/api/projects/${projectId}`);
  const data = (await res.json()) as { project?: Parameters<typeof toScriptProject>[0] };
  if (!res.ok || !data.project) return null;
  return toScriptProject(data.project);
}

export async function fulfillTranspilerSaveProject(projectId: string, body: Record<string, unknown>): Promise<void> {
  await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fulfillTranspilerDeleteProject(projectId: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
  return res.ok;
}

export async function fulfillTranspilerExtractChapters(payload: {
  fullText: string;
  ownerId: string;
  projectsCount: number;
  activeProjectId: string | null;
  onProgress?: (progress: number, log: string) => void;
}): Promise<
  | { ok: true; chapters: NovelChapter[]; projectId: string; createdNewProject: boolean; bootstrapProject?: ScriptProjectDTO }
  | { ok: false; error: string }
> {
  let currentProjectId = payload.activeProjectId;
  let createdNewProject = false;
  let bootstrapProject: ScriptProjectDTO | undefined;

  if (!currentProjectId) {
    try {
      const proj = await fulfillTranspilerNewProject({
        ownerId: payload.ownerId,
        name: `未命名小说 ${payload.projectsCount + 1}`,
      });
      currentProjectId = proj.id;
      createdNewProject = true;
      bootstrapProject = { ...proj, inputText: payload.fullText.trim(), chapters: [], units: [] };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "项目创建失败" };
    }
  }

  const full = payload.fullText.trim();
  let res = await fetch("/api/chapters/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText: full }),
  });

  if (!res.ok || !res.body) {
    payload.onProgress?.(0, "流式接口不可用，改用普通接口...");
    res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputText: full }),
    });
    const data = (await res.json()) as { chapters?: NovelChapter[]; error?: string };
    if (!res.ok) return { ok: false, error: data.error ?? "目录提取失败" };
    const newChapters = data.chapters ?? [];
    await fetch("/api/save-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: currentProjectId, chapters: newChapters }),
    });
    await fetch(`/api/projects/${currentProjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputText: full }),
    });
    return {
      ok: true,
      chapters: newChapters,
      projectId: currentProjectId,
      createdNewProject,
      bootstrapProject,
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let newChapters: NovelChapter[] = [];
  let hasError = false;
  let errMsg = "";

  const processChunk = (chunk: string) => {
    if (!chunk.startsWith("data: ")) return;
    try {
      const data = JSON.parse(chunk.slice(6)) as {
        type: string;
        progress?: number;
        log?: string;
        chapters?: NovelChapter[];
        error?: string;
      };
      if (data.type === "progress") payload.onProgress?.(data.progress ?? 0, data.log ?? "");
      else if (data.type === "done" && data.chapters) newChapters = data.chapters;
      else if (data.type === "error") {
        errMsg = data.error ?? "目录提取失败";
        hasError = true;
      }
    } catch {
      /* ignore */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) processChunk(line);
    if (done) {
      if (buffer.trim()) processChunk(buffer.trim());
      break;
    }
    if (hasError) break;
  }
  if (hasError) return { ok: false, error: errMsg };

  await fetch("/api/save-index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: currentProjectId, chapters: newChapters }),
  });
  await fetch(`/api/projects/${currentProjectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText: full }),
  });
  return {
    ok: true,
    chapters: newChapters,
    projectId: currentProjectId,
    createdNewProject,
    bootstrapProject,
  };
}

export async function fulfillTranspilerDiscoverCharacters(inputText: string): Promise<
  | { ok: true; list: Array<{ name: string; summary: string }> }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/discover-characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText }),
  });
  const data = (await res.json()) as { characters?: Array<{ name: string; summary?: string; bio?: string }>; error?: string };
  if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
  const list = (data.characters ?? []).map((c) => ({
    name: c.name,
    summary: String(c.summary ?? c.bio ?? "").trim().slice(0, 80),
  }));
  return { ok: true, list };
}

export async function fulfillTranspilerInitPersona(projectId: string, characters: Array<{ name: string; summary: string }>): Promise<void> {
  await fetch("/api/init-persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, characters }),
  });
}

export async function fulfillTranspilerSolidifyAll(payload: {
  projectId: string;
  personaNames: string[];
  fullText: string;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/solidify-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) return { ok: false, error: data.error ?? "固化失败" };
  return { ok: true };
}

export async function fulfillTranspilerCompileChapter(payload: {
  chapterText: string;
  projectId: string;
  chapterIndex: number;
  chapterStartIndex: number;
  charName: string;
}): Promise<
  | { ok: true; units: ProcessUnit[]; primarySeedId?: string; lockProgress?: number }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputText: payload.chapterText,
      mode: "parsing",
      charId: "main_char",
      charName: payload.charName,
      projectId: payload.projectId,
      chapterIndex: payload.chapterIndex,
      chapterStartIndex: payload.chapterStartIndex,
    }),
  });
  const data = (await res.json()) as { units?: ProcessUnit[]; primarySeedId?: string; lockProgress?: number; error?: string };
  const list = data.units ?? [];
  if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
  if (list.length === 0) return { ok: false, error: data.error ?? "编译完成但未提取到任何逻辑片段" };
  const offset = payload.chapterStartIndex;
  const adjusted = list.map((u) => ({
    ...u,
    textRange: u.textRange ? { start: u.textRange.start + offset, end: u.textRange.end + offset } : undefined,
  }));
  await fulfillTranspilerSaveSegments(payload.projectId, payload.chapterIndex, adjusted);
  return { ok: true, units: adjusted, primarySeedId: data.primarySeedId, lockProgress: data.lockProgress };
}

export async function fulfillTranspilerSaveSegments(projectId: string, chapterIndex: number, units: ProcessUnit[]): Promise<void> {
  await fetch("/api/save-segments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, chapterIndex, units }),
  });
}

export async function fulfillTranspilerCompileFullBook(payload: { inputText: string; projectId: string }): Promise<
  | { ok: true; units: ProcessUnit[]; primarySeedId?: string; lockProgress?: number }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputText: payload.inputText,
      mode: "parsing",
      projectId: payload.projectId,
      chapterIndex: -1,
    }),
  });
  const data = (await res.json()) as { units?: ProcessUnit[]; primarySeedId?: string; lockProgress?: number; error?: string };
  const list = data.units ?? [];
  if (!res.ok || (list.length === 0 && data.error)) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
  await fulfillTranspilerSaveSegments(payload.projectId, -1, list);
  return { ok: true, units: list, primarySeedId: data.primarySeedId, lockProgress: data.lockProgress };
}

export async function fulfillTranspilerGenerateVariants(payload: {
  prompt: string;
  originalText: string;
  userPrompt?: string;
  currentSeedId: string | null;
  baseState: SeedState;
  hasVary: boolean;
}): Promise<Array<{ text: string; state: SeedState }>> {
  const results = await requestContentStream({
    prompt: payload.prompt,
    originalText: payload.originalText,
    userPrompt: payload.userPrompt,
    ...(payload.hasVary && payload.currentSeedId
      ? { action: "vary" as const, seed: payload.currentSeedId, baseState: payload.baseState }
      : {}),
  });
  return results.map((r) => ({ text: r.text, state: r.state! }));
}

export function fulfillTranspilerAdoptVariant(unit: ProcessUnit, variantIndex: number): ProcessUnit | null {
  const v = unit.variants?.[variantIndex];
  if (!v) return null;
  const adopted = commitAdoption(unit.seedState, v.state);
  const chars = unit.characters ?? [{ name: "核心主角", seedId: unit.id.slice(0, 6), seed: unit.seedState }];
  return {
    ...unit,
    seedState: adopted,
    script: v.text,
    storyboard: seedToSoraPrompt(adopted, "SHOT 01"),
    variants: [],
    characters: chars.map((c, i) => (i === 0 ? { ...c, seed: adopted } : c)),
  };
}

export async function fulfillAdminSeedVaultSnapshot(): Promise<SeedVaultEntry[]> {
  return getSeedVault();
}

export async function fulfillTranspilerRenameProject(projectId: string, name: string): Promise<void> {
  await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}
