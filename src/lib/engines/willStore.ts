/**
 * @Snapshot engines-willStore-v1
 * @Role 客户端 Zustand：四宫格流与 prompt 快照
 * @Guardrail 禁止 fs；仅内存态
 */
// ══════════════════════════════════════════════════════════
// Global Will Store — Zustand 意志快照
// 将 CreateView 的 streams / prompt 提升到全局内存
// 效果：切换侧边栏时数据常驻内存；刷新后由 /api/history 接管恢复
// ══════════════════════════════════════════════════════════

import { create } from "zustand";
import type { ContentStream } from "@/lib/core/types";

interface WillState {
  // ── 四宫格内容快照 ──────────────────────────────────────
  streams: ContentStream[] | null;
  prompt: string;

  // ── 水合标记：防止组件重挂时重复拉取历史 ────────────────
  hydrated: boolean;

  // ── Actions ────────────────────────────────────────────
  setStreams: (streams: ContentStream[] | null) => void;
  setPrompt: (prompt: string) => void;
  setHydrated: (v: boolean) => void;
  reset: () => void;
}

export const useWillStore = create<WillState>((set) => ({
  streams: null,
  prompt: "",
  hydrated: false,

  setStreams: (streams) => set({ streams }),
  setPrompt: (prompt) => set({ prompt }),
  setHydrated: (v) => set({ hydrated: v }),
  reset: () => set({ streams: null, prompt: "", hydrated: false }),
}));
