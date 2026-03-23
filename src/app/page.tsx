"use client";

/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/app/page.tsx (ScriptWorkbench)
 * =====================================================================
 * 🎯 [业务逻辑]:
 * 全局视图调度中心。负责管理侧边栏导航状态、个性化开关及各业务 View 的切换。
 * 📥 [进 (Input)]:
 * - 用户交互：点击侧边栏 Nav。
 * - 全局状态：personalizeOn, activeNav。
 * 📤 [出 (Output)]:
 * - 渲染：对应的 View 组件 (Explore/Create/Edit/Transpiler 等)。
 * 🔗 [牵连与边界]:
 * - 依赖：调用 `src/views/` 下的所有大型业务组件。
 * - 禁区：禁止在这里手写复杂的 API Fetch 逻辑，必须通过子组件分发。
 * =====================================================================
 */

import {
  Compass, Wand2, Pencil, Archive, Palette, CheckSquare, Code2,
  ChevronRight as ChevronR,
} from "lucide-react";
import { useState, useRef, Suspense } from "react";

import type { ScriptFragment, CharacterAnchor, ConstraintInfo, DoesValues } from "@/lib/core/types";
import { CHARACTERS, ORIGINAL_FRAGMENTS } from "@/lib/engines/constants";

// ── Layout ──
import Sidebar from "@/components/layout/Sidebar";

// ── Shared Components ──
import MoodboardDrawer from "@/components/MoodboardDrawer";
import LogicAnchorPopover from "@/components/LogicAnchorPopover";

// ── Views ──
import ExploreView from "@/views/ExploreView";
import CreateView from "@/views/CreateView";
import EditView from "@/views/EditView";
import OrganizeView from "@/views/OrganizeView";
import TranspilerView from "@/views/TranspilerView";
import StyleTunerView from "@/views/StyleTunerView";
import TaskView from "@/views/TaskView";

// ── Calibrators ──
import StyleCalibrator from "@/components/calibrators/StyleCalibrator";
import EnvironmentCalibrator from "@/components/calibrators/EnvironmentCalibrator";

// ── Panels ──
import HelpDrawer from "@/components/panels/HelpDrawer";
import NotifPanel from "@/components/panels/NotifPanel";
import ThemePanel from "@/components/panels/ThemePanel";
import ProfileCard from "@/components/panels/ProfileCard";

// ══════════════════════════════════════════════════════════
// ScriptWorkbench — 全局状态调度层
// ══════════════════════════════════════════════════════════
export default function ScriptWorkbench() {
  // ── 路由状态 ──────────────────────────────────────────
  const [activeNav, setActiveNav] = useState("剧本区"); // 当前版本仅开放剧本区
  const [activeTab, setActiveTab] = useState("随机浏览");
  const [initialContext, setInitialContext] = useState<{ text: string; seed: string } | null>(null);

  // ── 逻辑锚定 Popover ──────────────────────────────────
  const [showAnchor, setShowAnchor] = useState(false);
  const anchorBtnRef = useRef<HTMLButtonElement>(null);

  // ── 草稿箱：Create → Edit ─────────────────────────────
  const [draftFragments, setDraftFragments] = useState<ScriptFragment[]>([]);
  const [draftBadge, setDraftBadge] = useState(0);

  // ── 个性化 & 情绪板 ───────────────────────────────────
  const [personalizeOn, setPersonalizeOn] = useState(false);
  const [personalizeCharId, setPersonalizeCharId] = useState<string | null>(null);
  const [moodboardOpen, setMoodboardOpen] = useState(false);
  const [activeAnchorIds, setActiveAnchorIds] = useState<Set<string>>(new Set());
  const [customAnchors, setCustomAnchors] = useState<CharacterAnchor[]>([]);

  const personalizeChar = CHARACTERS.find(c => c.id === personalizeCharId) ?? null;
  const allAnchorsList: CharacterAnchor[] = [...CHARACTERS.flatMap(c => c.anchors), ...customAnchors];
  const activeAnchorsData = allAnchorsList.filter(a => activeAnchorIds.has(a.id));
  const isConstrained = personalizeOn && !!personalizeCharId && activeAnchorIds.size > 0;
  const constraintInfo: ConstraintInfo = {
    active: isConstrained,
    charName: personalizeChar?.name ?? "",
    charColor: personalizeChar?.color ?? "#ef4444",
    activeAnchors: activeAnchorsData,
  };

  const handleToggleAnchor = (anchor: CharacterAnchor) => {
    setActiveAnchorIds(prev => {
      const next = new Set(prev);
      next.has(anchor.id) ? next.delete(anchor.id) : next.add(anchor.id);
      return next;
    });
  };
  const handleAddCustomAnchor = (label: string) => {
    const a: CharacterAnchor = { id: `custom-${Date.now()}`, label, type: "物品", color: "#f59e0b" };
    setCustomAnchors(prev => [...prev, a]);
    setActiveAnchorIds(prev => new Set(prev).add(a.id));
  };

  // ── 性格校准器 ────────────────────────────────────────
  const [calibratorOpen, setCalibratorOpen] = useState(false);
  const [calibrationResults, setCalibrationResults] = useState<Record<string, { label: string; does: DoesValues }>>({});

  const handleCalibrationComplete = (result: { charId: string; label: string; does: DoesValues }) => {
    setCalibrationResults(prev => ({ ...prev, [result.charId]: { label: result.label, does: result.does } }));
    setPersonalizeCharId(result.charId);
    setPersonalizeOn(true);
    setCalibratorOpen(false);
  };

  // ── 环境校准器 ────────────────────────────────────────
  const [envCalibratorOpen, setEnvCalibratorOpen] = useState(false);
  const [environmentResult, setEnvironmentResult] = useState<{ label: string; does: DoesValues } | null>(null);

  const handleEnvCalibrationComplete = (result: { label: string; does: DoesValues }) => {
    setEnvironmentResult(result);
    setEnvCalibratorOpen(false);
  };

  // ── 底部面板状态 ──────────────────────────────────────
  const [helpOpen,    setHelpOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifUnread, setNotifUnread] = useState(3);
  const [themeOpen,   setThemeOpen]   = useState(false);
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [profileOpen, setProfileOpen] = useState(false);

  const closeAllPanels = () => { setHelpOpen(false); setNotifOpen(false); setThemeOpen(false); setProfileOpen(false); };

  // ── 处理函数 ──────────────────────────────────────────
  const handleAdopt = (frag: ScriptFragment) => {
    setDraftFragments(prev => prev.find(f => f.id === frag.id) ? prev : [frag, ...prev]);
    setDraftBadge(n => n + 1);
  };

  const handleNavClick = (label: string) => {
    setActiveNav(label);
    if (label === "编辑") setDraftBadge(0);
    // 仅剧本区可点击，其余 building 状态由 Sidebar disabled 拦截
  };

  const totalCalibrated = Object.keys(calibrationResults).length + (environmentResult ? 1 : 0);
  const [draftOverrides, setDraftOverrides] = useState<Record<number, { content: string; seedId: string }>>({});
  const allEditFragments = [...draftFragments, ...ORIGINAL_FRAGMENTS].map(f => ({ ...f, ...draftOverrides[f.id] }));

  const handleFragmentRewrite = (fragId: number, updates: { content: string; seedId: string }) => {
    setDraftOverrides(prev => ({ ...prev, [fragId]: updates }));
  };
  const handleRevertRewrite = (fragId: number) => {
    setDraftOverrides(prev => { const n = { ...prev }; delete n[fragId]; return n; });
  };

  // ── 顶部标题栏配置 ────────────────────────────────────
  const VIEW_HEADERS: Record<string, { icon: React.ElementType; iconColor: string; title: string; sub: string; extra?: React.ReactNode }> = {
    "探索":    { icon: Compass,      iconColor: "#ef4444", title: "探索",      sub: "基因库案例浏览" },
    "创作":    { icon: Wand2,        iconColor: "#ef4444", title: "创作",      sub: "剧本原型生成器 · 盲盒式四宫格" },
    "编辑":    { icon: Pencil,       iconColor: "#ef4444", title: "编辑",      sub: "逻辑缝合器 · 剧情长卷",
      extra: draftFragments.length > 0
        ? <span className="text-[10px] text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-full">{draftFragments.length} 个草稿</span>
        : null,
    },
    "整理":    { icon: Archive,      iconColor: "#ef4444", title: "整理",      sub: "人物/剧情资产库 · 底色 · 铆钉 · 瞬时参数" },
    "风格工坊": { icon: Palette,     iconColor: "#60a5fa", title: "风格工坊",  sub: "Style Tuner · 环境 + 人物双轨校准",
      extra: totalCalibrated > 0
        ? <span className="text-[10px] text-[#60a5fa] bg-[#60a5fa]/10 border border-[#60a5fa]/20 px-2 py-0.5 rounded-full">{totalCalibrated}/2 已校准</span>
        : null,
    },
    "任务":    { icon: CheckSquare,  iconColor: "#ef4444", title: "实验室任务", sub: "Lab Tasks · 5 项活跃任务" },
    "剧本区": { icon: Code2, iconColor: "#a78bfa", title: "剧本区", sub: "小说➔剧本 · 高维脱水与物理还原" },
  };

  const header = VIEW_HEADERS[activeNav];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-[#d1d5db]">

      {/* ══ 侧边导航栏 ══════════════════════════════════════ */}
      <Sidebar
        activeNav={activeNav}
        onNavClick={handleNavClick}
        draftBadge={draftBadge}
        personalizeOn={personalizeOn}
        onTogglePersonalize={() => setPersonalizeOn(v => !v)}
        personalizeCharId={personalizeCharId}
        onSelectChar={id => setPersonalizeCharId(prev => prev === id ? null : id)}
        calibrationResults={calibrationResults}
        onOpenCalibrator={() => setCalibratorOpen(true)}
        moodboardOpen={moodboardOpen}
        onToggleMoodboard={() => setMoodboardOpen(v => !v)}
        activeAnchorCount={activeAnchorIds.size}
        helpOpen={helpOpen}
        notifOpen={notifOpen}
        notifUnread={notifUnread}
        themeOpen={themeOpen}
        profileOpen={profileOpen}
        accentColor={accentColor}
        onOpenHelp={() => { closeAllPanels(); setHelpOpen(v => !v); }}
        onOpenNotif={() => { closeAllPanels(); setNotifOpen(v => !v); setNotifUnread(0); }}
        onOpenTheme={() => { closeAllPanels(); setThemeOpen(v => !v); }}
        onOpenProfile={() => { closeAllPanels(); setProfileOpen(v => !v); }}
      />

      {/* ══ 主内容区 ════════════════════════════════════════ */}
      <main className="flex flex-col flex-1 overflow-hidden">

        {/* 顶部视图标题栏 */}
        {header && (
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] bg-[#0d0d0d]">
            <div className="flex items-center gap-2">
              <header.icon size={14} style={{ color: header.iconColor }} strokeWidth={2} />
              <span className="text-[13px] font-semibold text-white">{header.title}</span>
              <span className="text-[11px] text-[#4b5563]">{header.sub}</span>
              {header.extra}
            </div>
            <div className="flex-1" />
            {activeNav !== "探索" && activeNav !== "剧本区" && (
              <div className="flex items-center gap-2 text-[10px] text-[#4b5563] font-mono">
                <ChevronR size={10} className="text-[#374151]" />
                <span className="text-[#374151]">探索</span>
                <ChevronR size={10} className="text-[#374151]" />
                <span className={activeNav === "创作" ? "text-[#9ca3af]" : "text-[#374151]"}>创作</span>
                {(activeNav === "编辑" || activeNav === "整理") && (
                  <>
                    <ChevronR size={10} className="text-[#374151]" />
                    <span className={activeNav === "编辑" ? "text-[#9ca3af]" : "text-[#374151]"}>编辑</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 视图路由 */}
        {activeNav === "探索" && (
          <ExploreView
            fragments={ORIGINAL_FRAGMENTS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            constraint={constraintInfo}
            onRewrite={frag => {
              setInitialContext({ text: frag.content, seed: "" }); // 假设 seed 暂时为空
              setActiveNav("创作");
            }}
          />
        )}
        {activeNav === "创作" && (
          <CreateView
            onAdopt={handleAdopt}
            constraint={{ ...constraintInfo, active: false }}
            showAnchor={showAnchor}
            setShowAnchor={setShowAnchor}
            anchorBtnRef={anchorBtnRef}
            initialContext={initialContext}
          />
        )}
        {activeNav === "编辑" && (
          <EditView
            allFragments={allEditFragments}
            constraint={constraintInfo}
            draftOverrides={draftOverrides}
            onFragmentRewrite={handleFragmentRewrite}
            onRevertRewrite={handleRevertRewrite}
          />
        )}
        {activeNav === "整理" && (
          <OrganizeView draftCount={draftFragments.length} />
        )}
        {activeNav === "剧本区" && (
          <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-zinc-500">加载剧本区…</div>}>
            <TranspilerView />
          </Suspense>
        )}
        {activeNav === "风格工坊" && (
          <StyleTunerView
            onOpenEnv={() => setEnvCalibratorOpen(true)}
            onOpenChar={() => setCalibratorOpen(true)}
            envDone={!!environmentResult}
            charDone={Object.keys(calibrationResults).length > 0}
          />
        )}
        {activeNav === "任务" && <TaskView />}

        {/* 情绪板底部抽屉 */}
        {moodboardOpen && (
          <MoodboardDrawer
            activeIds={activeAnchorIds}
            onToggle={handleToggleAnchor}
            customAnchors={customAnchors}
            onAddCustom={handleAddCustomAnchor}
          />
        )}
      </main>

      {/* ══ 逻辑锚定 Popover ════════════════════════════════ */}
      {showAnchor && (
        <LogicAnchorPopover onClose={() => setShowAnchor(false)} anchorRef={anchorBtnRef} />
      )}

      {/* ══ 性格校准器 ══════════════════════════════════════ */}
      {calibratorOpen && (
        <StyleCalibrator
          onClose={() => setCalibratorOpen(false)}
          onComplete={handleCalibrationComplete}
        />
      )}

      {/* ══ 环境校准器 ══════════════════════════════════════ */}
      {envCalibratorOpen && (
        <EnvironmentCalibrator
          onClose={() => setEnvCalibratorOpen(false)}
          onComplete={handleEnvCalibrationComplete}
        />
      )}

      {/* ══ 底部面板组 ══════════════════════════════════════ */}
      {helpOpen    && <HelpDrawer  onClose={() => setHelpOpen(false)}  accentColor={accentColor} />}
      {notifOpen   && <NotifPanel  onClose={() => setNotifOpen(false)}  accentColor={accentColor} />}
      {themeOpen   && <ThemePanel  onClose={() => setThemeOpen(false)}  accentColor={accentColor} setAccentColor={c => { setAccentColor(c); setThemeOpen(false); }} />}
      {profileOpen && <ProfileCard accentColor={accentColor} calibrationCount={totalCalibrated} />}
    </div>
  );
}
