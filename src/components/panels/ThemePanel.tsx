"use client";

import { Moon, X } from "lucide-react";
import { ACCENT_OPTIONS } from "@/lib/engines/constants";

export default function ThemePanel({
  onClose, accentColor, setAccentColor,
}: {
  onClose: () => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
}) {
  return (
    <div className="fixed z-40 content-fade-in" style={{ left: "154px", bottom: "52px" }}>
      <div className="w-[260px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0e0e14", border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <Moon size={13} style={{ color: accentColor }} strokeWidth={2} />
            <span className="text-[12.5px] font-bold text-white">界面主题</span>
          </div>
          <button onClick={onClose}><X size={11} className="text-[#6b7280]" /></button>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-[11.5px] text-[#9ca3af]">暗色模式</span>
          <div className="w-9 h-5 rounded-full flex items-center px-0.5"
            style={{ background: accentColor + "40", border: `0.5px solid ${accentColor}50` }}>
            <div className="w-4 h-4 rounded-full bg-white ml-auto" />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
            <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">实验室氛围灯</span>
          </div>
          <div className="space-y-1.5">
            {ACCENT_OPTIONS.map(opt => (
              <button key={opt.color} onClick={() => setAccentColor(opt.color)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                style={accentColor === opt.color
                  ? { background: opt.color + "18", border: `0.5px solid ${opt.color}45` }
                  : { background: "transparent", border: "0.5px solid transparent" }}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 transition-all"
                  style={{ background: opt.color, boxShadow: accentColor === opt.color ? `0 0 8px ${opt.color}60` : "none" }} />
                <div className="flex-1 text-left">
                  <div className="text-[11px] font-semibold text-[#d1d5db]">{opt.label}</div>
                  <div className="text-[9px] text-[#4b5563]">{opt.desc}</div>
                </div>
                {accentColor === opt.color && <div className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
