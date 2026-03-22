"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { NOTIF_LOGS } from "@/lib/engines/constants";

const NOTIF_COLORS = { success: "#10b981", info: "#3b82f6", warn: "#f59e0b" };
const NOTIF_ICONS = { success: "✓", info: "ℹ", warn: "⚠" };

export default function NotifPanel({ onClose, accentColor }: { onClose: () => void; accentColor: string }) {
  const [read, setRead] = useState(new Set<number>());
  return (
    <div className="fixed z-40 content-fade-in" style={{ left: "154px", bottom: "52px" }}>
      <div className="w-[340px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0e0e14", border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <Bell size={13} style={{ color: accentColor }} strokeWidth={2} />
            <span className="text-[12.5px] font-bold text-white">系统日志</span>
            <span className="text-[9px] font-mono text-[#4b5563]">Logic-Gateway</span>
          </div>
          <button onClick={() => setRead(new Set(NOTIF_LOGS.map((_, i) => i)))}
            className="text-[10px] transition-colors" style={{ color: accentColor }}>全部已读</button>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {NOTIF_LOGS.map((log, i) => {
            const isRead = read.has(i);
            const color = NOTIF_COLORS[log.level as keyof typeof NOTIF_COLORS];
            return (
              <button key={i} onClick={() => setRead(prev => new Set([...prev, i]))}
                className="w-full text-left flex items-start gap-3 px-4 py-3 border-b hover:bg-white/[0.02] transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.04)", opacity: isRead ? 0.5 : 1 }}>
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: color + "18", color }}>
                  {NOTIF_ICONS[log.level as keyof typeof NOTIF_ICONS]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[11.5px] font-semibold text-[#d1d5db] truncate">{log.msg}</span>
                    <span className="text-[9px] text-[#374151] flex-shrink-0 font-mono">{log.time}</span>
                  </div>
                  <span className="text-[10px] text-[#4b5563]">{log.detail}</span>
                </div>
                {!isRead && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: accentColor }} />}
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2.5 flex items-center justify-between border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-[9.5px] text-[#374151] font-mono">Logic-Gateway V2.0</span>
          <button onClick={onClose} className="text-[9.5px] text-[#4b5563] hover:text-[#6b7280] transition-colors">关闭</button>
        </div>
      </div>
    </div>
  );
}
