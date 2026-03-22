"use client";

import {
  BookOpen, HelpCircle, Bell, Moon, Target,
} from "lucide-react";
import type { DoesValues } from "@/lib/core/types";
import { NAV_TOP, NAV_WORKSPACE, NAV_COMMUNITY, CHARACTERS } from "@/lib/engines/constants";

export interface SidebarProps {
  // 顶部导航
  activeNav: string;
  onNavClick: (label: string) => void;
  draftBadge: number;
  // 个性化
  personalizeOn: boolean;
  onTogglePersonalize: () => void;
  personalizeCharId: string | null;
  onSelectChar: (id: string) => void;
  calibrationResults: Record<string, { label: string; does: DoesValues }>;
  onOpenCalibrator: () => void;
  // 情绪板
  moodboardOpen: boolean;
  onToggleMoodboard: () => void;
  activeAnchorCount: number;
  // 底部面板状态
  helpOpen: boolean;
  notifOpen: boolean;
  notifUnread: number;
  themeOpen: boolean;
  profileOpen: boolean;
  accentColor: string;
  onOpenHelp: () => void;
  onOpenNotif: () => void;
  onOpenTheme: () => void;
  onOpenProfile: () => void;
}

export default function Sidebar({
  activeNav, onNavClick, draftBadge,
  personalizeOn, onTogglePersonalize, personalizeCharId, onSelectChar,
  calibrationResults, onOpenCalibrator,
  moodboardOpen, onToggleMoodboard, activeAnchorCount,
  helpOpen, notifOpen, notifUnread, themeOpen, profileOpen,
  accentColor, onOpenHelp, onOpenNotif, onOpenTheme, onOpenProfile,
}: SidebarProps) {
  return (
    <aside className="flex flex-col w-[148px] min-w-[148px] bg-[#111111] border-r border-white/[0.06] overflow-y-auto">
      {/* 氛围灯顶部色条 */}
      <div className="h-0.5 w-full flex-shrink-0 transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}90, ${accentColor}00)` }} />

      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 mb-1">
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <BookOpen size={12} className="text-black" strokeWidth={2.5} />
        </div>
        <span className="text-[12.5px] font-semibold text-white tracking-wide">剧本工作台</span>
      </div>

      {/* 主导航 */}
      <nav className="px-2 space-y-0.5">
        {NAV_TOP.map(({ icon: Icon, label, status }) => {
          const isActive = activeNav === label;
          const isDraft = label === "编辑" && draftBadge > 0;
          const isBuilding = status === "building";
          return (
            <button
              key={label}
              disabled={isBuilding}
              onClick={() => !isBuilding && onNavClick(label)}
              className={`relative group w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${
                isBuilding ? "opacity-50 cursor-not-allowed text-[#6b7280]" : ""
              } ${isActive ? "bg-[#1c1c1c] text-white" : "text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#d1d5db]"}`}
            >
              <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} style={{ color: isActive ? accentColor : "#6b7280" }} />
              <span className="flex-1 text-left">{label}</span>
              {isBuilding && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap flex-shrink-0">
                  疯狂建设中
                </span>
              )}
              {isDraft && !isBuilding && (
                <span className="w-4 h-4 rounded-full bg-[#ef4444] text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                  {draftBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 工作区 */}
      <div className="mt-4 px-4 mb-1.5">
        <span className="text-[9.5px] font-semibold text-[#4b5563] uppercase tracking-widest">工作区</span>
      </div>
      <nav className="px-2 space-y-0.5">
        {NAV_WORKSPACE.map(({ icon: Icon, label, badge, status }) => {
          const isBuilding = status === "building";

          /* ── 个性化 Toggle（创作视图下隐藏，延后至编辑阶段触发）── */
          if (label === "个性化") {
            if (activeNav === "创作") return null;
            return (
            <div key={label}>
              <button
                disabled={isBuilding}
                onClick={() => !isBuilding && onTogglePersonalize()}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-200 ${personalizeOn ? "breathing" : ""} ${isBuilding ? "opacity-50 cursor-not-allowed" : ""}`}
                style={personalizeOn ? { background: "rgba(239,68,68,0.08)", color: "#ef4444" } : { color: "#9ca3af" }}>
                <Icon size={13} style={{ color: personalizeOn ? "#ef4444" : "#6b7280" }} strokeWidth={personalizeOn ? 2.2 : 1.8} />
                <span className="flex-1 text-left">{label}</span>
                {isBuilding ? (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap flex-shrink-0">疯狂建设中</span>
                ) : (
                  <div className="relative w-7 h-4 rounded-full transition-all duration-200 flex-shrink-0"
                    style={{ background: personalizeOn ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}>
                    <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200"
                      style={{ left: personalizeOn ? "14px" : "2px" }} />
                  </div>
                )}
              </button>

              {/* 角色选择子列表 */}
              {personalizeOn && (
                <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l pl-2.5" style={{ borderColor: "rgba(239,68,68,0.25)" }}>
                  {CHARACTERS.map(char => {
                    const isCalibrated = !!calibrationResults[char.id];
                    return (
                      <button key={char.id} onClick={() => onSelectChar(char.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-all"
                        style={personalizeCharId === char.id
                          ? { background: char.color + "18", color: char.color }
                          : { color: "#6b7280" }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                          style={{ background: char.color + "30", color: char.color }}>
                          {char.initial}
                        </div>
                        <span className="flex-1 text-left truncate">{char.name}</span>
                        {isCalibrated && (
                          <span className="text-[7.5px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                            style={{ color: char.color, background: char.color + "18", border: `0.5px solid ${char.color}35` }}>
                            已校准
                          </span>
                        )}
                        {personalizeCharId === char.id && !isCalibrated && (
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: char.color }} />
                        )}
                      </button>
                    );
                  })}
                  <button onClick={onOpenCalibrator}
                    className="w-full flex items-center gap-2 px-2 py-2 mt-1.5 rounded-md text-[10.5px] font-semibold transition-all hover:bg-white/[0.05]"
                    style={{ color: "#ef4444", border: "0.5px dashed rgba(239,68,68,0.35)" }}>
                    <Target size={10} strokeWidth={2.5} />
                    <span className="flex-1 text-left">启动校准器</span>
                    <span className="text-[8px] text-[#4b5563] font-mono">Style Calibrator</span>
                  </button>
                </div>
              )}
            </div>
          );
          }

          /* ── 情绪板按钮（创作视图下隐藏）── */
          if (label === "情绪板") {
            if (activeNav === "创作") return null;
            return (
            <button
              key={label}
              disabled={isBuilding}
              onClick={() => !isBuilding && onToggleMoodboard()}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-150 ${isBuilding ? "opacity-50 cursor-not-allowed" : ""} ${moodboardOpen ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#d1d5db]"}`}>
              <Icon size={13} style={{ color: moodboardOpen ? "#f59e0b" : "#6b7280" }} strokeWidth={moodboardOpen ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{label}</span>
              {isBuilding && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap flex-shrink-0">疯狂建设中</span>
              )}
              {!isBuilding && activeAnchorCount > 0 && (
                <span className="text-[9px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/25 px-1.5 py-0.5 rounded-full">
                  {activeAnchorCount}
                </span>
              )}
              {!isBuilding && activeAnchorCount === 0 && badge && (
                <span className="text-[9px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-1.5 py-0.5 rounded">{badge}</span>
              )}
            </button>
          );
          }

          /* ── 风格工坊 → 导航 ── */
          if (label === "风格工坊") {
            const isActive = activeNav === "风格工坊";
            return (
              <button
                key={label}
                disabled={isBuilding}
                onClick={() => !isBuilding && onNavClick("风格工坊")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all ${isBuilding ? "opacity-50 cursor-not-allowed" : ""} ${isActive ? "bg-[#1c1c1c] text-white" : "text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#d1d5db]"}`}>
                <Icon size={13} style={{ color: isActive ? "#60a5fa" : "#6b7280" }} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex-1 text-left">{label}</span>
                {isBuilding && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap flex-shrink-0">疯狂建设中</span>
                )}
                {!isBuilding && badge && <span className="text-[9px] font-bold text-[#60a5fa] bg-[#60a5fa]/10 border border-[#60a5fa]/20 px-1.5 py-0.5 rounded">{badge}</span>}
              </button>
            );
          }

          return (
            <button key={label} disabled={isBuilding} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all ${isBuilding ? "opacity-50 cursor-not-allowed" : ""} text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#d1d5db]`}>
              <Icon size={13} className="text-[#6b7280]" strokeWidth={1.8} />
              <span className="flex-1 text-left">{label}</span>
              {isBuilding && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap flex-shrink-0">疯狂建设中</span>}
              {!isBuilding && badge && <span className="text-[9px] font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-1.5 py-0.5 rounded">{badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* 社区 */}
      <div className="mt-4 px-4 mb-1.5">
        <span className="text-[9.5px] font-semibold text-[#4b5563] uppercase tracking-widest">社区</span>
      </div>
      <nav className="px-2 space-y-0.5">
        {NAV_COMMUNITY.map(({ icon: Icon, label, status }) => {
          const isActive = activeNav === label;
          const isBuilding = status === "building";
          return (
            <button
              key={label}
              disabled={isBuilding}
              onClick={() => !isBuilding && onNavClick(label)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-all ${isBuilding ? "opacity-50 cursor-not-allowed" : ""} ${isActive ? "bg-[#1c1c1c] text-white" : "text-[#9ca3af] hover:bg-white/[0.04] hover:text-[#d1d5db]"}`}>
              <Icon size={13} style={{ color: isActive ? "#ef4444" : "#6b7280" }} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{label}</span>
              {isBuilding && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap flex-shrink-0">疯狂建设中</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* 底部工具按钮 */}
      <div className="border-t border-white/[0.06] py-2 px-2 space-y-0.5">
        <button onClick={onOpenHelp}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[11.5px] transition-all ${helpOpen ? "bg-white/[0.06] text-[#d1d5db]" : "text-[#6b7280] hover:bg-white/[0.04] hover:text-[#9ca3af]"}`}>
          <HelpCircle size={12} strokeWidth={1.8} style={{ color: helpOpen ? accentColor : undefined }} />帮助
        </button>

        <button onClick={onOpenNotif}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[11.5px] transition-all ${notifOpen ? "bg-white/[0.06] text-[#d1d5db]" : "text-[#6b7280] hover:bg-white/[0.04] hover:text-[#9ca3af]"}`}>
          <div className="relative flex-shrink-0">
            <Bell size={12} strokeWidth={1.8} style={{ color: notifOpen ? accentColor : undefined }} />
            {notifUnread > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full flex items-center justify-center"
                style={{ background: accentColor, fontSize: "6px", color: "white", fontWeight: "bold" }}>
                {notifUnread}
              </div>
            )}
          </div>
          <span className="flex-1 text-left">更新日志</span>
          {notifUnread > 0 && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: accentColor, background: accentColor + "18" }}>
              {notifUnread} 新
            </span>
          )}
        </button>

        <button onClick={onOpenTheme}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[11.5px] transition-all ${themeOpen ? "bg-white/[0.06] text-[#d1d5db]" : "text-[#6b7280] hover:bg-white/[0.04] hover:text-[#9ca3af]"}`}>
          <Moon size={12} strokeWidth={1.8} style={{ color: themeOpen ? accentColor : undefined }} />
          <span className="flex-1 text-left">深色模式</span>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: accentColor, boxShadow: `0 0 4px ${accentColor}80` }} />
        </button>

        <button onClick={onOpenProfile}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[11.5px] transition-all ${profileOpen ? "bg-white/[0.06] text-[#d1d5db]" : "text-[#6b7280] hover:bg-white/[0.04] hover:text-[#9ca3af]"}`}>
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold flex-shrink-0"
            style={{ background: accentColor + "25", color: accentColor, boxShadow: profileOpen ? `0 0 6px ${accentColor}50` : "none" }}>
            JT
          </div>
          <span className="flex-1 text-left">我的账户</span>
        </button>
      </div>
    </aside>
  );
}
