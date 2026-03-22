// ══════════════════════════════════════════════════════════
// GET  /api/projects — 扫描 Database/{OWNER_ID}/ 下列出项目
// POST /api/projects — 新建项目抽屉与 config.json
// 账户：?admin= 与 ownerId 等价（监制文档）
// ══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { vaultListProjects, vaultCreateProject } from "@/lib/vault/io_engine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerRaw =
    searchParams.get("admin")?.trim() ||
    searchParams.get("ownerId")?.trim() ||
    "default";

  const projects = await vaultListProjects(ownerRaw);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ownerId = String(body.ownerId ?? "default").trim() || "default";
    const projectName = String(body.name ?? "未命名小说").trim() || "未命名小说";

    const project = await vaultCreateProject(ownerId, projectName);
    return NextResponse.json({ project });
  } catch (e) {
    console.error("建档失败:", e);
    return NextResponse.json(
      { error: "物理建档失败，请检查磁盘权限" },
      { status: 500 }
    );
  }
}
