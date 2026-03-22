"use client";

import { HelpCircle, Search, ArrowUpRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { HELP_SECTIONS } from "@/lib/engines/constants";

export default function HelpDrawer({ onClose, accentColor }: { onClose: () => void; accentColor: string }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="absolute top-0 bottom-0 left-[148px] w-[380px] bg-[#0d0d11] border-r flex flex-col content-fade-in"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <HelpCircle size={14} strokeWidth={2} style={{ color: accentColor }} />
            <div>
              <h2 className="text-[13.5px] font-bold text-white">开发者文档与逻辑手册</h2>
              <p className="text-[9.5px] text-[#4b5563] font-mono">Logic-Engine Documentation · v2.1.0-beta</p>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.06]">
            <X size={12} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 bg-[#111116] border rounded-lg px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <Search size={11} className="text-[#4b5563]" strokeWidth={1.8} />
            <input placeholder="搜索文档……" className="flex-1 bg-transparent text-[11px] text-[#9ca3af] placeholder:text-[#374151] outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {HELP_SECTIONS.map((sec, si) => (
            <div key={si} className="rounded-lg overflow-hidden border"
              style={{ borderColor: expanded === si ? accentColor + "30" : "rgba(255,255,255,0.05)" }}>
              <button onClick={() => setExpanded(expanded === si ? null : si)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 transition-colors"
                style={{ background: expanded === si ? accentColor + "0c" : "transparent" }}>
                <span className="text-[11.5px] font-semibold text-[#d1d5db]">{sec.title}</span>
                {expanded === si ? <ChevronUp size={12} className="text-[#6b7280]" /> : <ChevronDown size={12} className="text-[#6b7280]" />}
              </button>
              {expanded === si && (
                <div className="px-3.5 pb-3 pt-1 space-y-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {sec.items.map((item, ii) => (
                    <button key={ii} className="w-full text-left flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-white/[0.04] transition-colors group">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: accentColor, opacity: 0.6 }} />
                      <span className="text-[11px] text-[#6b7280] group-hover:text-[#9ca3af] transition-colors">{item}</span>
                      <ArrowUpRight size={9} className="ml-auto text-[#374151] group-hover:text-[#4b5563] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t flex-shrink-0 text-[9.5px] text-[#374151]"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="font-mono">Logic-Engine Research Lab · Internal Docs</span>
          <span className="text-[#4b5563]">Rev. 2026.03</span>
        </div>
      </div>
    </div>
  );
}
