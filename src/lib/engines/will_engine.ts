/**
 * @Snapshot engines-will_engine-v1
 * @Role 意志渲染与 LLM 网关：概率云、六元素剧本、算力公式
 * @Guardrail 禁止在本文件内 fs 读写；仅返回数据供调用方落盘
 */
// ══════════════════════════════════════════════════════════
// Will Engine — 核心物理与渲染引擎
// ══════════════════════════════════════════════════════════

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type RequestOptions,
} from "@google/generative-ai";
import OpenAI from "openai";
import type { SeedState, SeedSegment } from "@/lib/core/store";
import type { ProbabilityCloud, ProbabilityMatrix } from "@/lib/core/types";

// ============================================================================
// 🧰 第一部分：全局通用与底层工具 (API、算力公式、公共重写逻辑)
// ============================================================================

let _genAI: GoogleGenerativeAI | null = null;
export function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing env: GEMINI_API_KEY");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

let _openai: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing env: OPENAI_API_KEY");
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export function buildGeminiRequestOptions(): RequestOptions | undefined {
  const baseUrl = process.env.GEMINI_API_BASE_URL?.trim();
  const timeoutRaw = process.env.GEMINI_REQUEST_TIMEOUT_MS?.trim();
  const o: RequestOptions = {};
  if (baseUrl) o.baseUrl = baseUrl.replace(/\/$/, "");
  if (timeoutRaw) {
    const n = parseInt(timeoutRaw, 10);
    if (!Number.isNaN(n) && n > 0) o.timeout = n;
  }
  return Object.keys(o).length > 0 ? o : undefined;
}

export function defaultFlashModel(): string {
  return process.env.GEMINI_FLASH_MODEL?.trim() || "models/gemini-2.5-flash";
}

/** 剧本区/脱水用：强制关闭安全审查，避免古典文学（如金瓶梅）被误拦截 */
export function buildGeminiSafetySettings() {
  return [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];
}
export function defaultProModel(): string {
  return process.env.GEMINI_PRO_MODEL?.trim() || "models/gemini-2.5-pro";
}

export function appendGeminiConnectivityHint(message: string): string {
  const lower = message.toLowerCase();
  const looksNetwork =
    lower.includes("fetching") || lower.includes("econnrefused") || lower.includes("etimedout");
  if (!looksNetwork) return message;
  return `${message}\n\n【网络】本机访问 Google Gemini 接口失败，请检查代理或反代设置。`;
}

function pc(mu: number, sigma = 15, locked = false): ProbabilityCloud {
  return { mu, sigma, locked };
}
function pm<T extends string>(
  dominant: T,
  allKeys: readonly T[],
  locked = false
): ProbabilityMatrix<T> {
  const options = {} as Record<T, number>;
  for (const k of allKeys) options[k] = k === dominant ? 0.6 : 0.4 / (allKeys.length - 1);
  return { current_dominant: dominant, options, locked };
}

const EGO_KEYS = ["自卑", "自负", "客观"] as const;
const GOAL_KEYS = ["生存", "获利", "情感", "复仇"] as const;
const LOGIC_KEYS = ["因果论", "情绪论", "利弊论"] as const;

export function toEgo(s: string) {
  return EGO_KEYS.includes(s as (typeof EGO_KEYS)[number]) ? (s as (typeof EGO_KEYS)[number]) : "客观";
}
export function toGoal(s: string) {
  return GOAL_KEYS.includes(s as (typeof GOAL_KEYS)[number]) ? (s as (typeof GOAL_KEYS)[number]) : "生存";
}
export function toLogic(s: string) {
  return LOGIC_KEYS.includes(s as (typeof LOGIC_KEYS)[number]) ? (s as (typeof LOGIC_KEYS)[number]) : "因果论";
}

/** 剧本区专用：创建锁定的常数（sigma=0, locked=true），无波动 */
export function createLockedConstant(value: number): ProbabilityCloud {
  return { mu: value, sigma: 0, locked: true };
}

/** 剧本区专用：创建锁定的离散矩阵 */
export function createLockedMatrix<T extends string>(
  dominant: T,
  allKeys: readonly T[]
): ProbabilityMatrix<T> {
  const options = {} as Record<T, number>;
  for (const k of allKeys) options[k] = k === dominant ? 0.6 : 0.4 / (allKeys.length - 1);
  return { current_dominant: dominant, options, locked: true };
}

export function calculateCompute(stress: number, bandwidth: number): number {
  return Math.max(5, Math.min(100, Math.round(bandwidth * (1 - stress / 150))));
}

export function createDefaultSeedState(context: string): SeedState {
  const stress = 50,
    bw = 72;
  return {
    skin: "当代都市人物",
    context: context.slice(0, 80),
    does: { d: pc(55), o: pc(65), e: pc(70), s: pc(45) },
    bandwidth: pc(bw),
    ego_type: pm("客观", EGO_KEYS),
    dynamic_goal: pm("情感", GOAL_KEYS),
    logic_link: pm("因果论", LOGIC_KEYS),
    anchor: { value: null, locked: false },
    stress,
    compute: calculateCompute(stress, bw),
    depth: 0,
    createdAt: Date.now(),
  };
}

export function seedToSoraPrompt(state: SeedState, shotLabel: string): string {
  const d = state.does.d.mu,
    stress = state.stress;
  const freq = Math.max(2, Math.min(5, Math.round(3 + (stress - 50) / 25)));
  const parts = ["特写", `眼神偏移约${d > 60 ? "15" : "8"}°`, `指尖颤动频率${freq}Hz`, `光影压强:${stress}`];
  if (state.anchor.value) parts.push(`锚点:${state.anchor.value}`);
  return `${shotLabel}: ${parts.join("。")}。Cinematic macro, ${state.skin}, ${state.ego_type.current_dominant} mood, low key lighting, 8k photorealistic --ar 16:9`;
}

export interface ScriptCard {
  environment: string;
  action: string;
  expression: string;
  detail: string;
  monologue: string;
  dialogue: string;
}

export function formatSixElementScript(
  script: SeedSegment["script"] | ScriptCard | undefined
): string {
  if (!script) return "（翻译丢失）";
  return `[环境]\n${script.environment}\n\n[动作]\n${script.action}\n\n[表情]\n${script.expression}\n\n[细节]\n${script.detail}\n\n[独白]\n${script.monologue}\n\n[台词]\n${script.dialogue}`;
}
