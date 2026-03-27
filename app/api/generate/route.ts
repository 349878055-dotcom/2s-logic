// ══════════════════════════════════════════════════════════
// POST /api/generate — 中枢控制器
// 初次四宫格：A(seed)→B(lex)→C(render) + Gemini（system = finalSystemPrompt）
// vary：沿用惯性偏移 + generateSixElementScript
// 任务历史：Database/{OWNER_ID}/jobs.json
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { globalSeedCache, generateSeedId, type SeedState } from "@/lib/core/store";
import type { ElevenDimensions } from "@/lib/core/types";
import { extractSeedLogic } from "@/lib/engines/seed_engine";
import { convert11DToLex } from "@/lib/engines/lex_adapter";
import { buildRenderPrompt } from "@/lib/engines/render_engine";
import { QUAD_BIAS } from "@/lib/engines/create_workbench";
import {
  calculateInertiaShift,
  commitAdoption,
  generateSixElementScript,
} from "@/lib/engines/engine_evolving";
import {
  buildGeminiRequestOptions,
  buildGeminiSafetySettings,
  calculateCompute,
  createLockedConstant,
  createLockedMatrix,
  defaultProModel,
  getGenAI,
} from "@/lib/engines/will_engine";
import { saveJob } from "@/lib/vault/io_engine";

const EGO_KEYS = ["自卑", "自负", "客观"] as const;
const GOAL_KEYS = ["生存", "获利", "情感", "复仇"] as const;
const LOGIC_KEYS = ["因果论", "情绪论", "利弊论"] as const;

function pickDiscrete<T extends readonly string[]>(v: number, keys: T): T[number] {
  const x = Math.max(0, Math.min(1, v));
  const idx = Math.min(keys.length - 1, Math.floor(x * keys.length));
  return keys[idx];
}

function seedStateFromElevenD(sourceText: string, dim: ElevenDimensions): SeedState {
  const ctx = sourceText.slice(0, 80);
  const bw = Math.min(100, Math.max(0, Math.round(dim.bandwidth * 100)));
  const stressN = Math.min(100, Math.max(0, Math.round(dim.stress * 100)));
  return {
    skin: "当代都市人物",
    context: ctx,
    does: {
      d: createLockedConstant(Math.round(dim.dominance * 100)),
      o: createLockedConstant(Math.round(dim.order * 100)),
      e: createLockedConstant(Math.round(dim.ego * 100)),
      s: createLockedConstant(Math.round(dim.sociality * 100)),
    },
    bandwidth: createLockedConstant(bw),
    ego_type: createLockedMatrix(pickDiscrete(dim.ego_type, EGO_KEYS), EGO_KEYS),
    dynamic_goal: createLockedMatrix(pickDiscrete(dim.target_goal, GOAL_KEYS), GOAL_KEYS),
    logic_link: createLockedMatrix(pickDiscrete(dim.logic_link, LOGIC_KEYS), LOGIC_KEYS),
    anchor: { value: null, locked: false },
    stress: stressN,
    compute: calculateCompute(stressN, bw),
    depth: 0,
    createdAt: Date.now(),
  };
}

function formatSegmentFromModel(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]) as Record<string, string>;
      const keys = ["environment", "action", "expression", "detail", "monologue", "dialogue"] as const;
      const parts = keys.filter((k) => obj[k]).map((k) => `[${k}] ${obj[k]}`);
      if (parts.length) return parts.join("\n\n");
    } catch {
      /* ignore */
    }
  }
  return trimmed || fallback;
}

/** 仅执行 Gemini + 落缓存（system 与 11 维由上游总控传入） */
async function generateOneQuadrantWithPipeline(args: {
  quadrantIndex: number;
  sourceText: string;
  dimensions: ElevenDimensions;
  finalSystemPrompt: string;
  originalText?: string;
  userPrompt?: string;
  /** 变体：复用同一 seedId 写回缓存 */
  metaSeedId?: string;
  varyTarget?: number;
}): Promise<{
  id: string;
  index: number;
  text: string;
  meta: { seed: string; genre: string; mode: string };
  state: SeedState;
}> {
  const { quadrantIndex, sourceText, dimensions, finalSystemPrompt, originalText, userPrompt, metaSeedId, varyTarget } =
    args;

  const userParts = [
    "你是剧本片段生成器。严格按系统指令中的简码风格输出。",
    metaSeedId
      ? `本请求为定向变体（轴向 ${varyTarget ?? quadrantIndex + 1}）：在素材上推进冲突或语气，与上一版可区分。`
      : `本象限为四宫格第 ${quadrantIndex + 1} 格，请在冲突走向、语气或目标上与另外三格形成可区分的张力。`,
    "输出：六元素 JSON 或 80–150 字纯文本（对白+动作），不要解释、不要标题。",
    "",
    "【素材】",
    sourceText,
  ];
  if (originalText) userParts.push("", "【待重塑底片】", originalText);
  if (userPrompt) userParts.push("", "【导演指令】", userPrompt);
  const userMessage = userParts.join("\n");

  let rawOut = "";
  try {
    const model = getGenAI().getGenerativeModel(
      {
        model: defaultProModel(),
        systemInstruction: finalSystemPrompt,
        safetySettings: buildGeminiSafetySettings(),
      },
      buildGeminiRequestOptions()
    );
    const result = await model.generateContent(userMessage);
    rawOut = result.response.text();
  } catch {
    /* ignore */
  }

  const seedId = metaSeedId ?? generateSeedId();
  const state = seedStateFromElevenD(sourceText, dimensions);
  globalSeedCache.set(seedId, state);
  const text = formatSegmentFromModel(rawOut, originalText || "（生成失败）");
  const mode =
    metaSeedId != null && varyTarget != null ? (`V${varyTarget}` as string) : "pro";

  return {
    id: `cs_${Date.now()}_${quadrantIndex}`,
    index: quadrantIndex + 1,
    text,
    meta: { seed: seedId, genre: state.ego_type.current_dominant, mode },
    state,
  };
}

async function generateOneQuadrantAbc(args: {
  quadrantIndex: number;
  sourceText: string;
  narrativeContext: string;
  overrides?: Partial<ElevenDimensions>;
  originalText?: string;
  userPrompt?: string;
}): Promise<{
  id: string;
  index: number;
  text: string;
  meta: { seed: string; genre: string; mode: string };
  state: SeedState;
}> {
  const { quadrantIndex, sourceText, narrativeContext, overrides, originalText, userPrompt } = args;
  const bias = QUAD_BIAS[quadrantIndex] ?? {};
  const dimensions = await extractSeedLogic(sourceText, { ...bias, ...overrides });
  const lexCode = convert11DToLex(dimensions);
  const finalSystemPrompt = buildRenderPrompt(lexCode, narrativeContext);
  return generateOneQuadrantWithPipeline({
    quadrantIndex,
    sourceText,
    dimensions,
    finalSystemPrompt,
    originalText,
    userPrompt,
  });
}

async function generateOneVariant(
  seedId: string,
  state: SeedState,
  index: number,
  originalText?: string,
  userPrompt?: string
): Promise<{ id: string; index: number; text: string; meta: { seed: string; genre: string; mode: string }; state: SeedState }> {
  const text = await generateSixElementScript(state, originalText ?? "", userPrompt);
  return {
    id: `cs_${Date.now()}_${index}`,
    index: index + 1,
    text,
    meta: { seed: seedId, genre: state.ego_type.current_dominant, mode: "pro" },
    state,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      prompt: string;
      /** 初次四宫格：与 prompt 同源素材（可仅传 prompt，由服务端回填） */
      sourceText?: string;
      narrativeContext?: string;
      overrides?: Partial<ElevenDimensions>;
      action?: "vary" | "adopt";
      target?: number;
      seed?: string;
      seedId?: string;
      tempState?: SeedState;
      baseState?: SeedState;
      originalText?: string;
      userPrompt?: string;
      manualDoes?: { d: number; o: number; e: number; s: number };
      ownerId?: string;
      /** 总控台已完成的 A→B→C：每格含 system 与 11 维，服务端不再做 extract/lex/render */
      quadrants?: Array<{ finalSystemPrompt: string; dimensions: ElevenDimensions }>;
      varyPipeline?: { finalSystemPrompt: string; dimensions: ElevenDimensions };
    };

    const {
      prompt,
      sourceText: sourceTextRaw,
      narrativeContext: narrativeContextRaw,
      overrides,
      action,
      target,
      seed,
      seedId,
      tempState,
      baseState,
      originalText,
      userPrompt,
      quadrants: quadrantsBody,
      varyPipeline,
    } = body;

    const sourceText = (sourceTextRaw ?? prompt ?? "").trim();
    const narrativeContext = (narrativeContextRaw ?? "").trim();

    const ownerId = String(body.ownerId ?? "default").trim() || "default";

    if (action === "adopt" && seedId && tempState) {
      const base = globalSeedCache.get(seedId);
      if (!base) {
        return NextResponse.json({ error: "Seed not found: " + seedId }, { status: 400 });
      }
      const committed = commitAdoption(base, tempState, prompt);
      globalSeedCache.set(seedId, committed);
      await saveJob(ownerId, {
        id: generateSeedId(),
        prompt: prompt || "(采纳固化)",
        mode: "adopt",
        samples: [],
        seeds: { [seedId]: committed },
        createdAt: Date.now(),
      });
      return NextResponse.json({ ok: true, seedId, state: committed });
    }

    if (action !== "vary" || !seed) {
      const jobPrompt = prompt || sourceText || "(空素材)";
      const st = sourceText || jobPrompt;

      const usePipeline =
        Array.isArray(quadrantsBody) &&
        quadrantsBody.length === 4 &&
        quadrantsBody.every(
          (q) =>
            q &&
            typeof q.finalSystemPrompt === "string" &&
            q.dimensions &&
            typeof q.dimensions.dominance === "number"
        );

      const results = usePipeline
        ? await Promise.all(
            quadrantsBody.map((q, i) =>
              generateOneQuadrantWithPipeline({
                quadrantIndex: i,
                sourceText: st,
                dimensions: q.dimensions,
                finalSystemPrompt: q.finalSystemPrompt,
                originalText,
                userPrompt,
              })
            )
          )
        : await Promise.all(
            [0, 1, 2, 3].map((i) =>
              generateOneQuadrantAbc({
                quadrantIndex: i,
                sourceText: st,
                narrativeContext,
                overrides,
                originalText,
                userPrompt,
              })
            )
          );

      const seedsSnapshot: Record<string, SeedState> = {};
      results.forEach((r) => {
        seedsSnapshot[r.meta.seed] = r.state;
      });

      await saveJob(ownerId, {
        id: generateSeedId(),
        prompt: jobPrompt,
        mode: "gen",
        samples: results,
        seeds: seedsSnapshot,
        createdAt: Date.now(),
      });

      return NextResponse.json(results);
    }

    const resolvedBase = globalSeedCache.get(seed) ?? baseState ?? null;
    if (!resolvedBase) {
      return NextResponse.json({ error: "Seed not found: " + seed }, { status: 400 });
    }

    const targetNum =
      typeof target === "number" && target >= 1 && target <= 4 ? target : 1;

    if (
      varyPipeline &&
      typeof varyPipeline.finalSystemPrompt === "string" &&
      varyPipeline.dimensions &&
      typeof varyPipeline.dimensions.dominance === "number"
    ) {
      const st = (originalText ?? prompt ?? "").trim() || "(空)";
      const single = await generateOneQuadrantWithPipeline({
        quadrantIndex: targetNum - 1,
        sourceText: st,
        dimensions: varyPipeline.dimensions,
        finalSystemPrompt: varyPipeline.finalSystemPrompt,
        originalText,
        userPrompt,
        metaSeedId: seed,
        varyTarget: targetNum,
      });
      await saveJob(ownerId, {
        id: generateSeedId(),
        prompt,
        mode: "vary",
        samples: [single],
        seeds: { [seed]: single.state },
        createdAt: Date.now(),
      });
      return NextResponse.json([single]);
    }

    const variantTargets = [1, 2, 3, 4] as const;
    const shiftedStates = variantTargets.map((t) => calculateInertiaShift(resolvedBase, t));

    const results = await Promise.all(
      shiftedStates.map((state, i) =>
        generateOneVariant(seed, state, i, originalText ?? prompt, userPrompt)
      )
    );

    await saveJob(ownerId, {
      id: generateSeedId(),
      prompt,
      mode: "vary",
      samples: results,
      seeds: { [seed]: resolvedBase },
      createdAt: Date.now(),
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
