// ══════════════════════════════════════════════════════════
// POST /api/solidify-persona — 基因定轴：提取单角色全局常数
// 供「第三步：基因定轴」按钮调用，触发 extractTrueGlobalPersona
// 提取成功后物理落盘到 Database/{clientId}/{projectId}/personas.json
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { DehydrationPipeline } from "@/lib/engines/engine_stable";
import { ClientDatabase, getProjectFromDisk } from "@/lib/vault/io_engine";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, charName, fullText } = body as {
      projectId?: string;
      charName?: string;
      fullText?: string;
    };

    if (!charName?.trim() || !fullText?.trim()) {
      return NextResponse.json(
        { error: "请提供 charName 和 fullText" },
        { status: 400 }
      );
    }

    const pipeline = new DehydrationPipeline();
    const persona = await pipeline.extractGlobalPersona(
      String(charName).trim(),
      String(fullText).trim()
    );

    if (!persona) {
      return NextResponse.json(
        { error: `未在文本中识别到 ${charName} 的足够戏份` },
        { status: 200 }
      );
    }

    // 物理硬盘存档（与已有 personas 合并）
    if (projectId?.trim()) {
      const project = await getProjectFromDisk(projectId.trim());
      if (project) {
        const clientId = project.ownerId || "default";
        const db = new ClientDatabase(clientId);
        await db.savePersonas(projectId.trim(), [persona], true);
      }
    }

    return NextResponse.json({ ok: true, persona });
  } catch (error: unknown) {
    console.error("[solidify-persona] 提取失败:", error);
    const message = error instanceof Error ? error.message : "基因定轴失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
