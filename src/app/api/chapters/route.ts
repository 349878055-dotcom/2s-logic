// POST /api/chapters — 极速扫描全文，生成电子书目录索引
// 用于「索引建立器」：用户上传后先跑此接口，秒出目录

import { NextRequest, NextResponse } from "next/server";
import { extractChapterMap } from "@/lib/engines/engine_stable";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputText = String(body.inputText ?? "").trim();

    if (!inputText) {
      return NextResponse.json({ error: "请提供小说文本" }, { status: 400 });
    }

    const chapters = await extractChapterMap(inputText);

    return NextResponse.json({ chapters });
  } catch (error: unknown) {
    console.error("[Chapters API] 错误:", error);
    const message = error instanceof Error ? error.message : "目录提取失败";
    return NextResponse.json({ error: message, chapters: [] }, { status: 500 });
  }
}
