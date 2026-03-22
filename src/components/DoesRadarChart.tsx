"use client";

import type { DoesValues } from "@/lib/core/types";

export default function DoesRadarChart({
  does, size = 120, axisLabels = ["D","O","E","S"],
}: {
  does: DoesValues; size?: number; axisLabels?: string[];
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const axes = [
    { key: "d" as keyof DoesValues, label: axisLabels[0], angle: -90, color: "#ef4444" },
    { key: "o" as keyof DoesValues, label: axisLabels[1], angle:   0, color: "#3b82f6" },
    { key: "e" as keyof DoesValues, label: axisLabels[2], angle:  90, color: "#f59e0b" },
    { key: "s" as keyof DoesValues, label: axisLabels[3], angle: 180, color: "#10b981" },
  ];
  const pt = (angle: number, val: number): [number, number] => {
    const rad = (angle * Math.PI) / 180;
    const dist = (val / 100) * r;
    return [cx + dist * Math.cos(rad), cy + dist * Math.sin(rad)];
  };
  const pts = axes.map(a => pt(a.angle, does[a.key]));
  const lblPts = axes.map(a => pt(a.angle, 118));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(t => (
        <circle key={t} cx={cx} cy={cy} r={r * t} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      ))}
      {axes.map(a => { const e = pt(a.angle, 100); return <line key={a.key} x1={cx} y1={cy} x2={e[0]} y2={e[1]} stroke="rgba(255,255,255,0.09)" strokeWidth="0.5" />; })}
      <polygon points={pts.map(p => p.join(",")).join(" ")} fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.45)" strokeWidth="1" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={axes[i].color} />)}
      {axes.map((a, i) => (
        <text key={a.key} x={lblPts[i][0]} y={lblPts[i][1]} textAnchor="middle" dominantBaseline="middle"
          fill={a.color} fontSize="8.5" fontWeight="bold">{a.label}</text>
      ))}
    </svg>
  );
}
