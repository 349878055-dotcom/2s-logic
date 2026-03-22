// ══════════════════════════════════════════════════════════
// POST /api/save-index — 原子化保存排版索引 → chapters.json
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { ClientDatabase, getProjectFromDisk } from "@/lib/vault/io_engine";
import type { NovelChapter } from "@/lib/core/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = String(body.projectId ?? "").trim();
    const chapters = body.chapters as Array<{
      title: string;
      summary: string;
      startIndex: number;
      endIndex: number;
      isCompiled: boolean;
      anchor?: string;
    }>;

    if (!projectId) {
      return NextResponse.json({ error: "缺少 projectId" }, { status: 400 });
    }
    if (!Array.isArray(chapters)) {
      return NextResponse.json({ error: "chapters 必须为数组" }, { status: 400 });
    }

    const project = await getProjectFromDisk(projectId);
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const db = new ClientDatabase(project.ownerId);
    await db.saveChapters(projectId, chapters as NovelChapter[]);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[Save-Index API] 失败:", error);
    const message = error instanceof Error ? error.message : "保存索引失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
