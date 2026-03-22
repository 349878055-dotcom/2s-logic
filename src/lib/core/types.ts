/**
 * @Snapshot core-types-v1
 * @Role 跨 UI / 引擎共享的纯类型定义
 * @Guardrail 禁止副作用、禁止 I/O
 */
// ══════════════════════════════════════════════════════════
// Shared Types
// ══════════════════════════════════════════════════════════

import type { LucideIcon } from "lucide-react";

/**
 * 概率云 (Probability Cloud)：意志引擎的最小物理单位
 * 用于处理性格的模糊度与逻辑的宽度
 */
export interface ProbabilityCloud {
  mu: number; // 期望值/重心 (0-100)：性格的最强倾向点
  sigma: number; // 标准差/厚度 (0-50)：云的模糊度。数值越大，行为越灵动随机；数值越小，逻辑越趋向坍缩
  locked: boolean; // 物理锁：当 sigma 趋近于 0 或被用户采纳固化时，触发硬锁定。锁定后 mu 变为不可变的常数
}

/** 离散概率矩阵：用于枚举状态的跑马圈地与否定降权 */
export interface ProbabilityMatrix<T extends string> {
  current_dominant: T;        // 当前胜出（主导）的状态
  options: Record<T, number>; // 各选项的概率权重（加总趋近 1.0）
  locked: boolean;            // 客户是否进行了强制指定
}

export interface DoesValues { d: number; o: number; e: number; s: number }

export interface ScriptFragment {
  id: number; scene: string; location: string;
  tag: string; tagColor: string; content: string;
  isAdopted?: boolean; adoptedDim?: string;
  seedId?: string; // 采纳片段的 seed，用于 Vary 收敛引擎
  active_characters?: string[]; // 预留：出场人物ID列表
  active_environment?: string;  // 预留：当前环境ID
}

export interface ConstraintInfo {
  active: boolean;
  charName: string; charColor: string;
  activeAnchors: CharacterAnchor[];
}

export interface CharacterAnchor {
  id: string; label: string; type: "物品" | "记忆" | "关系" | "秘密"; color: string;
}

export interface CharacterEntity {
  id: string;
  name: string;
  avatar_url?: string;
  role_type: "核心" | "配角" | "路人甲"; // 若为路人甲，演化时锁定所有维度
  depth: number;
  solidification_index: number; // 0-100，由基因组置信度推算出的固化进度
  genome: import("./store").SeedState;
  createdAt: number;
}

export interface EnvironmentEntity {
  id: string;
  name: string;
  stress: number; // 0-100，环境压强
}

/** 遗留：整理视图/情绪板用的人物配置（非 Will 引擎实体） */
export interface LegacyCharacterProfile {
  id: string;
  name: string;
  initial: string;
  age: number;
  color: string;
  baseTone: { label: string; weight: number; traits: string[] };
  anchors: CharacterAnchor[];
  background: { cls: string; profession: string; history: string };
  instant: { emotion: string; intensity: number; physiology: string; energy: number };
  does: DoesValues;
  category: string;
}

export interface AssetCard {
  id: number; characterId: string; state: string; emotionLabel: string;
  intensity: number; content: string; does: DoesValues;
  date: string; category: string;
}

export interface DimensionDef {
  key: string;
  label: string;
  enLabel: string;
  icon: LucideIcon;
  color: string;
  colorBg: string;
  colorBorder: string;
  desc: string;
  field: keyof DoesValues;
}

export interface ContentStream {
  id: string;
  index: number;
  text: string;
  meta: { seed: string; genre: string; mode: string };
  /** 仅 temp_variant 时存在，用于 adopt 固化 */
  state?: import("./store").SeedState;
}
