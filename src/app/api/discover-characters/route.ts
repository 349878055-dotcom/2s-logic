// POST /api/discover-characters — 全书人物普查
// 在服务端调用 OpenAI，避免 API Key 暴露给客户端

import { NextRequest, NextResponse } from "next/server";
import { discoverCharacters } from "@/lib/engines/engine_stable";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputText = String(body.inputText ?? "").trim();
    if (!inputText) {
      return NextResponse.json({ error: "请提供小说文本" }, { status: 400 });
    }
    const result = await discoverCharacters(inputText);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[Discover Characters] 失败:", error);
    const message = error instanceof Error ? error.message : "人物普查失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
