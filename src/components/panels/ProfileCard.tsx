"use client";

export default function ProfileCard({
  accentColor, calibrationCount,
}: {
  accentColor: string;
  calibrationCount: number;
}) {
  const stats = [
    { label: "算力剩余度",   val: 99.9, max: 100, unit: "%",  color: "#10b981" },
    { label: "已校准基因",   val: calibrationCount * 4, max: 255, unit: "/255", color: accentColor },
    { label: "本周生成量",   val: 47,   max: 100,  unit: " 段", color: "#f59e0b" },
  ];
  return (
    <div className="fixed z-40 content-fade-in" style={{ left: "154px", bottom: "52px" }}>
      <div className="w-[280px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0e0e14", border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black flex-shrink-0"
            style={{ background: accentColor + "20", color: accentColor, border: `1px solid ${accentColor}40`, boxShadow: `0 0 12px ${accentColor}30` }}>
            JT
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold text-white">首席创作者</span>
              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: accentColor, background: accentColor + "15", border: `0.5px solid ${accentColor}30` }}>PRO</span>
            </div>
            <span className="text-[10px] text-[#4b5563] font-mono">@narrative_lab</span>
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          {stats.map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#6b7280]">{s.label}</span>
                <span className="text-[11px] font-bold font-mono" style={{ color: s.color }}>{s.val}{s.unit}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full transition-all" style={{ width: `${(s.val / s.max) * 100}%`, background: s.color, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span className="text-[9.5px] text-[#4b5563]">已登录 · 高级算力许可</span>
          <span className="ml-auto text-[9px] text-[#374151] font-mono">v2.1.0-β</span>
        </div>
      </div>
    </div>
  );
}
