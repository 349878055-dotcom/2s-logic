/**
 * @Snapshot core-store-v1
 * @Role 11 维逻辑快照类型与进程内 fictionLibrary / globalSeedCache
 * @Guardrail 禁止本文件内 fs、禁止直接调用外部 AI SDK
 */
// ══════════════════════════════════════════════════════════
// Global Seed Cache — 意志引擎种子存储
// Key: 6 位字母数字混合 seed 字符串
// Value: 收敛后的 SeedState（7 维逻辑基因组）
// ══════════════════════════════════════════════════════════

import type { ProbabilityCloud, ProbabilityMatrix } from "./types";

// ── 成熟小说降维专用数据结构 (The Dehydration DB) ─────────────────────────

/**
 * 优先级 2：全局常数 (Global Constant)
 * 提取一次，终生锁死。
 */
export interface GlobalPersona {
  character_name: string;
  global_does: { d: number; o: number; e: number; s: number }; // 绝对常数
  global_bandwidth: number; // 巅峰智商
  ego_type: "自卑" | "自负" | "客观";
  dynamic_goal: "生存" | "获利" | "情感" | "复仇";
  logic_link: "因果论" | "情绪论" | "利弊论";
  /** 人生长期锚定物底座 */
  global_anchor_object?: string | null;
}

/**
 * 优先级 3：逻辑切片/状态限制器 (Logic Segment Limiter)
 * 挂载在每一段剧本上的"肉身与社会负荷"。
 */
export interface StatusLimiter {
  physical_condition: string; // 身体状况（如：极度虚弱）
  social_standing: string; // 社会/处境地位（如：失去靠山）
  compute_penalty: number; // 算力惩罚系数 (0.1 ~ 1.0)
}

/**
 * 逻辑章节索引（电子书目录）
 * 用于「索引建立器」+「点开才加载」
 */
export interface NovelChapter {
  title: string; // 章节标题
  summary: string; // 章节极简梗概
  startIndex: number; // 原文起始位置
  endIndex: number; // 原文结束位置
  isCompiled: boolean; // 标识该章节是否已完成剧本化
  anchor?: string; // 物理定位锚点（原文中一字不差的短句）
}

// ── 核心种子状态：11 维逻辑基因组 ──────────────────────────────────────────
export interface SeedState {
  skin: string;
  context: string;

  // 1. 天生底色 (软件层)：始终为概率云，随压强波动
  does: {
    d: ProbabilityCloud;
    o: ProbabilityCloud;
    e: ProbabilityCloud;
    s: ProbabilityCloud;
  };

  // 2. 智商带宽 (硬件层)：0 号种子阶段为云，采纳后 locked 必须为 true
  bandwidth: ProbabilityCloud;

  // 3-5. 离散逻辑层
  ego_type: ProbabilityMatrix<"自卑" | "自负" | "客观">;
  dynamic_goal: ProbabilityMatrix<"生存" | "获利" | "情感" | "复仇">;
  logic_link: ProbabilityMatrix<"因果论" | "情绪论" | "利弊论">;

  // 6. 意志锚点
  anchor: { value: string | null; locked: boolean };

  // 7. 即时演算物理结果 (不继承，根据 identity 实时计算)
  stress: number; // 环境压强
  compute: number; // 算法：bandwidth.mu * (1 - stress/150)

  depth: number;
  createdAt: number;
}

// ── 三级隔离档案架构 (断点续传) ────────────────────────────────────────────

// 3. 第三层：带事件溯源的种子切片 (SeedSegment)
export interface SeedSegment {
  segmentId: string; // 逻辑点 ID

  // ── 物理对齐坐标 ──
  textRange: { start: number; end: number }; // 记录在小说批次中的偏移量或匹配段落

  // ── 物理背景与身份 (隔离存储) ──
  identity: {
    character_name?: string; // 人物标准真名（如西门庆、薛嫂），用于轨道聚类
    social_profile: string; // 角色身份/瞬时面具
    social_background: string; // 社会背景
    status_bias: number; // 身份位阶 (0-1.0)
    vocabulary_domain: string; // 词汇域
  };

  // ── 事件追踪 (为了"续得上"和"修改提取") ──
  event_trace: {
    trigger: string; // 导致这一片产生的事件
    is_milestone: boolean; // 是否为里程碑节点
  };

  // ── 7 维逻辑基因 (静态存档) ──
  seed: SeedState;

  // ── 翻译后的无形容词六元素剧本 ──
  script?: {
    environment: string;
    action: string;
    expression: string;
    detail: string;
    monologue: string;
    dialogue: string;
  };
}

// 2. 第二层：人物隔离轨道 (CharacterTrack) —— 严禁不同人物共用轨道
export interface CharacterTrack {
  characterId: string; // 全局唯一 ID (如: "lin_dai_yu")
  name: string;
  segments: SeedSegment[]; // 增量切片数组，没变化就不增加
}

// 1. 第一层：全局批次索引 (BatchMatrix) —— 档案柜的总目录
export interface BatchMatrix {
  batchSequence: number; // 批次序号 (0, 1, 2...)，用于"续得上"逻辑
  batchId: string; // 唯一 ID
  rawText: string; // 本次 3000 字原文
  characterTracks: Record<string, CharacterTrack>; // 以 characterId 为 Key 的独立文件夹
  chapters?: NovelChapter[]; // 电子书目录索引（可选，用于按需加载）
}

// ── 整个作品的档案柜 (10万字 = 33 批次) ────────────────────────────────────
export const fictionLibrary: Map<string, BatchMatrix> = new Map();

// ── 核心功能：硬件坍缩 (Crystallization) ────────────────────────────────────

/**
 * 硬件鉴定：将 0 号种子的带宽云坍缩为物理常数
 * 从此以后，智商就是"石头"，不再波动
 */
export function crystallizeHardware(cloud: ProbabilityCloud): ProbabilityCloud {
  return {
    ...cloud,
    sigma: 0,
    locked: true,
  };
}

// ── 原有扁平缓存 (保留) ──────────────────────────────────────────────────
// 使用模块单例保证 Node.js 进程内全局唯一
declare global {
  // eslint-disable-next-line no-var
  var __globalSeedCache: Map<string, SeedState> | undefined;
}

export const globalSeedCache: Map<string, SeedState> =
  globalThis.__globalSeedCache ?? (globalThis.__globalSeedCache = new Map());

// ── 工具函数 ──────────────────────────────────────────────

/** 生成 6 位字母数字混合 seed */
export function generateSeedId(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * 续接逻辑：当新批次开始时，自动抓取上一个批次该人物的最后一个 SeedSegment 作为输入。
 * @param charId 人物 ID (如 "lin_dai_yu")
 * @param currentBatchIdx 当前批次序号 (如 2 表示 Batch 2 启动)
 * @returns 上一批次末端的 SeedState，若无则返回 null
 */
export function getInheritedSeed(charId: string, currentBatchIdx: number): SeedState | null {
  const prevBatchIdx = currentBatchIdx - 1;
  if (prevBatchIdx < 0) return null;

  for (const batch of fictionLibrary.values()) {
    if (batch.batchSequence === prevBatchIdx) {
      const track = batch.characterTracks[charId];
      if (!track || track.segments.length === 0) return null;
      const lastSegment = track.segments.at(-1);
      return lastSegment ? lastSegment.seed : null;
    }
  }
  return null;
}
