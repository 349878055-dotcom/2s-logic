"use client";

import { Anchor, RefreshCw, Play, Plus, CheckCircle2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ScriptFragment, ConstraintInfo, ContentStream } from "@/lib/core/types";
import ConstraintBadge from "@/components/ConstraintBadge";
import { useWillStore } from "@/lib/engines/willStore";
import { dispatchWorkflow } from "@/workflow_registry";

const _CARD_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];
const _CARD_SPEEDS = [1.15, 0.82, 1.35, 0.91];
const _RENDER_STAGES = ["采样坐标…", "推理逻辑…", "渲染文字…", "校验输出…"];
const _EVOLUTION_LABELS = ["稳健：维持现状", "激烈：加剧对峙", "温和：试图感化", "变数：意料之外"] as const;

export default function CreateView({
  onAdopt, constraint, showAnchor, setShowAnchor, anchorBtnRef, initialContext,
}: {
  onAdopt: (f: ScriptFragment) => void;
  constraint: ConstraintInfo;
  showAnchor: boolean;
  setShowAnchor: React.Dispatch<React.SetStateAction<boolean>>;
  anchorBtnRef: React.RefObject<HTMLButtonElement | null>;
  initialContext: { text: string; seed: string } | null;
}) {
  const { streams, setStreams, prompt, setPrompt, hydrated, setHydrated } = useWillStore();

  const [referenceBox, setReferenceBox] = useState<{ text: string; seed: string; genre: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCardIndex, setLoadingCardIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState([0, 0, 0, 0]);
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [varyTarget, setVaryTarget] = useState<number | null>(null);
  const promptRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && loadingCardIndex === null) return;
    const indices = loading ? [0, 1, 2, 3] : loadingCardIndex !== null ? [loadingCardIndex] : [];
    const timers = indices.map(i => {
      const spd = _CARD_SPEEDS[i];
      return window.setInterval(() => {
        setProgress(prev => {
          const n = [...prev];
          n[i] = Math.min(99, n[i] + (Math.random() * 5.5 + 1.5) * spd);
          return n;
        });
      }, 80);
    });
    return () => timers.forEach(window.clearInterval);
  }, [loading, loadingCardIndex]);

  useEffect(() => {
    if (initialContext) {
      setReferenceBox({ ...initialContext, genre: "" });
      setPrompt("");
      promptRef.current?.focus();
    }
  }, [initialContext, setPrompt]);

  useEffect(() => {
    if (hydrated) return;
    setHydrated(true);
    (async () => {
      try {
        const data = await dispatchWorkflow({ action: "CREATE_LOAD_HISTORY", payload: {} }) as {
          lastJob: { samples: ContentStream[]; prompt: string } | null;
        } | null;
        if (data?.lastJob) {
          setStreams(data.lastJob.samples);
          setPrompt(data.lastJob.prompt);
        }
      } catch {
        /* 静默 */
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    const fullPrompt = referenceBox ? `${referenceBox.text} ${prompt}`.trim() : prompt.trim();
    if (!fullPrompt || loading) return;
    setVaryTarget(null);
    setLoading(true);
    setStreams(null);
    setProgress([0, 0, 0, 0]);
    try {
      const result = await dispatchWorkflow({
        action: "CREATE_GENERATE_QUAD",
        payload: {
          sourceText: fullPrompt,
          narrativeContext: constraint.charName
            ? `当前约束角色：${constraint.charName}`
            : "无额外约束",
          referenceSeed: referenceBox?.seed || undefined,
        },
      }) as { streams: ContentStream[] };
      setProgress([100, 100, 100, 100]);
      setStreams(result.streams);
    } catch (e) {
      console.error("工厂加工失败:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleVary = async (target: number, cardIndex: number) => {
    if (loading || loadingCardIndex !== null) return;
    const baseStream = streams?.[cardIndex];
    if (!baseStream) return;
    setVaryTarget(target);
    setLoadingCardIndex(cardIndex);
    setProgress(prev => { const n = [...prev]; n[cardIndex] = 0; return n; });
    try {
      const row = await dispatchWorkflow({
        action: "CREATE_VARY_CARD",
        payload: {
          prompt: prompt || baseStream.text.slice(0, 80),
          target,
          seed: baseStream.meta.seed,
        },
      }) as ContentStream | ContentStream[];
      setProgress(prev => { const n = [...prev]; n[cardIndex] = 100; return n; });
      const one = Array.isArray(row) ? row[0] : row;
      const prev = useWillStore.getState().streams;
      const next = [...(prev || [])];
      next[cardIndex] = one;
      setStreams(next);
    } catch (e) {
      console.error("工厂加工失败:", e);
    } finally {
      setLoadingCardIndex(null);
    }
  };

  const handleAdopt = async (stream: ContentStream) => {
    if (stream.meta.mode === "temp_variant" && stream.state) {
      try {
        await dispatchWorkflow({
          action: "CREATE_ADOPT_STREAM",
          payload: {
            seedId: stream.meta.seed,
            tempState: stream.state,
            prompt: prompt || undefined,
          },
        });
      } catch (e) {
        setToast(`采纳固化失败：${e instanceof Error ? e.message : "未知错误"}`);
        setTimeout(() => setToast(null), 3000);
        return;
      }
    }
    onAdopt({
      id: Date.now() + stream.index,
      scene: stream.meta.genre, location: `seed:${stream.meta.seed.slice(0, 6)}`,
      tag: stream.meta.mode === "gen" ? "生成" : "变体",
      tagColor: stream.meta.mode === "gen" ? "#3b82f6" : "#f59e0b",
      content: stream.text, isAdopted: true,
      seedId: stream.meta.seed,
    });
    setAdoptedIds(prev => new Set([...prev, stream.id]));
    setToast(`已加入编辑草稿箱`);
    setTimeout(() => setToast(null), 2500);
  };

  const hasContent = loading || streams;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#090909]">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-medium text-white content-fade-in"
          style={{ background: "rgba(16,185,129,0.14)", border: "0.5px solid rgba(16,185,129,0.3)", backdropFilter: "blur(10px)" }}>
          <CheckCircle2 size={13} className="text-[#10b981]" strokeWidth={2} />{toast}
        </div>
      )}

      <div className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <ConstraintBadge info={constraint} />
          <div className="relative flex items-center gap-3">
            {referenceBox && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10.5px] font-medium text-[#9ca3af] bg-[#1a1a1a] border border-white/[0.08] flex-shrink-0">
                <span>已挂载片段</span>
                <button onClick={() => setReferenceBox(null)} className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-white/[0.08]">
                  <X size={9} className="text-[#6b7280]" />
                </button>
              </div>
            )}
            <div className="flex-shrink-0 text-[11px] font-bold font-mono text-[#4b5563] px-2 py-1 rounded-md"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
              {loading ? (varyTarget ? `V${varyTarget}` : "gen") : "/imagine"}
            </div>
            <input ref={promptRef} value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && void handleSubmit()}
              placeholder="描述你的场景：时间、地点、关键冲突……"
              className="flex-1 bg-[#111116] border rounded-xl px-4 py-3 text-[13px] text-[#d1d5db] placeholder:text-[#374151] outline-none transition-all duration-200"
              style={{ borderColor: loading ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)" }}
            />
          <button onClick={() => void handleSubmit()} disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-[12.5px] font-semibold transition-all flex-shrink-0"
            style={{
              background: loading ? "rgba(239,68,68,0.06)" : prompt.trim() ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
              border: `0.5px solid ${loading ? "rgba(239,68,68,0.2)" : prompt.trim() ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.07)"}`,
              color: loading ? "#4b5563" : prompt.trim() ? "#ef4444" : "#4b5563",
            }}>
            {loading
              ? <><RefreshCw size={13} strokeWidth={2} className="animate-spin" />生成中</>
              : <><Play size={13} strokeWidth={2} />生成</>}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5 px-0.5">
          <button ref={anchorBtnRef} onClick={() => setShowAnchor(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 flex-shrink-0"
            style={{
              background: showAnchor ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.03)",
              border: showAnchor ? "0.5px solid rgba(239,68,68,0.35)" : "0.5px solid rgba(255,255,255,0.07)",
              color: showAnchor ? "#ef4444" : "#6b7280",
            }}>
            <Anchor size={11} strokeWidth={2} />
            <span>定调</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: showAnchor ? "#ef4444" : "#374151" }} />
          </button>
          {streams && !loading && (
            <>
              <div className="h-3 w-px bg-white/[0.07]" />
              <span className="text-[9.5px] text-[#374151] font-mono">{streams[0].meta.seed.slice(0,10)}…</span>
              <div className="h-2.5 w-px bg-white/[0.06]" />
              <span className="text-[9.5px] text-[#374151]">4 段 · content_stream</span>
              <div className="ml-auto text-[9px] text-[#374151] font-mono">悬停卡片显示 V 变体按钮</div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!hasContent && (
          <div className="h-full flex flex-col items-center justify-center gap-5">
            <div className="grid grid-cols-2 gap-3 opacity-[0.06]">
              {[0,1,2,3].map(i => (
                <div key={i} className="w-[180px] h-[130px] rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.15)", background: "#0f0f14" }} />
              ))}
            </div>
            <div className="text-center -mt-2">
              <p className="text-[14px] font-semibold text-[#4b5563] mb-1">输入场景指令并按 Enter</p>
              <p className="text-[11.5px] text-[#374151]">系统将一次性返回 4 段独立剧本片段</p>
            </div>
          </div>
        )}

        {hasContent && (
          <div className="grid grid-cols-2 gap-4" style={{ gridAutoRows: "minmax(220px, auto)" }}>
            {[0,1,2,3].map(i => {
              const color = _CARD_COLORS[i];
              const prog = progress[i];
              const stream = streams?.[i];
              const isThisCardLoading = loadingCardIndex === i;
              const displayStream = isThisCardLoading ? null : stream;

              return (
                <div key={i} className="rounded-2xl overflow-hidden relative group transition-all duration-300"
                  style={{
                    background: "#0c0c11",
                    border: `0.5px solid ${displayStream ? color + "28" : "rgba(255,255,255,0.07)"}`,
                  }}>
                  {!displayStream && (
                    <>
                      <div className="scan-beam" style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }} />
                      <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <span className="text-[11px] font-bold font-mono" style={{ color: color + "80" }}>#{i+1}</span>
                        <span className="text-[10px] font-mono" style={{ color: color + "70" }}>{Math.round(prog)}%</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="flex items-center gap-1.5">
                          {[0,1,2].map(d => (
                            <div key={d} className="w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ background: color, opacity: 0.35 + d * 0.2, animationDelay: `${d * 0.18}s` }} />
                          ))}
                        </div>
                        <span className="text-[10.5px] font-mono" style={{ color: color + "80" }}>
                          {_RENDER_STAGES[Math.floor((prog / 100) * _RENDER_STAGES.length)] ?? "收尾中…"}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.04]">
                        <div className="h-full transition-all duration-100" style={{ width: `${prog}%`, background: color, opacity: 0.65 }} />
                      </div>
                    </>
                  )}

                  {displayStream && (
                    <div className="content-fade-in flex flex-col h-full">
                      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
                      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black font-mono" style={{ color }}>#{displayStream.index}</span>
                          {displayStream.meta.mode !== "gen" && (() => {
                            const m = displayStream.meta.mode.match(/V(\d)/);
                            const n = m ? parseInt(m[1], 10) : 0;
                            const label = n >= 1 && n <= 4 ? ["稳健","激烈","温和","变数"][n - 1] : "变体";
                            return (
                              <span className="text-[8.5px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "0.5px solid rgba(245,158,11,0.2)" }}>
                                {label}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => void handleAdopt(displayStream)} disabled={adoptedIds.has(displayStream.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                            style={adoptedIds.has(displayStream.id)
                              ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "0.5px solid rgba(16,185,129,0.22)" }
                              : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                            {adoptedIds.has(displayStream.id)
                              ? <><CheckCircle2 size={9} strokeWidth={2.5} />已采纳</>
                              : <><Plus size={9} strokeWidth={2} />采纳</>}
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-3 flex-1">
                        <pre className="text-[12.5px] leading-[1.9] whitespace-pre-wrap font-light text-[#c4cad4]"
                          style={{ fontFamily: "'Noto Serif SC', Georgia, serif" }}>
                          {displayStream.text}
                        </pre>
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-2.5 border-t opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <span className="text-[8px] font-mono text-[#2d2d35] mr-0.5">定向演化</span>
                        {[1,2,3,4].map(n => (
                          <button key={n} onClick={() => void handleVary(n, i)} disabled={loading || loadingCardIndex !== null}
                            className="px-2 py-1 rounded-md text-[8.5px] font-medium transition-all hover:opacity-90"
                            style={{
                              color: varyTarget === n ? _CARD_COLORS[n-1] : "#374151",
                              border: `0.5px solid ${varyTarget === n ? _CARD_COLORS[n-1] + "45" : "rgba(255,255,255,0.07)"}`,
                              background: varyTarget === n ? _CARD_COLORS[n-1] + "10" : "transparent",
                            }}
                            title={_EVOLUTION_LABELS[n-1]}>
                            【{_EVOLUTION_LABELS[n-1].split("：")[0]}】
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
