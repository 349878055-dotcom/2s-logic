"use client";

import { Lock } from "lucide-react";
import type { ConstraintInfo } from "@/lib/core/types";

export default function ConstraintBadge({ info }: { info: ConstraintInfo }) {
  if (!info.active) return null;
  return (
    <div className="mx-3 mb-3 p-2.5 rounded-lg" style={{ background: info.charColor + "0c", border: `0.5px solid ${info.charColor}35` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: info.charColor }} />
          <span className="text-[10px] font-bold tracking-wider" style={{ color: info.charColor }}>受控中</span>
          <span className="text-[9px] text-[#6b7280] font-mono">CONSTRAINED</span>
        </div>
        <Lock size={10} style={{ color: info.charColor }} strokeWidth={2.5} />
      </div>
      <div className="text-[10px] text-[#9ca3af] mb-1.5">
        底色约束：<span style={{ color: info.charColor }}>{info.charName}</span>
      </div>
      {info.activeAnchors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {info.activeAnchors.map(a => (
            <span key={a.id} className="flex items-center gap-0.5 text-[8.5px] px-1.5 py-0.5 rounded anchor-active"
              style={{ color: a.color, background: a.color + "18", border: `0.5px solid ${a.color}30` }}>
              ◆ {a.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
