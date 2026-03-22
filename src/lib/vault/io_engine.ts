/**
 * @Snapshot vault-io_engine-v1
 * @Role 唯一受权落盘层：Database/{OWNER_ID}/{PROJECT_ID}/ 与 OWNER 级 jobs.json
 * @Guardrail 禁止在 /engines、/core、任何 .tsx 中直接 fs；业务仅通过本模块或本模块暴露的 ClientDatabase
 */

import fs from "fs/promises";
import path from "path";
import type { NovelChapter, GlobalPersona, SeedSegment, SeedState } from "@/lib/core/store";
import type { ContentStream } from "@/lib/core/types";

export const DATABASE_ROOT = path.join(process.cwd(), "Database");

/** 与 URL ?admin= / ownerId 对应的目录名片段（防路径穿越） */
export function sanitizeOwnerId(ownerId: string): string {
  const s = String(ownerId ?? "default").trim() || "default";
  const safe = s.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 128);
  return safe || "default";
}

export function ownerVaultPath(ownerId: string): string {
  return path.join(DATABASE_ROOT, sanitizeOwnerId(ownerId));
}

// ── 任务流档案（原 jobs.json，现按 OWNER 隔离）────────────────────────────

export interface JobRecord {
  id: string;
  prompt: string;
  mode: "gen" | "vary" | "adopt";
  samples: ContentStream[];
  seeds: Record<string, SeedState>;
  createdAt: number;
}

interface JobsStore {
  jobs: JobRecord[];
}

// ── 项目档案（与磁盘 config.json 对齐）──────────────────────────────────

export interface ProjectRecord {
  id: string;
  ownerId: string;
  name: string;
  inputText: string;
  chapters?: Array<{
    title: string;
    summary: string;
    startIndex: number;
    endIndex: number;
    isCompiled: boolean;
    anchor?: string;
  }>;
  personas?: Array<{ name: string; summary: string }>;
  segments?: Array<{
    id: string;
    novel: string;
    script: string;
    storyboard: string;
    seedState: SeedState;
    textRange: { start: number; end: number };
    anchorText: string;
    event_trace: { trigger: string };
    identity?: { character_name?: string; social_profile: string; social_background?: string };
    characters?: Array<{ name: string; seedId: string; seed: SeedState }>;
    chapterIndex?: number;
  }>;
  seedId?: string | null;
  lockProgress?: number;
  createdAt: number;
}

function jobsFilePath(ownerId: string): string {
  return path.join(ownerVaultPath(ownerId), "jobs.json");
}

async function readJobsStore(ownerId: string): Promise<JobsStore> {
  const file = jobsFilePath(ownerId);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as JobsStore;
  } catch {
    return { jobs: [] };
  }
}

async function writeJobsStore(ownerId: string, store: JobsStore): Promise<void> {
  const dir = ownerVaultPath(ownerId);
  await ensureDir(dir);
  await fs.writeFile(jobsFilePath(ownerId), JSON.stringify(store, null, 2), "utf-8");
}

export async function saveJob(ownerId: string, job: JobRecord): Promise<void> {
  const store = await readJobsStore(ownerId);
  store.jobs = [job, ...store.jobs.slice(0, 49)];
  await writeJobsStore(ownerId, store);
}

export async function getLastJob(ownerId: string): Promise<JobRecord | null> {
  const store = await readJobsStore(ownerId);
  return store.jobs[0] ?? null;
}

export async function getRecentJobs(ownerId: string, n = 10): Promise<JobRecord[]> {
  const store = await readJobsStore(ownerId);
  return store.jobs.slice(0, n);
}

/**
 * 根据 projectId 在 Database 下扫描各 OWNER 目录
 */
export async function findProjectDir(projectId: string): Promise<string | null> {
  try {
    const owners = await fs.readdir(DATABASE_ROOT);
    for (const ownerDir of owners) {
      const projectPath = path.join(DATABASE_ROOT, ownerDir, projectId);
      try {
        const stat = await fs.stat(projectPath);
        if (stat.isDirectory()) return projectPath;
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function getProjectFromDisk(
  projectId: string
): Promise<{ id: string; ownerId: string; name: string; inputText: string } | null> {
  const projectDir = await findProjectDir(projectId);
  if (!projectDir) return null;
  try {
    const configPath = path.join(projectDir, "config.json");
    const raw = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(raw) as Record<string, unknown>;
    return {
      id: String(config.id ?? projectId),
      ownerId: String(config.ownerId ?? "default"),
      name: String(config.name ?? projectId),
      inputText: String(config.inputText ?? ""),
    };
  } catch {
    return null;
  }
}

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/** 合并写入 config.json（用于 PATCH、人物档案等） */
export async function patchProjectConfig(
  projectId: string,
  patch: Record<string, unknown>
): Promise<boolean> {
  const dir = await findProjectDir(projectId);
  if (!dir) return false;
  const configPath = path.join(dir, "config.json");
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const old = JSON.parse(raw) as Record<string, unknown>;
    await fs.writeFile(
      configPath,
      JSON.stringify({ ...old, ...patch }, null, 2),
      "utf-8"
    );
    return true;
  } catch {
    return false;
  }
}

/** 列出某 OWNER 下全部项目（读取各目录 config.json） */
export async function vaultListProjects(ownerId: string): Promise<ProjectRecord[]> {
  const clientPath = ownerVaultPath(ownerId);
  const projects: ProjectRecord[] = [];
  try {
    await fs.access(clientPath);
  } catch {
    return [];
  }
  const entries = await fs.readdir(clientPath);
  for (const dir of entries) {
    if (dir === "jobs.json") continue;
    const fullPath = path.join(clientPath, dir);
    try {
      const stat = await fs.stat(fullPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    const configPath = path.join(fullPath, "config.json");
    try {
      const configData = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(configData) as ProjectRecord;
      projects.push({
        ...parsed,
        id: parsed.id ?? dir,
        ownerId: parsed.ownerId ?? ownerId,
      });
    } catch {
      projects.push({
        id: dir,
        name: dir,
        ownerId,
        inputText: "",
        chapters: [],
        segments: [],
        createdAt: Date.now(),
      });
    }
  }
  projects.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return projects;
}

/** 物理新建项目抽屉 */
export async function vaultCreateProject(
  ownerId: string,
  projectName: string
): Promise<ProjectRecord> {
  const oid = sanitizeOwnerId(ownerId);
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const base = ownerVaultPath(oid);
  const projectDir = path.join(base, projectId);
  await ensureDir(projectDir);
  await ensureDir(path.join(projectDir, "Batches"));

  const newProject: ProjectRecord = {
    id: projectId,
    ownerId: oid,
    name: projectName.trim() || "未命名小说",
    inputText: "",
    chapters: [],
    segments: [],
    personas: [],
    seedId: null,
    lockProgress: 0,
    createdAt: Date.now(),
  };

  await fs.writeFile(
    path.join(projectDir, "config.json"),
    JSON.stringify(newProject, null, 2),
    "utf-8"
  );
  console.log(`[物理建库] 客户 ${oid} 成功新建项目抽屉: ${newProject.name}`);
  return newProject;
}

/** 读取单项目：config + chapters.json + personas + Batches 聚合 */
export async function vaultReadProject(projectId: string): Promise<ProjectRecord | null> {
  const projectDir = await findProjectDir(projectId);
  if (!projectDir) return null;

  try {
    const configPath = path.join(projectDir, "config.json");
    const configData = await fs.readFile(configPath, "utf-8");
    const project = JSON.parse(configData) as ProjectRecord;

    try {
      const chaptersPath = path.join(projectDir, "chapters.json");
      const chaptersData = await fs.readFile(chaptersPath, "utf-8");
      project.chapters = JSON.parse(chaptersData) as ProjectRecord["chapters"];
    } catch {
      /* keep config chapters */
    }

    try {
      const personasPath = path.join(projectDir, "personas.json");
      const personasData = await fs.readFile(personasPath, "utf-8");
      const personas = JSON.parse(personasData) as GlobalPersona[];
      project.personas = personas.map((p) => ({
        name: p.character_name,
        summary: "",
      }));
    } catch {
      /* keep config personas */
    }

    try {
      const batchesDir = path.join(projectDir, "Batches");
      const files = await fs.readdir(batchesDir);
      const batchFiles = files
        .filter((f) => f.startsWith("batch_") && f.endsWith(".json"))
        .sort((a, b) => {
          const na = parseInt(a.replace("batch_", "").replace(".json", ""), 10);
          const nb = parseInt(b.replace("batch_", "").replace(".json", ""), 10);
          return na - nb;
        });

      const allUnits: NonNullable<ProjectRecord["segments"]> = [];
      for (let i = 0; i < batchFiles.length; i++) {
        const raw = await fs.readFile(path.join(batchesDir, batchFiles[i]!), "utf-8");
        const batch = JSON.parse(raw) as unknown;
        if (Array.isArray(batch)) {
          for (const u of batch) {
            allUnits.push({ ...(u as object), chapterIndex: i } as NonNullable<ProjectRecord["segments"]>[0]);
          }
        }
      }
      if (allUnits.length > 0) {
        project.segments = allUnits;
        Object.assign(project, { units: allUnits });
      }
    } catch {
      /* keep config segments */
    }

    return project;
  } catch {
    return null;
  }
}

export async function vaultDeleteProject(projectId: string): Promise<boolean> {
  const projectDir = await findProjectDir(projectId);
  if (!projectDir) return false;
  try {
    await fs.rm(projectDir, { recursive: true, force: true });
    console.log(`[物理销毁] 项目抽屉 ${projectId} 已从磁盘抹除`);
    return true;
  } catch {
    return false;
  }
}

/** 按项目解析 OWNER 后写入 Batches（供 /api/compile 等调用） */
export async function saveBatchSegmentsForProject(
  projectId: string,
  chapterIndex: number,
  segments: SeedSegment[] | Record<string, unknown>[]
): Promise<void> {
  const meta = await getProjectFromDisk(projectId);
  if (!meta) return;
  const db = new ClientDatabase(meta.ownerId);
  await db.saveBatchSegments(projectId, chapterIndex, segments);
}

/**
 * 核心存档类：客户私有数据库中心
 * 路径：./Database/{sanitizeOwnerId}/{PROJECT_ID}/
 */
export class ClientDatabase {
  private readonly clientPath: string;

  constructor(ownerId: string) {
    this.clientPath = ownerVaultPath(ownerId);
  }

  async saveChapters(projectId: string, chapters: NovelChapter[]) {
    const projectDir = path.join(this.clientPath, projectId);
    await ensureDir(projectDir);

    const filePath = path.join(projectDir, "chapters.json");
    await fs.writeFile(filePath, JSON.stringify(chapters, null, 2), "utf-8");
    console.log(`[数据库中心] 📕 项目 ${projectId} 排版目录已物理入库`);
  }

  async savePersonas(projectId: string, personas: GlobalPersona[], merge = false) {
    const projectDir = path.join(this.clientPath, projectId);
    await ensureDir(projectDir);

    const filePath = path.join(projectDir, "personas.json");
    let toSave = personas;
    if (merge) {
      const existing = await this.getPersonas(projectId);
      const byName = new Map(existing.map((p) => [p.character_name, p]));
      for (const p of personas) byName.set(p.character_name, p);
      toSave = Array.from(byName.values());
    }

    await fs.writeFile(filePath, JSON.stringify(toSave, null, 2), "utf-8");
    console.log(`[数据库中心] 🧬 项目 ${projectId} 人物 11 维基因已锁死`);
  }

  async getPersonas(projectId: string): Promise<GlobalPersona[]> {
    const filePath = path.join(this.clientPath, projectId, "personas.json");
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as GlobalPersona[];
    } catch {
      return [];
    }
  }

  async saveBatchSegments(
    projectId: string,
    batchIndex: number,
    segments: SeedSegment[] | Record<string, unknown>[]
  ) {
    const batchesDir = path.join(this.clientPath, projectId, "Batches");
    await ensureDir(batchesDir);

    const filePath = path.join(batchesDir, `batch_${batchIndex}.json`);
    await fs.writeFile(filePath, JSON.stringify(segments, null, 2), "utf-8");
    console.log(
      `[数据库中心] 🎞️ 项目 ${projectId} 剧本切片 #${batchIndex} 已落盘`
    );
  }

  async getLatestBatchIndex(projectId: string): Promise<number> {
    const batchesDir = path.join(this.clientPath, projectId, "Batches");
    try {
      const files = await fs.readdir(batchesDir);
      const indices = files
        .filter((f) => f.startsWith("batch_") && f.endsWith(".json"))
        .map((f) =>
          parseInt(f.replace("batch_", "").replace(".json", ""), 10)
        )
        .filter((n) => !Number.isNaN(n));

      return indices.length > 0 ? Math.max(...indices) : -1;
    } catch {
      return -1;
    }
  }
}
