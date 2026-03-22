"use client";

import {
  Search, SlidersHorizontal, Grid2X2, Flame, Tag, Heart,
  ChevronLeft, ChevronRight, AlignJustify, Bot, Filter, Star, RotateCcw,
} from "lucide-react";
import { useState } from "react";
import type { ScriptFragment, ConstraintInfo } from "@/lib/core/types";
import { TABS } from "@/lib/engines/constants";
import ConstraintBadge from "@/components/ConstraintBadge";

export default function ExploreView({
  fragments, activeTab, setActiveTab, constraint, onRewrite,
}: {
  fragments: ScriptFragment[];
  activeTab: string;
  setActiveTab: (t: string) => void;
  constraint: ConstraintInfo;
  onRewrite: (frag: ScriptFragment) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedFragment = fragments.find(f => f.id === selectedId);

  return (
    <>
      {/* 搜索栏 */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-[#0d0d0d]">
        <div className="flex-1 flex items-center gap-2.5 bg-[#1a1a1a] border border-white/[0.08] rounded-full px-4 py-2 hover:border-white/[0.14] transition-colors">
          <Search size={13} className="text-[#4b5563]" strokeWidth={1.8} />
          <input type="text" placeholder="搜索剧本片段、场景或角色……"
            className="flex-1 bg-transparent text-[12.5px] text-[#9ca3af] placeholder:text-[#4b5563] outline-none caret-[#ef4444]" />
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.06]"><SlidersHorizontal size={12} className="text-[#6b7280]" strokeWidth={1.8} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.06]"><Grid2X2 size={12} className="text-[#6b7280]" strokeWidth={1.8} /></button>
        </div>
      </div>

      {/* Tab 栏 */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.06] bg-[#0d0d0d]">
        <div className="flex items-center gap-1">
          {TABS.map(({ label, icon: Icon }) => {
            const isActive = activeTab === label;
            return (
              <button key={label} onClick={() => setActiveTab(label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${isActive ? "bg-[#1c1c1c] text-white border border-white/[0.1]" : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.03]"}`}>
                {Icon && <Icon size={11} strokeWidth={2} />}{label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-white/[0.08] rounded-md overflow-hidden">
            <button className="px-2 py-1.5 text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04] border-r border-white/[0.08]"><ChevronLeft size={13} strokeWidth={2} /></button>
            <button className="px-2 py-1.5 text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]"><ChevronRight size={13} strokeWidth={2} /></button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] text-[#9ca3af] border border-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all"><AlignJustify size={11} strokeWidth={2} />浏览全部</button>
          <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-all ${selectedFragment ? "text-white bg-[#ef4444]/[0.15] border border-[#ef4444]/[0.3] hover:bg-[#ef4444]/[0.22]" : "text-[#4b5563] bg-white/[0.04] border border-white/[0.07] cursor-not-allowed"}`}
            onClick={() => selectedFragment && onRewrite(selectedFragment)} disabled={!selectedFragment}>
            <Bot size={11} strokeWidth={2} className="text-[#ef4444]" />AI 重写
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] text-[#9ca3af] border border-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all"><Filter size={11} strokeWidth={2} />过滤器</button>
        </div>
      </div>

      {/* 内容 + 右侧面板 */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-3">
          <div className="masonry-grid">
            {fragments.map((frag) => (
              <div key={frag.id} className="masonry-item group" onClick={() => setSelectedId(frag.id)}>
                <div className={`rounded-md overflow-hidden transition-all bg-[#0f0f14] ${selectedId === frag.id ? "border border-[#ef4444] shadow-[0_0_15px_-5px_rgba(239,68,68,0.5)]" : "border border-white/[0.05] hover:border-white/[0.12]"}`}>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide" style={{ color: frag.tagColor, background: frag.tagColor+"18", border: `0.5px solid ${frag.tagColor}40` }}>{frag.tag}</span>
                      <span className="text-[10px] font-mono text-[#4b5563]">{frag.scene}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.06]"><Star size={10} className="text-[#6b7280]" /></button>
                      <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.06]"><RotateCcw size={10} className="text-[#6b7280]" /></button>
                    </div>
                  </div>
                  <div className="px-3 pt-2 pb-1"><span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">{frag.location}</span></div>
                  <div className="px-3 pb-2">
                    <pre className="text-[11.5px] leading-[1.75] text-[#c4cad4] font-light whitespace-pre-wrap break-words"
                      style={{ fontFamily: "'Noto Serif SC', Georgia, serif" }}>{frag.content}</pre>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04] bg-[#0a0a0d]">
                    <span className="text-[9px] text-[#374151] font-mono">{frag.content.replace(/\s+/g,"").length} 字</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧印章面板 */}
        <aside className="w-[172px] min-w-[172px] border-l border-white/[0.06] bg-[#0c0c0f] flex flex-col overflow-y-auto">
          <div className="px-4 pt-4 pb-2.5 border-b border-white/[0.05]">
            <h2 className="text-[9.5px] font-semibold text-[#374151] uppercase tracking-[0.18em]">风格印章</h2>
          </div>
          <div className="pt-2.5 px-3">
            <ConstraintBadge info={constraint} />
          </div>
        </aside>
      </div>
    </>
  );
}
