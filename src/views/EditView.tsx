"use client";

import { Layers, Lock, Unlock, Scissors, Wand2, RefreshCw, RotateCcw, Sparkles, User, Film, ChevronDown, ChevronUp, Dna } from "lucide-react";
import { useState, useEffect } from "react";
import type { ScriptFragment, DoesValues, ConstraintInfo } from "@/lib/core/types";
import type { SeedState } from "@/lib/core/store";
import { DIMENSIONS } from "@/lib/engines/constants";
import DoesSlider from "@/components/DoesSlider";
import ConstraintBadge from "@/components/ConstraintBadge";

// ── 语义化演化模式：以该片段的 Seed 为父级，定向偏移 ─────────────────
const EVOLUTION_MODES = [
  { id: 1, label: "稳健：维持现状", hint: "保持 D.O.E.S，仅重写文本", color: "#10b981" },
  { id: 2, label: "激烈：加剧对峙", hint: "D↑ Stress↑", color: "#ef4444" },
  { id: 3, label: "温和：试图感化", hint: "E↑ S↑", color: "#3b82f6" },
  { id: 4, label: "变数：意料之外", hint: "熵值↑ 打破惯性", color: "#f59e0b" },
] as const;

export default function EditView({
  allFragments, constraint, draftOverrides, onFragmentRewrite, onRevertRewrite,
}: {
  allFragments: ScriptFragment[];
  constraint: ConstraintInfo;
  draftOverrides?: Record<number, { content: string; seedId: string }>;
  onFragmentRewrite?: (fragId: number, updates: { content: string; seedId: string }) => void;
  onRevertRewrite?: (fragId: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [contextLock, setContextLock] = useState(false);
  const [lockEnv, setLockEnv] = useState(false);
  const [rewritingId, setRewritingId] = useState<number | null>(null);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [fragmentDoes, setFragmentDoes] = useState<Record<number, DoesValues>>({});
  const [selectedDim, setSelectedDim] = useState<string>("V-D");
  const [realSeedState, setRealSeedState] = useState<SeedState | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [logicPanelOpen, setLogicPanelOpen] = useState(true);

  const selectedFrag = allFragments.find(f => f.id === selectedId);

  useEffect(() => {
    if (!selectedFrag?.seedId) {
      setRealSeedState(null);
      return;
    }
    setSeedLoading(true);
    setRealSeedState(null);
    fetch(`/api/seed?id=${selectedFrag.seedId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: SeedState) => setRealSeedState(data))
      .catch(() => setRealSeedState(null))
      .finally(() => setSeedLoading(false));
  }, [selectedFrag?.seedId]);
  const getDoes = (id: number): DoesValues =>
    fragmentDoes[id] ?? { d: 72, o: 55, e: 88, s: 41 };
  const setDoes = (id: number, d: DoesValues) =>
    setFragmentDoes(prev => ({ ...prev, [id]: d }));

  const handleRewrite = async () => {
    if (!selectedId || rewritingId || !selectedFrag) return;
    await doRewrite(selectedFrag, undefined);
  };

  /** 一键 Upscale：仅文学锐化，不改变任何参数 */
  const handleUpscale = async () => {
    if (!selectedId || rewritingId || !selectedFrag) return;
    await doRewrite(selectedFrag, 1, "[UPSCALE]");
  };

  /** 以指定片段为父级 Seed 进行定向演化（继承演化逻辑） */
  const handleRewriteByVariant = async (frag: ScriptFragment, variantType: number) => {
    if (!frag.seedId || rewritingId) return;
    await doRewrite(frag, variantType, undefined);
  };

  const doRewrite = async (frag: ScriptFragment, variantType?: number, forcePrompt?: string) => {
    const seedId = frag.seedId;
    if (!seedId) return;

    setRewritingId(frag.id);
    const defaultPrompts: Record<number, string> = {
      1: "维持人物现状，仅重写台词表达",
      2: "加剧对峙感，提高驱动力与压力",
      3: "试图感化对方，提高共情与安全感",
      4: "打破惯性，加入意料之外的转折",
    };
    let prompt = forcePrompt ?? (rewritePrompt.trim() || (variantType ? defaultPrompts[variantType] : `基于当前 D.O.E.S 参数（${selectedDim} 主导）微调`));
    if (lockEnv && !forcePrompt) prompt = `[LOCK_ENV] ${prompt}`;
    const manualDoes = variantType === undefined ? getDoes(frag.id) : undefined;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vary",
          seed: seedId,
          prompt,
          originalText: frag.content,
          manualDoes: variantType === undefined ? manualDoes : undefined,
          target: variantType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "请求失败");
      const results = Array.isArray(data) ? data : [data];
      const first = results[0];
      if (first?.text && first?.meta?.seed) {
        onFragmentRewrite?.(frag.id, { content: first.text, seedId: first.meta.seed });
      }
    } catch (err) {
      console.error("[EditView] doRewrite:", err);
    } finally {
      setRewritingId(null);
    }
  };

  const overrides = draftOverrides ?? {};
  const canRewrite = !!selectedFrag?.seedId;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 中央长卷 */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-2.5 border-b border-white/[0.06] bg-[#0a0a0a]/90" style={{ backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-[#9ca3af]" strokeWidth={1.8} />
            <span className="text-[12px] font-semibold text-[#9ca3af]">剧情长卷</span>
            <span className="text-[10px] font-mono text-[#4b5563]">{allFragments.length} 段 · {allFragments.reduce((a, f) => a + (f.content || "").replace(/\s+/g, "").length, 0)} 字</span>
          </div>
          <button onClick={() => setContextLock(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all duration-150"
            style={contextLock
              ? { background: "rgba(59,130,246,0.12)", border: "0.5px solid rgba(59,130,246,0.35)", color: "#3b82f6" }
              : { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
            {contextLock ? <Lock size={12} strokeWidth={2} /> : <Unlock size={12} strokeWidth={2} />}
            锁定上下文
            {contextLock && <span className="text-[9px] bg-[#3b82f6]/20 px-1.5 py-0.5 rounded font-mono">ON</span>}
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-w-[860px] mx-auto">
          {allFragments.map((frag, idx) => {
            const isSelected = selectedId === frag.id;
            const isRewriting = rewritingId === frag.id;
            const content = frag.content;
            const prevFrag = idx > 0 ? allFragments[idx - 1] : undefined;
            const nextFrag = idx < allFragments.length - 1 ? allFragments[idx + 1] : undefined;
            const isRewrote = !!overrides[frag.id];

            return (
              <div key={frag.id}
                onClick={() => !rewritingId && setSelectedId(isSelected ? null : frag.id)}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 relative"
                style={{
                  background: isSelected ? "#131320" : "#0f0f14",
                  border: isSelected ? `0.5px solid ${frag.tagColor}50` : "0.5px solid rgba(255,255,255,0.06)",
                  boxShadow: isSelected ? `0 0 0 1px ${frag.tagColor}15, 0 8px 24px rgba(0,0,0,0.3)` : "none",
                }}>
                {isRewriting && (
                  <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                    <div className="scan-glow" />
                    <div className="scan-beam" />
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <div className="flex items-center gap-3 px-4 pt-3 pb-2.5 border-b border-white/[0.05]">
                  <div className="w-[3px] h-8 rounded-full flex-shrink-0" style={{ background: isSelected ? frag.tagColor : "rgba(255,255,255,0.08)" }} />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide"
                      style={{ color: frag.tagColor, background: frag.tagColor+"18", border: `0.5px solid ${frag.tagColor}40` }}>
                      {frag.tag}
                    </span>
                    {frag.isAdopted && <span className="text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-1.5 py-0.5 rounded">草稿</span>}
                    {isRewrote && <span className="text-[9px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-1.5 py-0.5 rounded">已重塑</span>}
                    <span className="text-[10px] font-mono text-[#4b5563]">{frag.scene}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        {DIMENSIONS.map(dim => (
                          <div key={dim.key} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ color: dim.color, background: dim.colorBg, border: `0.5px solid ${dim.colorBorder}` }}>
                            {dim.key.replace("V-","")}:{getDoes(frag.id)[dim.field]}
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-[9px] font-mono text-[#374151]">{content.replace(/\s+/g,"").length}字</span>
                  </div>
                </div>
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-widest">{frag.location}</span>
                </div>
                <div className="px-4 pb-4">
                  <pre className={`text-[12px] leading-[1.85] font-light whitespace-pre-wrap break-words transition-all duration-300 ${isRewriting ? "opacity-40" : "opacity-100"} ${isRewrote ? "content-fade-in" : ""}`}
                    style={{ fontFamily: "'Noto Serif SC', Georgia, serif", color: isSelected ? "#d4d8e2" : "#9ca3af" }}>
                    {content}
                  </pre>
                </div>
                {frag.seedId && (
                  <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap border-t border-white/[0.04]" onClick={e => e.stopPropagation()}>
                    <span className="text-[8px] font-mono text-[#4b5563] mr-1">定向演化</span>
                    {EVOLUTION_MODES.map(({ id, label, hint, color }) => (
                      <button key={id} onClick={() => handleRewriteByVariant(frag, id)} disabled={!!rewritingId}
                        className="px-2 py-1 rounded-md text-[8.5px] font-medium transition-all hover:opacity-90"
                        style={{
                          color: rewritingId === frag.id ? color : "#6b7280",
                          border: `0.5px solid ${rewritingId === frag.id ? color + "40" : "rgba(255,255,255,0.07)"}`,
                          background: rewritingId === frag.id ? color + "12" : "transparent",
                        }}
                        title={label}>
                        【{label.split("：")[0]}】
                      </button>
                    ))}
                  </div>
                )}
                {contextLock && isSelected && (prevFrag || nextFrag) && (
                  <div className="px-4 pb-3 flex items-center gap-3 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5">
                      <Lock size={9} className="text-[#3b82f6]" strokeWidth={2} />
                      <span className="text-[9.5px] text-[#4b5563]">
                        {prevFrag ? `←「${prevFrag.scene}」` : "← 无上文"}
                        {" · "}
                        {nextFrag ? `「${nextFrag.scene}」→` : "无下文 →"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧参数面板 — 节点编辑器风格 */}
      <aside className="w-[260px] min-w-[260px] border-l border-white/[0.06] bg-[#0a0a0c] flex flex-col overflow-y-auto">
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-0.5">
            <Scissors size={13} className="text-[#ef4444]" strokeWidth={2} />
            <h3 className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-widest">段落参数面板</h3>
          </div>
          <p className="text-[9.5px] text-[#4b5563]">点击长卷中任意段落以激活</p>
        </div>
        <div className="pt-3 px-4">
          <ConstraintBadge info={constraint} />
        </div>

        {!selectedFrag ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a20] border border-white/[0.06] flex items-center justify-center">
              <Scissors size={18} className="text-[#374151]" strokeWidth={1.5} />
            </div>
            <p className="text-[11px] text-[#4b5563] leading-[1.5]">点击左侧长卷中的任意段落，选择维度方向，执行灵感重塑</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 px-4 py-4">
            {/* 模块 A：当前调度演员 */}
            <section className="rounded-xl border overflow-hidden"
              style={{ background: "rgba(236,72,153,0.03)", borderColor: "rgba(236,72,153,0.2)" }}>
              <div className="px-3 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: "rgba(236,72,153,0.15)", background: "rgba(236,72,153,0.06)" }}>
                <User size={12} className="text-[#ec4899]" strokeWidth={2} />
                <span className="text-[10px] font-bold text-[#ec4899] uppercase tracking-wider">🎭 当前调度演员</span>
              </div>
              <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <span className="text-[12px] font-semibold text-[#d1d5db]"
                  style={{ color: constraint.charName ? constraint.charColor : "#9ca3af" }}>
                  {constraint.charName || "当前角色"}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", border: "0.5px solid rgba(236,72,153,0.3)" }}>
                  核心
                </span>
              </div>
              <div className="px-3 py-3 space-y-2">
                {DIMENSIONS.map(dim => (
                  <DoesSlider key={dim.key} dim={dim}
                    value={getDoes(selectedFrag.id)[dim.field]}
                    onChange={v => setDoes(selectedFrag.id, { ...getDoes(selectedFrag.id), [dim.field]: v })}
                    isConverging={!!rewritingId} />
                ))}
                <div className="pt-1">
                  <label className="text-[9px] text-[#6b7280] font-semibold uppercase tracking-widest mb-1.5 block">主导重写维度</label>
                  <div className="grid grid-cols-2 gap-1">
                    {DIMENSIONS.map(dim => (
                      <button key={dim.key} onClick={() => setSelectedDim(dim.key)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-md text-[9.5px] font-semibold transition-all"
                        style={selectedDim === dim.key
                          ? { background: dim.colorBg, border: `0.5px solid ${dim.colorBorder}`, color: dim.color }
                          : { background: "transparent", border: "0.5px solid rgba(255,255,255,0.07)", color: "#6b7280" }}>
                        <dim.icon size={9} strokeWidth={2} />{dim.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-[#6b7280] font-semibold uppercase tracking-widest mb-1 block">调整要求</label>
                  <textarea value={rewritePrompt}
                    onChange={e => setRewritePrompt(e.target.value)}
                    placeholder="描述你希望如何调整这段台词"
                    className="w-full h-14 px-2.5 py-2 rounded-lg text-[10.5px] bg-[#0d0d12] border border-white/[0.08] text-[#d1d5db] placeholder:text-[#4b5563] resize-none outline-none focus:border-[#ec4899]/40 transition-colors"
                    disabled={!!rewritingId} />
                </div>
                {!canRewrite && (
                  <p className="text-[9px] text-[#6b7280]">该片段无 seed，请从创作视图采纳后再重写</p>
                )}
                <button onClick={handleRewrite} disabled={!!rewritingId || !canRewrite}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
                  style={{
                    background: rewritingId ? "rgba(239,68,68,0.05)" : canRewrite ? "rgba(239,68,68,0.14)" : "rgba(255,255,255,0.04)",
                    border: `0.5px solid ${rewritingId ? "rgba(239,68,68,0.15)" : canRewrite ? "rgba(239,68,68,0.40)" : "rgba(255,255,255,0.07)"}`,
                    color: rewritingId ? "#6b7280" : canRewrite ? "#ef4444" : "#4b5563",
                    boxShadow: rewritingId ? "none" : canRewrite ? "0 0 10px rgba(239,68,68,0.08)" : "none",
                  }}>
                  {rewritingId
                    ? <><RefreshCw size={11} strokeWidth={2} className="animate-spin" />参数收敛中……</>
                    : <><Wand2 size={11} strokeWidth={2} />灵感重塑（重写该角色）</>
                  }
                </button>
              </div>
            </section>

            {/* 🧬 11维逻辑引擎透视 */}
            {selectedFrag.seedId && (
              <section className="rounded-xl border overflow-hidden"
                style={{ background: "rgba(16,185,129,0.03)", borderColor: "rgba(16,185,129,0.2)" }}>
                <button onClick={() => setLogicPanelOpen((o) => !o)}
                  className="w-full px-3 py-2.5 border-b flex items-center justify-between gap-2"
                  style={{ borderColor: "rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <Dna size={12} className="text-[#10b981]" strokeWidth={2} />
                    <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">🧬 11维逻辑引擎透视</span>
                  </div>
                  {logicPanelOpen ? <ChevronUp size={12} className="text-[#10b981]" /> : <ChevronDown size={12} className="text-[#10b981]" />}
                </button>
                {logicPanelOpen && (
                  <div className="px-3 py-3 space-y-2.5">
                    {seedLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-[10px] text-[#6b7280]">
                        <RefreshCw size={12} className="animate-spin" strokeWidth={2} />
                        加载中…
                      </div>
                    ) : realSeedState ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[8px] text-[#6b7280] block mb-0.5">后天自我</span>
                            <span className="text-[10px] font-semibold text-[#d1d5db]">{realSeedState.ego_type?.current_dominant ?? "—"}</span>
                          </div>
                          <div className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[8px] text-[#6b7280] block mb-0.5">瞬时目标</span>
                            <span className="text-[10px] font-semibold text-[#d1d5db]">{realSeedState.dynamic_goal?.current_dominant ?? "—"}</span>
                          </div>
                          <div className="rounded-lg px-2 py-1.5 col-span-2" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[8px] text-[#6b7280] block mb-0.5">逻辑链接</span>
                            <span className="text-[10px] font-semibold text-[#d1d5db]">{realSeedState.logic_link?.current_dominant ?? "—"}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#6b7280] block mb-1">环境压强 (Stress)</span>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${realSeedState.stress ?? 0}%`, background: "linear-gradient(90deg, #10b981, #ef4444)" }} />
                          </div>
                          <span className="text-[9px] font-mono text-[#6b7280] mt-0.5">{realSeedState.stress ?? 0}/100</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[8px] text-[#6b7280] block mb-0.5">智商带宽</span>
                            <span className="text-[10px] font-mono font-semibold text-[#d1d5db]">{realSeedState.bandwidth?.mu ?? "—"}</span>
                          </div>
                          <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[8px] text-[#6b7280] block mb-0.5">实时算力</span>
                            <span className="text-[10px] font-mono font-semibold text-[#d1d5db]">{realSeedState.compute ?? "—"}</span>
                          </div>
                        </div>
                        <div className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-[8px] text-[#6b7280] block mb-0.5">意志锚点 {realSeedState.anchor?.locked ? <span className="text-[#ef4444]">[已锁定]</span> : ""}</span>
                          <span className="text-[10px] text-[#d1d5db]">{realSeedState.anchor?.value?.trim() || "无"}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[9px] text-[#6b7280] py-3 text-center">Seed 未命中缓存，可能已过期</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* 模块 B：舞台与环境配置 */}
            <section className="rounded-xl border overflow-hidden"
              style={{ background: "rgba(59,130,246,0.03)", borderColor: "rgba(59,130,246,0.2)" }}>
              <div className="px-3 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: "rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.06)" }}>
                <Film size={12} className="text-[#3b82f6]" strokeWidth={2} />
                <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-wider">🎬 舞台与环境配置</span>
              </div>
              <div className="px-3 py-3">
                <button onClick={() => setLockEnv(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10.5px] font-medium transition-all duration-150"
                  style={lockEnv
                    ? { background: "rgba(59,130,246,0.12)", border: "0.5px solid rgba(59,130,246,0.35)", color: "#60a5fa" }
                    : { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
                  <Lock size={11} strokeWidth={2} />
                  锁定当前场景与布景
                  {lockEnv && <span className="text-[8px] bg-[#3b82f6]/20 px-1.5 py-0.5 rounded font-mono ml-auto">ON</span>}
                </button>
                <p className="text-[8.5px] text-[#4b5563] mt-2 leading-tight">勾选后，灵感重塑时仅改人物微动作/语气，不改环境与道具</p>
              </div>
            </section>

            {/* 全局操作区 */}
            <div className="mt-auto space-y-2">
              <button onClick={handleUpscale} disabled={!!rewritingId || !canRewrite}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[11.5px] font-semibold transition-all duration-200"
                style={{
                  background: rewritingId ? "rgba(255,255,255,0.02)" : canRewrite ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${rewritingId ? "rgba(255,255,255,0.05)" : canRewrite ? "rgba(168,85,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                  color: rewritingId ? "#4b5563" : canRewrite ? "#a78bfa" : "#4b5563",
                }}
                title="文学分辨率提升，保持情节与人物不变">
                <Sparkles size={13} strokeWidth={2} />
                ✨ 一键 Upscale（增加片段清晰度）
              </button>
              {overrides[selectedFrag.id] && (
                <button onClick={() => onRevertRewrite?.(selectedFrag.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10.5px] transition-all"
                  style={{ background: "transparent", border: "0.5px solid rgba(255,255,255,0.07)", color: "#6b7280" }}>
                  <RotateCcw size={10} strokeWidth={2} />还原原始版本
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/[0.04] mt-auto" style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${rewritingId ? "bg-[#ef4444] animate-pulse" : selectedId ? "bg-[#f59e0b]" : "bg-[#10b981] animate-pulse"}`} />
            <span className="text-[10px] text-[#4b5563]">{rewritingId ? "参数收敛中" : selectedId ? "段落已激活" : "等待选中"}</span>
          </div>
          {contextLock && (
            <div className="flex items-center gap-1.5">
              <Lock size={9} className="text-[#3b82f6]" strokeWidth={2} />
              <span className="text-[9.5px] text-[#3b82f6]">上下文锁定激活</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
