// ══════════════════════════════════════════════════════════
// POST /api/chapters/stream — 流式排版，实时推送进度
// 使用 Server-Sent Events，每扫完一个 8 万字块就推送一次
// ══════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { extractChapterMap } from "@/lib/engines/engine_stable";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json();
        const inputText = String(body.inputText ?? "").trim();

        if (!inputText) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "请提供小说文本" })}\n\n`));
          controller.close();
          return;
        }

        const chapters = await extractChapterMap(inputText);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", chapters })}\n\n`));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "目录提取失败";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
