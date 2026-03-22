// ══════════════════════════════════════════════════════════
// POST /api/generate — 中枢控制器
// 阶段 A：发散采样（Divergence）—— 4 组互斥种子
// 阶段 B：局部锁定演化（Convergence）—— 1 组对齐种子
// 任务历史：Database/{OWNER_ID}/jobs.json
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { globalSeedCache, generateSeedId, type SeedState } from "@/lib/core/store";
import {
  generateInitialSeeds,
  calculateInertiaShift,
  commitAdoption,
  generateSixElementScript,
} from "@/lib/engines/engine_evolving";
import { saveJob } from "@/lib/vault/io_engine";

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
    };

    const {
      prompt,
      action,
      target,
      seed,
      seedId,
      tempState,
      baseState,
      originalText,
      userPrompt,
    } = body;

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
      const seeds = await generateInitialSeeds(prompt);

      const states: { seedId: string; state: SeedState }[] = seeds.map((state) => {
        const sid = generateSeedId();
        globalSeedCache.set(sid, state);
        return { seedId: sid, state };
      });

      const results = await Promise.all(
        states.map(({ seedId: sid, state }, i) =>
          generateOneVariant(sid, state, i, originalText, userPrompt)
        )
      );

      const seedsSnapshot: Record<string, SeedState> = {};
      states.forEach(({ seedId: sid, state }) => {
        seedsSnapshot[sid] = state;
      });
      await saveJob(ownerId, {
        id: generateSeedId(),
        prompt,
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
