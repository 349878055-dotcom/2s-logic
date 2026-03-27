// ══════════════════════════════════════════════════════════
// POST /api/compile — 核心编译枢纽
// 双轨制调度：Creation(创作演化) vs Parsing(成熟小说降维)
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { fictionLibrary } from "@/lib/core/store";
import { saveBatchSegmentsForProject } from "@/lib/vault/io_engine";
import { formatSixElementScript, seedToSoraPrompt } from "@/lib/engines/will_engine";
import { DehydrationPipeline } from "@/lib/engines/engine_stable";
import { ProductionPipeline } from "@/lib/engines/engine_evolving";
import type { SeedSegment, SeedState } from "@/lib/core/store";

export const maxDuration = 300;
/** child_process / 脱水管线依赖 Node，避免被误配为 Edge 导致运行期崩溃 */
export const runtime = "nodejs";

function novelExcerpt(rawChunk: string, seg: SeedSegment): string {
  const { start, end } = seg.textRange;
  if (end > start && start >= 0 && rawChunk.length >= end) {
    return rawChunk.slice(start, end);
  }
  const t = seg.event_trace?.trigger?.trim();
  return t || "（未能从本批次原文定位 excerpt，以下为事件触发描述）";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      inputText,
      mode = "parsing",
      charId = "main_char",
      charName = "核心主角",
      projectId,
      chapterIndex,
      chapterStartIndex = 0,
    } = body as {
      inputText?: string;
      mode?: "creation" | "parsing";
      charId?: string;
      charName?: string;
      projectId?: string;
      chapterIndex?: number;
      chapterStartIndex?: number;
    };

    if (!inputText || !inputText.trim()) {
      return NextResponse.json({ error: "请提供小说文本" }, { status: 400 });
    }

    const finalCharId = String(charId ?? "main_char").trim() || "main_char";
    const finalCharName = String(charName ?? "核心主角").trim() || "核心主角";

    let pipelineId: string;

    if (mode === "creation") {
      console.log("-> 启动 [创作演化] 管线 (ProductionPipeline)");
      const pipeline = new ProductionPipeline();
      pipelineId = pipeline.id;
      await pipeline.processNovel(finalCharId, finalCharName, inputText);
    } else {
      console.log("-> 启动 [成熟小说降维] 管线 (DehydrationPipeline)");
      const pipeline = new DehydrationPipeline();
      pipelineId = pipeline.id;
      await pipeline.processMatureNovel(finalCharId, finalCharName, inputText);
    }

    const units: Array<{
      id: string;
      novel: string;
      script: string;
      storyboard: string;
      seedState: SeedState;
      textRange: { start: number; end: number };
      anchorText: string;
      event_trace: { trigger: string };
      identity?: { character_name?: string; social_profile: string; social_background?: string };
      characters: Array<{ name: string; seedId: string; seed: SeedState }>;
    }> = [];
    const prefix = `${pipelineId}-`;

    const keys = Array.from(fictionLibrary.keys())
      .filter((k) => k.startsWith(prefix))
      .sort((a, b) => {
        const na = parseInt(a.slice(prefix.length), 10);
        const nb = parseInt(b.slice(prefix.length), 10);
        return (Number.isNaN(na) ? 0 : na) - (Number.isNaN(nb) ? 0 : nb);
      });

    let shotCounter = 1;
    let globalOffset = 0;

    for (const k of keys) {
      const batch = fictionLibrary.get(k);
      if (!batch) continue;

      const raw = batch.rawText;
      const track = batch.characterTracks[finalCharId];
      if (!track) {
        globalOffset += raw.length;
        continue;
      }

      for (const seg of track.segments) {
        const start = globalOffset + seg.textRange.start;
        const end = globalOffset + seg.textRange.end;
        const excerpt = novelExcerpt(raw, seg);

        const finalCharNameResolved =
          seg.identity?.character_name && seg.identity.character_name !== "未命名角色"
            ? seg.identity.character_name
            : finalCharName;

        units.push({
          id: seg.segmentId,
          novel: raw,
          script: formatSixElementScript(seg.script),
          storyboard: seedToSoraPrompt(seg.seed, `SHOT ${String(shotCounter++).padStart(2, "0")}`),
          seedState: seg.seed,
          textRange: { start, end },
          anchorText: excerpt,
          event_trace: { trigger: seg.event_trace?.trigger ?? "剧情推进" },
          identity: seg.identity
            ? {
                character_name: seg.identity.character_name,
                social_profile: seg.identity.social_profile,
                social_background: seg.identity.social_background,
              }
            : undefined,
          characters: [
            {
              name: finalCharNameResolved,
              seedId: seg.segmentId.slice(0, 6),
              seed: seg.seed,
            },
          ],
        });
      }
      globalOffset += raw.length;
    }

    units.sort((a, b) => (a.textRange?.start ?? 0) - (b.textRange?.start ?? 0));

    if (projectId && typeof chapterIndex === "number" && chapterIndex >= -1 && units.length > 0) {
      const unitsForDb = chapterStartIndex
        ? units.map((u) => ({
            ...u,
            textRange: u.textRange
              ? { start: u.textRange.start + chapterStartIndex, end: u.textRange.end + chapterStartIndex }
              : u.textRange,
          }))
        : units;
      await saveBatchSegmentsForProject(projectId, chapterIndex, unitsForDb);
    }

    const payload = {
      units,
      primarySeedId: units.length > 0 ? units[0].id.slice(0, 6) : null,
      lockProgress: mode === "parsing" ? 100 : 60,
    };
    try {
      JSON.stringify(payload);
    } catch (serErr: unknown) {
      console.error("[Compile API] 结果 JSON 序列化失败:", serErr);
      return NextResponse.json(
        {
          error: "编译结果无法序列化，请缩短单章或检查数据",
          detail: serErr instanceof Error ? serErr.message : String(serErr),
        },
        { status: 500 },
      );
    }
    return NextResponse.json(payload);
  } catch (error: unknown) {
    console.error("[Compile API] 致命错误:", error);
    const message = error instanceof Error ? error.message : "编译管线崩溃";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
