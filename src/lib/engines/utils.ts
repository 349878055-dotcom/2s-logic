/**
 * @Snapshot engines-utils-v1
 * @Role 通用工具与前端对接 /api/generate 的请求封装
 * @Guardrail 禁止 fs；fetch 仅指向本站 API
 */
import type { DoesValues, ScriptFragment } from "@/lib/core/types";
import { DIMENSIONS, PROTOTYPE_VARIANTS } from "./constants";

/** 生成 6 位混合码 (Seed ID)，如 Ab3X92 */
export function generateSeedId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ── 原型生成 ──
let _protoCounter = 0;

export function generatePrototypes(does: DoesValues): ScriptFragment[] {
  const idx = _protoCounter % 3;
  _protoCounter++;
  return DIMENSIONS.map((dim, i) => ({
    id: Date.now() + i,
    scene: `原型 #${String(_protoCounter).padStart(2, "0")} · ${dim.enLabel} 轴`,
    location: `${dim.label}强度 ${does[dim.field]}% · 生成于 ${new Date().toLocaleTimeString("zh-CN")}`,
    tag: dim.label,
    tagColor: dim.color,
    content: PROTOTYPE_VARIANTS[dim.key][idx],
    isAdopted: false,
    adoptedDim: dim.key,
  }));
}

// ── 内容重塑 ──
export function rewriteContent(
  frag: ScriptFragment,
  does: DoesValues,
  dominant: string,
  contextLock: boolean,
  prev?: ScriptFragment,
  next?: ScriptFragment
): string {
  const dimLabel = DIMENSIONS.find((d) => d.key === dominant)?.label ?? "综合";
  const lines = frag.content.split("\n");
  const midPoint = Math.ceil(lines.length * 0.55);
  const before = lines.slice(0, midPoint).join("\n");
  const after = lines.slice(midPoint).join("\n");

  const contextNote = contextLock
    ? `\n【上文锚点】${prev?.scene ?? "—"} → 【下文锚点】${next?.scene ?? "—"}`
    : "";

  const rewriteNote = `

——————————————————————————
✦ 灵感重塑 · ${dimLabel}轴驱动 → 进入 IDE 局部重写模式
  D:${does.d}  O:${does.o}  E:${does.e}  S:${does.s}${contextNote}
——————————————————————————`;

  return before + rewriteNote + "\n" + after;
}

// ── 校准器通用算法 ──
export function calcFinalDoes(
  choices: ("A" | "B")[],
  roundData: readonly { doesA: DoesValues; doesB: DoesValues }[]
): DoesValues {
  const sum = choices.reduce(
    (acc, ch, i) => {
      const d = ch === "A" ? roundData[i].doesA : roundData[i].doesB;
      return { d: acc.d + d.d, o: acc.o + d.o, e: acc.e + d.e, s: acc.s + d.s };
    },
    { d: 0, o: 0, e: 0, s: 0 }
  );
  const n = choices.length;
  return {
    d: Math.round(sum.d / n),
    o: Math.round(sum.o / n),
    e: Math.round(sum.e / n),
    s: Math.round(sum.s / n),
  };
}

export function getDominantDim(does: DoesValues): keyof DoesValues {
  return (Object.entries(does) as [keyof DoesValues, number][]).sort(([, a], [, b]) => b - a)[0][0];
}

// ── ContentStream — 对接 /api/generate ───────────────────

import type { SeedState } from "@/lib/core/store";

type GenerateInput = {
  prompt: string;
  action?: "vary";
  target?: number;
  seed?: string;
  baseState?: SeedState;
  originalText?: string;
  userPrompt?: string;
  /** 与 ?admin= 对齐，用于 jobs.json 分箱 */
  ownerId?: string;
};

export async function requestContentStream(input: GenerateInput) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`[generate] ${err.error ?? res.statusText}`);
  }
  return res.json() as Promise<
    { id: string; index: number; text: string; meta: { seed: string; genre: string; mode: string }; state?: SeedState }[]
  >;
}

/** 采纳固化：将 temp_variant 状态写入缓存并落盘 */
export async function requestAdopt(params: {
  seedId: string;
  tempState: SeedState;
  prompt?: string;
  ownerId?: string;
}) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "adopt", ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`[adopt] ${err.error ?? res.statusText}`);
  }
  return res.json() as Promise<{ ok: boolean; seedId: string; state: SeedState }>;
}
