// POST /api/init-persona — 固化人物档案到项目 config

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProjectFromDisk, patchProjectConfig } from "@/lib/vault/io_engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, characters } = body as {
      projectId?: string;
      characters?: Array<{
        name: string;
        summary?: string;
        bio?: string;
        socialBackground?: string;
        entityId?: string;
        personaId?: string;
        aliases?: unknown;
      }>;
    };
    if (!projectId || !Array.isArray(characters)) {
      return NextResponse.json({ error: "缺少 projectId 或 characters" }, { status: 400 });
    }
    const project = await getProjectFromDisk(projectId);
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    const personas = characters
      .map((c) => {
        const name = String(c.name || "").trim() || "未命名";
        const social = String(c.socialBackground ?? c.summary ?? c.bio ?? "").trim().slice(0, 120);
        const aliases = Array.isArray(c.aliases)
          ? c.aliases.map((a) => String(a ?? "").trim()).filter(Boolean).slice(0, 40)
          : [];
        const entityId = typeof c.entityId === "string" && c.entityId.trim() ? c.entityId.trim() : undefined;
        const personaId =
          typeof c.personaId === "string" && c.personaId.trim() ? c.personaId.trim() : randomUUID();
        return {
          personaId,
          name,
          summary: social.slice(0, 80),
          socialBackground: social,
          entityId,
          aliases,
        };
      })
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
