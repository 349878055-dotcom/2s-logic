// ══════════════════════════════════════════════════════════
// POST /api/save-segments — 剧本切片落盘 Batches/batch_N.json
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { ClientDatabase, getProjectFromDisk } from "@/lib/vault/io_engine";
import type { SeedState } from "@/lib/core/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = String(body.projectId ?? "").trim();
    const chapterIndex = Number(body.chapterIndex);
    const units = body.units as Array<{
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
    }>;

    if (!projectId) {
      return NextResponse.json({ error: "缺少 projectId" }, { status: 400 });
    }
    if (!Number.isInteger(chapterIndex) || chapterIndex < -1) {
      return NextResponse.json({ error: "无效的 chapterIndex" }, { status: 400 });
    }
    if (!Array.isArray(units)) {
      return NextResponse.json({ error: "units 必须为数组" }, { status: 400 });
    }

    const project = await getProjectFromDisk(projectId);
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const db = new ClientDatabase(project.ownerId);
    await db.saveBatchSegments(projectId, chapterIndex, units);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[Save-Segments API] 失败:", error);
    const message = error instanceof Error ? error.message : "保存片段失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
