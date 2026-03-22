"use client";

import { LayoutGrid, Pin, Plus, CircleDot } from "lucide-react";
import { useState } from "react";
import type { CharacterAnchor } from "@/lib/core/types";
import { CHARACTERS } from "@/lib/engines/constants";

export default function MoodboardDrawer({
  activeIds, onToggle, customAnchors, onAddCustom,
}: {
  activeIds: Set<string>;
  onToggle: (anchor: CharacterAnchor) => void;
  customAnchors: CharacterAnchor[];
  onAddCustom: (label: string) => void;
}) {
  const [customInput, setCustomInput] = useState("");

  const handleAdd = () => {
    if (!customInput.trim()) return;
    onAddCustom(customInput.trim());
    setCustomInput("");
  };

  return (
    <div className="moodboard-enter border-t bg-[#0d0d12] flex flex-col"
      style={{ height: "210px", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <LayoutGrid size={13} className="text-[#f59e0b]" strokeWidth={2} />
        <span className="text-[12px] font-semibold text-white">情绪板 · 锚点库</span>
        <span className="text-[9.5px] text-[#4b5563] font-mono">Moodboard</span>
        {activeIds.size > 0 && (
          <span className="ml-1 text-[9px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/25 px-1.5 py-0.5 rounded-full">
            {activeIds.size} 个激活
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="text-[9.5px] text-[#4b5563]">点击锚点加入全局 Context</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 px-4 py-3 h-full items-start min-w-max">
          {CHARACTERS.map(char => (
            <div key={char.id} className="flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: char.color + "25", color: char.color }}>
                  {char.initial}
                </div>
                <span className="text-[10px] font-semibold" style={{ color: char.color }}>{char.name}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {char.anchors.map(anchor => {
                  const isActive = activeIds.has(anchor.id);
                  return (
                    <button key={anchor.id} onClick={() => onToggle(anchor)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium transition-all duration-200 text-left ${isActive ? "anchor-active" : "hover:opacity-80"}`}
                      style={{
                        background: isActive ? anchor.color + "22" : anchor.color + "0e",
                        border: `0.5px solid ${anchor.color}${isActive ? "55" : "28"}`,
                        color: isActive ? anchor.color : anchor.color + "cc",
                        minWidth: "120px",
                        boxShadow: isActive ? `0 0 8px ${anchor.color}30` : "none",
                      }}>
                      <Pin size={9} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                      <span>{anchor.label}</span>
                      <span className="ml-auto text-[8px] opacity-60">{anchor.type}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: anchor.color }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex-shrink-0 border-l pl-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Plus size={10} className="text-[#6b7280]" strokeWidth={2} />
              <span className="text-[10px] font-semibold text-[#6b7280]">自定义锚点</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {customAnchors.map(a => (
                <button key={a.id} onClick={() => onToggle(a)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium transition-all ${activeIds.has(a.id) ? "anchor-active" : ""}`}
                  style={{
                    background: activeIds.has(a.id) ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.08)",
                    border: `0.5px solid rgba(245,158,11,${activeIds.has(a.id) ? "0.4" : "0.2"})`,
                    color: "#f59e0b", minWidth: "120px",
                  }}>
                  <CircleDot size={9} strokeWidth={2} />{a.label}
                </button>
              ))}
              <div className="flex items-center gap-1.5 mt-1">
                <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder="拖拽或输入文本片段……"
                  className="w-[140px] bg-[#111116] border rounded-md px-2.5 py-1.5 text-[10.5px] text-[#9ca3af] placeholder:text-[#374151] outline-none"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <button onClick={handleAdd}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-colors"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                  <Plus size={11} className="text-[#6b7280]" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
