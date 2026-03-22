// ══════════════════════════════════════════════════════════
// POST /api/solidify-all — 全局常量固化：物理切片驱动
// 一次性接收所有人物名单，逐人物执行 extractTrueGlobalPersona，11 维数据存入 Seed Vault
// 固化完成后物理落盘到 Database/{clientId}/{projectId}/personas.json
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { DehydrationPipeline } from "@/lib/engines/engine_stable";
import { ClientDatabase, getProjectFromDisk } from "@/lib/vault/io_engine";
import type { GlobalPersona } from "@/lib/core/store";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, personaNames, fullText } = body as {
      projectId?: string;
      personaNames?: string[];
      fullText?: string;
    };

    if (!Array.isArray(personaNames) || personaNames.length === 0 || !fullText?.trim()) {
      return NextResponse.json(
        { error: "请提供 personaNames（人物名单数组）和 fullText" },
        { status: 400 }
      );
    }

    const pipeline = new DehydrationPipeline();
    const results: Array<{ name: string; ok: boolean; error?: string }> = [];
    const personas: GlobalPersona[] = [];

    for (const charName of personaNames) {
      const name = String(charName).trim();
      if (!name) continue;
      try {
        const persona = await pipeline.extractGlobalPersona(name, String(fullText).trim());
        results.push({ name, ok: !!persona, error: persona ? undefined : "未识别到足够戏份" });
        if (persona) personas.push(persona);
        await new Promise((r) => setTimeout(r, 2000)); // 物理降速，避免 API 限流
      } catch (e) {
        const msg = e instanceof Error ? e.message : "提取失败";
        results.push({ name, ok: false, error: msg });
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    console.log(`[龙骨引擎] 全局常量固化完成: ${okCount}/${results.length} 个人物`);

    // 物理硬盘存档
    if (projectId?.trim() && personas.length > 0) {
      const project = await getProjectFromDisk(projectId.trim());
      if (project) {
        const clientId = project.ownerId || "default";
        const db = new ClientDatabase(clientId);
        await db.savePersonas(projectId.trim(), personas, true);
      }
    }

    return NextResponse.json({
      ok: true,
      results,
      summary: `${okCount} 个实体已固化`,
    });
  } catch (error: unknown) {
    console.error("[solidify-all] 固化失败:", error);
    const message = error instanceof Error ? error.message : "全局常量固化失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
