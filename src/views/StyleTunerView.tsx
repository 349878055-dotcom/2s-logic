"use client";

import { Palette, MapPin, Brain, ArrowUpRight } from "lucide-react";

export default function StyleTunerView({
  onOpenEnv, onOpenChar, envDone, charDone,
}: {
  onOpenEnv: () => void;
  onOpenChar: () => void;
  envDone: boolean;
  charDone: boolean;
}) {
  return (
    <div className="flex flex-1 overflow-hidden bg-[#090909]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette size={18} className="text-[#60a5fa]" strokeWidth={2} />
            <h1 className="text-[20px] font-bold text-white">风格工坊</h1>
            <span className="text-[11px] text-[#4b5563] font-mono">Style Tuner</span>
            <span className="ml-2 text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-full">
              BETA · 开放校准
            </span>
          </div>
          <p className="text-[12px] text-[#6b7280]">选择校准入口，通过 A/B 测试锚定你的创作参数基准</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Card A: Environment Stressor */}
          <div className="relative rounded-2xl overflow-hidden cursor-pointer card-glow-a transition-transform duration-300 hover:scale-[1.01]"
            onClick={onOpenEnv}
            style={{
              background: "linear-gradient(145deg, #0a0e1a 0%, #0d1020 55%, #0a0e18 100%)",
              border: `0.5px solid ${envDone ? "rgba(96,165,250,0.4)" : "rgba(96,165,250,0.15)"}`,
              minHeight: "420px",
            }}>
            <div className="h-1.5 bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#6366f1]" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(ellipse at 20% 40%, #3b82f6 0%, transparent 65%)" }} />
            <div className="p-7 relative flex flex-col h-full" style={{ minHeight: "410px" }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[9px] font-bold text-[#60a5fa] bg-[#60a5fa]/10 border border-[#60a5fa]/25 px-2 py-0.5 rounded-full uppercase tracking-wider">入口 A</span>
                    {envDone && <span className="text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/25 px-2 py-0.5 rounded-full">✓ 已校准</span>}
                  </div>
                  <h2 className="text-[24px] font-black text-white leading-tight mb-1">极端环境塑造</h2>
                  <p className="text-[11.5px] text-[#60a5fa] font-mono tracking-wide">Environment Stressor</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(96,165,250,0.12)", border: "0.5px solid rgba(96,165,250,0.25)" }}>
                  <MapPin size={24} className="text-[#60a5fa]" strokeWidth={1.8} />
                </div>
              </div>
              <p className="text-[12.5px] text-[#9ca3af] leading-[1.85] mb-6">
                设定故事爆发的物理空间与逻辑压强。无论是末世废土、密室对峙还是高维时空，在此定义世界的「物理基调」。
              </p>
              <div className="mb-auto">
                <p className="text-[9.5px] text-[#4b5563] uppercase tracking-widest mb-2.5 font-semibold">校准目标</p>
                <div className="flex flex-wrap gap-2">
                  {[["逻辑压强","#ef4444"],["道德损耗","#f59e0b"],["背景密度","#3b82f6"]].map(([l,c]) => (
                    <span key={l} className="flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-lg"
                      style={{ color: c, background: c + "15", border: `0.5px solid ${c}30` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="text-[10px] text-[#4b5563]">5 轮对比 · 约 3 分钟</div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold"
                  style={{ background: "rgba(96,165,250,0.15)", border: "0.5px solid rgba(96,165,250,0.4)", color: "#60a5fa" }}>
                  开始校准 <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Card B: Character Architect */}
          <div className="relative rounded-2xl overflow-hidden cursor-pointer card-glow-b transition-transform duration-300 hover:scale-[1.01]"
            onClick={onOpenChar}
            style={{
              background: "linear-gradient(145deg, #130a0a 0%, #1a0c0c 55%, #130a0a 100%)",
              border: `0.5px solid ${charDone ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.15)"}`,
              minHeight: "420px",
            }}>
            <div className="h-1.5 bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#eab308]" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(ellipse at 80% 40%, #ef4444 0%, transparent 65%)" }} />
            <div className="p-7 relative flex flex-col h-full" style={{ minHeight: "410px" }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[9px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/25 px-2 py-0.5 rounded-full uppercase tracking-wider">入口 B</span>
                    {charDone && <span className="text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/25 px-2 py-0.5 rounded-full">✓ 已校准</span>}
                  </div>
                  <h2 className="text-[24px] font-black text-white leading-tight mb-1">核心人物塑造</h2>
                  <p className="text-[11.5px] text-[#ef4444] font-mono tracking-wide">Character Architect</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.25)" }}>
                  <Brain size={24} className="text-[#ef4444]" strokeWidth={1.8} />
                </div>
              </div>
              <p className="text-[12.5px] text-[#9ca3af] leading-[1.85] mb-6">
                构建主角的灵魂坐标。通过性格 A/B 测试，锚定人物在面对冲突时的本能反应与深层驱动力。
              </p>
              <div className="mb-auto">
                <p className="text-[9.5px] text-[#4b5563] uppercase tracking-widest mb-2.5 font-semibold">校准目标</p>
                <div className="flex flex-wrap gap-2">
                  {[["底色倾向","#ef4444"],["瞬时动力","#f59e0b"],["对话质感","#10b981"]].map(([l,c]) => (
                    <span key={l} className="flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-lg"
                      style={{ color: c, background: c + "15", border: `0.5px solid ${c}30` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="text-[10px] text-[#4b5563]">5 轮对比 · 约 3 分钟</div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold"
                  style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                  开始校准 <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6 px-5 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[10.5px] text-[#6b7280]">校准器状态：开放运行</span>
          </div>
          <div className="h-3 w-px bg-white/[0.06]" />
          <span className="text-[10.5px] text-[#4b5563]">完成两项校准后，系统自动合并结果并更新全局 D.O.E.S 基准</span>
          <div className="ml-auto flex items-center gap-2 text-[9.5px] text-[#374151] font-mono">
            <div className={`w-1.5 h-1.5 rounded-full ${envDone && charDone ? "bg-[#10b981]" : "bg-[#374151]"}`} />
            {envDone && charDone ? "双轨校准完成" : `${+envDone + +charDone}/2 项已校准`}
          </div>
        </div>
      </div>
    </div>
  );
}
