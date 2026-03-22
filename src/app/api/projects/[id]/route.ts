// ══════════════════════════════════════════════════════════
// GET    /api/projects/[id] — 读取单本项目（config + chapters + personas + Batches）
// PATCH  /api/projects/[id] — 合并写入 config.json
// DELETE /api/projects/[id] — 物理删除整个项目抽屉
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  vaultReadProject,
  patchProjectConfig,
  vaultDeleteProject,
} from "@/lib/vault/io_engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await vaultReadProject(id);
  if (!project) {
    return NextResponse.json({ error: "硬盘上找不到该项目" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await vaultReadProject(id);
  if (!project) {
    return NextResponse.json({ error: "硬盘上找不到该项目" }, { status: 404 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const ok = await patchProjectConfig(id, body);
    if (!ok) {
      return NextResponse.json({ error: "物理覆盖失败" }, { status: 500 });
    }
    const updated = await vaultReadProject(id);
    console.log(`[物理更新] 项目 ${id} 档案已覆盖更新`);
    return NextResponse.json({ success: true, project: updated });
  } catch (e) {
    console.error("[Projects] 物理覆盖失败:", e);
    return NextResponse.json({ error: "物理覆盖失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await vaultDeleteProject(id);
  if (!ok) {
    return NextResponse.json({ error: "硬盘上找不到该项目" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
