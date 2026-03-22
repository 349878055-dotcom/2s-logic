// POST /api/init-persona — 固化人物档案到项目 config

import { NextRequest, NextResponse } from "next/server";
import { getProjectFromDisk, patchProjectConfig } from "@/lib/vault/io_engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, characters } = body as {
      projectId?: string;
      characters?: Array<{ name: string; summary?: string; bio?: string }>;
    };
    if (!projectId || !Array.isArray(characters)) {
      return NextResponse.json({ error: "缺少 projectId 或 characters" }, { status: 400 });
    }
    const project = await getProjectFromDisk(projectId);
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    const personas = characters
      .map((c) => ({
        name: String(c.name || "").trim() || "未命名",
        summary: String(c.summary ?? c.bio ?? "").trim().slice(0, 80),
      }))
      .filter((p) => p.name !== "未命名");

    const ok = await patchProjectConfig(projectId, { personas });
    if (!ok) {
      return NextResponse.json({ error: "config 写入失败" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: personas.length });
  } catch (error: unknown) {
    console.error("[Init Persona] 失败:", error);
    const message = error instanceof Error ? error.message : "人物档案入库失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
