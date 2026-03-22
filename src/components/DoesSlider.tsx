"use client";

import { Lock } from "lucide-react";
import type { DimensionDef } from "@/lib/core/types";

export default function DoesSlider({
  dim, value, onChange, isConverging = false,
}: {
  dim: DimensionDef; value: number; onChange: (v: number) => void;
  isConverging?: boolean;
}) {
  const Icon = dim.icon;
  return (
    <div className={`mb-3 relative transition-all duration-300 ${isConverging ? "opacity-90" : ""}`}>
      {isConverging && (
        <div className="absolute -top-0.5 -right-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono animate-pulse"
          style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "0.5px solid rgba(245,158,11,0.25)" }}>
          <Lock size={8} strokeWidth={2.5} />锁定中
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={11} style={{ color: dim.color }} strokeWidth={2} />
          <span className="text-[11px] font-semibold" style={{ color: dim.color }}>{dim.label}</span>
          <span className="text-[9px] text-[#4b5563] font-mono uppercase tracking-wider">{dim.enLabel}</span>
        </div>
        <span className="text-[11px] font-mono text-[#9ca3af]">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={isConverging}
        className={`w-full transition-opacity ${isConverging ? "opacity-70" : ""}`}
        style={{
          background: `linear-gradient(to right, ${dim.color}99 0%, ${dim.color}99 ${value}%, rgba(255,255,255,0.08) ${value}%, rgba(255,255,255,0.08) 100%)`,
          accentColor: dim.color,
        }}
      />
      <p className="text-[9px] text-[#374151] mt-1 leading-tight">{dim.desc}</p>
    </div>
  );
}
