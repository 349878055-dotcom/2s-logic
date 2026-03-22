"use client";

import {
  FileText, Play, RefreshCw, Sparkles, Save, Plus, X, Folder, Upload, ArrowLeft, ChevronDown, Edit2, Trash2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { SeedState, NovelChapter } from "@/lib/core/store";
import { generateSeedId } from "@/lib/engines/utils";
import { seedToSoraPrompt } from "@/lib/engines/will_engine";
import { calculateInertiaShift, commitAdoption } from "@/lib/engines/engine_evolving";
import { requestContentStream } from "@/lib/engines/utils";
import { getSeedVault } from "@/lib/engines/actions/seedVault";
import type { SeedVaultEntry } from "@/lib/engines/actions/seedVault";

// ── 变体预览项 ─────────────────────────────────────────────
interface VariantItem {
  text: string;
  state: SeedState;
}

// ── 人物轨道（概率云种子）─────────────────────────────────
interface CharacterTrack {
  name: string;
  seedId: string;
  seed: SeedState;
}

// ── 加工单元：逻辑片段 + 人物轨道 ───────────────────────────
interface ProcessUnit {
  id: string;
  novel: string;
  script: string;
  storyboard: string;
  seedState: SeedState;
  /** 指向原文的字符位置（全局坐标），用于左侧高亮联动与后台索引 */
  textRange?: { start: number; end: number };
  anchorText?: string;
  event_trace?: { trigger: string };
  identity?: {
    character_name?: string;
    social_profile: string;
    social_background?: string;
  };
  characters?: CharacterTrack[];
  isReconstructing?: boolean;
  variants?: VariantItem[];
  chapterIndex?: number; // 所属章节索引，用于断点续传
}

// ── 🕵️‍♂️ 监制专属层级钻取：带有物理坐标索引的目录树 ─────────────
function SeedFolderDrillDown({
  units,
  coreExpanded,
  expandedChar,
  selectedFragment,
  onCoreExpand,
  onExpandChar,
  onSelectFragment,
  onFragmentHover,
}: {
  units: ProcessUnit[];
  coreExpanded: boolean;
  expandedChar: string | null;
  selectedFragment: { unitId: string; charName: string; seed: SeedState } | null;
  onCoreExpand: () => void;
  onExpandChar: (char: string | null) => void;
  onSelectFragment: (f: { unitId: string; charName: string; seed: SeedState } | null) => void;
  onFragmentHover: (unitId: string | null) => void;
}) {
  const charMap = new Map<string, { unitId: string; trigger: string; seedId: string; seed: SeedState; offset: number }[]>();

  for (const unit of units) {
    const trigger = unit.event_trace?.trigger?.trim() || "（未标注）";

    let realCharName = "核心主角";
    if (unit.identity?.character_name && unit.identity.character_name !== "未命名角色") {
      realCharName = unit.identity.character_name;
    } else if (unit.characters && unit.characters.length > 0) {
      realCharName = unit.characters[0].name;
    }

    const seedId = unit.id.slice(0, 6) || "—";
    const offset = unit.textRange?.start || 0; // 🚨 获取物理坐标索引

    if (!charMap.has(realCharName)) charMap.set(realCharName, []);
    charMap.get(realCharName)!.push({
      unitId: unit.id,
      trigger,
      seedId,
      seed: unit.seedState,
      offset,
    });
  }
  const characterNames = Array.from(charMap.keys());

  if (characterNames.length === 0) {
    return (
      <div className="py-8 text-center text-[11px] text-gray-500">
        无可用种子索引（请先编译小说）
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto min-h-[120px]">
      <button
        type="button"
        onClick={() => {
          onCoreExpand();
          if (coreExpanded) { onExpandChar(null); onSelectFragment(null); }
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
          coreExpanded ? "bg-amber-500/40 text-amber-100 border border-amber-500/60" : "bg-amber-950/40 text-amber-200 border border-amber-500/30 hover:bg-amber-950/60"
        }`}
      >
        <Folder size={16} className="text-amber-400 flex-shrink-0" />
        提取到的人物全集
      </button>

      {coreExpanded && (
        <>
          <div className="flex-shrink-0 w-px h-8 self-center bg-amber-500/30" />
          <div className="flex flex-col gap-2">
            {characterNames.map((charName) => (
              <button
                key={charName}
                type="button"
                onClick={() => {
                  onExpandChar(expandedChar === charName ? null : charName);
                  onSelectFragment(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors text-left ${
                  expandedChar === charName
                    ? "bg-amber-500/30 text-amber-100 border border-amber-500/50"
                    : "bg-amber-900/20 text-amber-200/90 border border-amber-500/20 hover:bg-amber-900/40"
                }`}
              >
                <Folder size={14} className="text-amber-400/80 flex-shrink-0" />
                {charName}
                <span className="text-[9px] text-amber-500/60 ml-2">({charMap.get(charName)!.length}个切片)</span>
              </button>
            ))}
          </div>
        </>
      )}

      {expandedChar && charMap.has(expandedChar) && (
        <>
          <div className="flex-shrink-0 w-px h-8 self-center bg-amber-500/30" />
          <div className="flex flex-col gap-1.5 min-w-[200px] max-h-[300px] overflow-y-auto pr-2">
            {charMap.get(expandedChar)!
              .sort((a, b) => a.offset - b.offset) // 🚨 严格按原文物理顺序排列
              .map(({ unitId, trigger, seedId, seed, offset }) => (
              <button
                key={unitId}
                type="button"
                onClick={() => onSelectFragment(selectedFragment?.unitId === unitId ? null : { unitId, charName: expandedChar, seed })}
                onMouseEnter={() => onFragmentHover(unitId)}
                onMouseLeave={() => onFragmentHover(null)}
                className={`px-2.5 py-2 rounded-lg text-[10px] text-left transition-colors flex flex-col gap-1 ${
                  selectedFragment?.unitId === unitId
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-cyan-500/80 truncate pr-2">{trigger}</span>
                  <span className="text-[9px] bg-black/40 px-1 rounded border border-white/5 whitespace-nowrap">Idx: {offset}</span>
                </div>
                <div className="flex items-center gap-2 text-[8.5px] text-gray-500">
                  <span>压强(Stress): {seed.stress}</span>
                  <span>算力(Compute): {seed.compute}</span>
                  <span className="font-mono ml-auto">#{seedId}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedFragment && (
        <>
          <div className="flex-shrink-0 w-px h-8 self-center bg-cyan-500/30" />
          <div className="flex-shrink-0 w-[260px] p-3 rounded-xl border border-cyan-500/20 bg-black/50 space-y-3">
            <span className="text-[9px] text-cyan-400/80 uppercase tracking-wider block">全局常数与瞬时负荷监视器</span>
            <div className="space-y-1.5">
              {[
                { key: "d", label: "D", color: "bg-amber-500" },
                { key: "o", label: "O", color: "bg-blue-500" },
                { key: "e", label: "E", color: "bg-rose-500" },
                { key: "s", label: "S", color: "bg-violet-500" },
              ].map(({ key, label, color }) => {
                const c = selectedFragment.seed.does[key as "d" | "o" | "e" | "s"];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-4">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${c.mu}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 w-12">
                      {c.mu}
                      {c.locked && <span className="text-red-400 ml-1">🔒</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <span className="text-[9px] text-gray-500 block">巅峰带宽 (Bandwidth)</span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {selectedFragment.seed.bandwidth.mu} {selectedFragment.seed.bandwidth.locked && "🔒"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 block">当前有效算力 (Compute)</span>
                <span className="text-[10px] font-mono text-red-400 font-bold">{selectedFragment.seed.compute}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 bg-cyan-900/30 rounded text-[9px] text-cyan-300">
                {selectedFragment.seed.ego_type.current_dominant}
              </span>
              <span className="px-1.5 py-0.5 bg-cyan-900/30 rounded text-[9px] text-cyan-300">
                {selectedFragment.seed.dynamic_goal.current_dominant}
              </span>
              <span className="px-1.5 py-0.5 bg-cyan-900/30 rounded text-[9px] text-cyan-300">
                {selectedFragment.seed.logic_link.current_dominant}
              </span>
              {selectedFragment.seed.anchor?.value && (
                <span className="px-1.5 py-0.5 bg-purple-900/30 border border-purple-500/30 rounded text-[9px] text-purple-300 font-bold">
                  锚点: {selectedFragment.seed.anchor.value} {selectedFragment.seed.anchor.locked && "🔒"}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 剧本存档 ─────────────────────────────────────────────
interface ScriptProject {
  id: string;
  name: string;
  units: ProcessUnit[];
  inputText: string;
  seedId?: string | null;
  lockProgress?: number;
  chapters?: NovelChapter[];
  personas?: Array<{ name: string; summary: string }>;
}

function toScriptProject(raw: { id: string; name: string; inputText?: string; chapters?: NovelChapter[]; segments?: ProcessUnit[]; seedId?: string | null; lockProgress?: number; personas?: Array<{ name: string; summary: string }> }): ScriptProject {
  return {
    id: raw.id,
    name: raw.name,
    inputText: raw.inputText ?? "",
    units: raw.segments ?? [],
    chapters: raw.chapters,
    seedId: raw.seedId,
    lockProgress: raw.lockProgress,
    personas: raw.personas,
  };
}

export default function TranspilerView() {
  const searchParams = useSearchParams();
  // 1. 获取网址里的独立账户名（例如 ?admin=张三）
  const urlAccount = searchParams.get("admin");
  // 2. 物理绑定：如果网址里有名字，他就是这个房间的主人；如果没有，默认扔进「游客体验房」
  const OWNER_ID = urlAccount ? urlAccount.trim() : "guest_account";
  // 3. 权限判断：如果账户名里包含 "admin" 或者是你本人的特定名字，就开启「总控面板」
  const isAdmin = OWNER_ID === "boss" || OWNER_ID.includes("admin");

  const [projects, setProjects] = useState<ScriptProject[]>([]);
  const [activeProject, setActiveProject] = useState<ScriptProject | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<"dehydrate" | "control" | "command">("dehydrate");

  const [inputText, setInputText] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiled, setCompiled] = useState(false);
  const [units, setUnits] = useState<ProcessUnit[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSeedId, setCurrentSeedId] = useState<string | null>(null);
  const [lockProgress, setLockProgress] = useState(0);
  const [showSeedVault, setShowSeedVault] = useState(false);
  const [seedVaultData, setSeedVaultData] = useState<SeedVaultEntry[]>([]);
  const [directorInstruction, setDirectorInstruction] = useState("");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [coreExpanded, setCoreExpanded] = useState(false);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [selectedFragment, setSelectedFragment] = useState<{ unitId: string; charName: string; seed: SeedState } | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [chapters, setChapters] = useState<NovelChapter[]>([]);
  const [isExtractingChapters, setIsExtractingChapters] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionLog, setExtractionLog] = useState("");
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [activeChapter, setActiveChapter] = useState<NovelChapter | null>(null);
  const [discoveredCharacters, setDiscoveredCharacters] = useState<Array<{ name: string; summary: string }>>([]);
  const [isDiscoveringCharacters, setIsDiscoveringCharacters] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [compileCharacterPicker, setCompileCharacterPicker] = useState<{ chapter: NovelChapter; index: number } | null>(null);
  const [isCharactersCollapsed, setIsCharactersCollapsed] = useState(false);
  const [isSolidifying, setIsSolidifying] = useState(false);
  const [solidifyProgress, setSolidifyProgress] = useState(0);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🚨 自动追随逻辑
  useEffect(() => {
    if (hoveredUnitId) {
      const element = document.getElementById(`script-unit-${hoveredUnitId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [hoveredUnitId]);

  // 支持多格式喂料：TXT / PDF / EPUB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let extractedText = "";

    setIsExtractingChapters(true);
    setCompileError(null);

    try {
      if (fileName.endsWith(".txt")) {
        const reader = new FileReader();
        extractedText = await new Promise<string>((resolve) => {
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsText(file);
        });
      } else if (fileName.endsWith(".pdf")) {
        const pdfToText = (await import("react-pdftotext")).default;
        extractedText = await pdfToText(file);
      } else if (fileName.endsWith(".epub")) {
        const { initEpubFile } = await import("@lingo-reader/epub-parser");
        const epub = await initEpubFile(file);
        const spine = epub.getSpine();
        let fullContent = "";
        for (const item of spine) {
          const { html } = await epub.loadChapter(item.id);
          fullContent += html.replace(/<[^>]*>?/gm, "") + "\n\n";
        }
        extractedText = fullContent;
      } else {
        alert("不支持的文件格式，请上传 .txt, .pdf 或 .epub");
        return;
      }

      setInputText(extractedText);
      setCompileError(null);
    } catch (err) {
      console.error("文件解析失败:", err);
      setCompileError("文件解析失败，请确保文件未损坏或重试。");
    } finally {
      setIsExtractingChapters(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNewScript = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: OWNER_ID, name: `未命名小说 ${projects.length + 1}` }),
      });
      const data = (await res.json()) as { project?: { id: string; name: string }; error?: string };
      if (!res.ok || !data.project) {
        setCompileError(data.error ?? "项目创建失败");
        return;
      }
      const newProject = toScriptProject({ ...data.project, inputText: "", segments: [], chapters: [] });
      setProjects((prev) => [...prev, newProject]);
      setActiveProject(newProject);
      setUnits([]);
      setInputText("");
      setCompiled(false);
      setCurrentSeedId(null);
      setLockProgress(0);
      setCompileError(null);
      setCoreExpanded(false);
      setExpandedChar(null);
      setSelectedFragment(null);
      setChapters([]);
      setSelectedChapterIndex(null);
    } catch (e) {
      setCompileError(e instanceof Error ? e.message : "项目创建异常");
    }
  };

  const handleProjectChange = async (projectId: string) => {
    const next = projects.find((p) => p.id === projectId);
    if (next) {
      setActiveProject(next);
      setUnits(next.units ?? []);
      setInputText(next.inputText ?? "");
      setCompiled((next.units?.length ?? 0) > 0);
      setChapters(next.chapters ?? []);
      setDiscoveredCharacters(next.personas ?? []);
      setSelectedChapterIndex(null);
      setActiveChapter(null);
      setCurrentSeedId(next.seedId ?? ((next.units?.length ?? 0) > 0 ? generateSeedId() : null));
      setLockProgress(next.lockProgress ?? ((next.units?.length ?? 0) > 0 ? 100 : 0));
      setCoreExpanded(false);
      setExpandedChar(null);
      setSelectedFragment(null);
      return;
    }
    // 从数据库加载（断点续传）
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = (await res.json()) as { project?: { id: string; name: string; inputText?: string; chapters?: NovelChapter[]; segments?: ProcessUnit[]; seedId?: string | null; lockProgress?: number; personas?: Array<{ name: string; summary: string }> } };
      if (!res.ok || !data.project) return;
      const proj = toScriptProject(data.project);
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === proj.id);
        return exists ? prev.map((p) => (p.id === proj.id ? proj : p)) : [...prev, proj];
      });
      setActiveProject(proj);
      setUnits(proj.units ?? []);
      setInputText(proj.inputText ?? "");
      setCompiled((proj.units?.length ?? 0) > 0);
      setChapters(proj.chapters ?? []);
      setDiscoveredCharacters(proj.personas ?? []);
      setSelectedChapterIndex(null);
      setActiveChapter(null);
      setCurrentSeedId(proj.seedId ?? null);
      setLockProgress(proj.lockProgress ?? 0);
      setCoreExpanded(false);
      setExpandedChar(null);
      setSelectedFragment(null);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    if (!activeProject) return;
    setIsSaving(true);
    const payload = {
      name: activeProject.name,
      inputText,
      seedId: currentSeedId,
      lockProgress,
      chapters,
      personas: discoveredCharacters,
      units: [...units],
    };
    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? { ...p, ...payload } : p)));
    setActiveProject((prev) => (prev ? { ...prev, ...payload } : null));
    try {
      await fetch(`/api/projects/${activeProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`[CMD] 项目《${activeProject.name}》已物理固化至数据库`);
    } catch (e) {
      console.error("保存失败:", e);
    }
    setTimeout(() => setIsSaving(false), 600);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("确定要永久删除此项目及其所有逻辑资产吗？此操作不可逆。")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = projects.filter((p) => p.id !== projectId);
        setProjects(remaining);
        setActiveProject(remaining[0] ?? null);
        if (remaining[0]) {
          handleProjectChange(remaining[0].id);
        } else {
          setInputText("");
          setChapters([]);
          setUnits([]);
          setDiscoveredCharacters([]);
          setCompiled(false);
          setCurrentSeedId(null);
          setLockProgress(0);
        }
        console.log(`[CMD] 项目 ID: ${projectId} 已从磁盘抹除`);
      }
    } catch {
      alert("删除失败");
    }
  };

  // 从数据库加载项目列表（断点续传），OWNER_ID 变化时自动重新加载
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    fetch(`/api/projects?ownerId=${OWNER_ID}`)
      .then((r) => r.json())
      .then((data: { projects?: Array<{ id: string; name: string; inputText?: string; chapters?: NovelChapter[]; segments?: ProcessUnit[]; seedId?: string | null; lockProgress?: number; personas?: Array<{ name: string; summary: string }> }> }) => {
        if (cancelled) return;
        const list = data.projects ?? [];
        const mapped = list.map(toScriptProject);
        setProjects(mapped);
        if (mapped.length > 0) {
          setActiveProject(mapped[0]);
          setInputText(mapped[0].inputText ?? "");
          setChapters(mapped[0].chapters ?? []);
          setUnits(mapped[0].units ?? []);
          setDiscoveredCharacters(mapped[0].personas ?? []);
          setCompiled((mapped[0].units?.length ?? 0) > 0);
          setCurrentSeedId(mapped[0].seedId ?? null);
          setLockProgress(mapped[0].lockProgress ?? 0);
        } else {
          setActiveProject(null);
          setInputText("");
          setChapters([]);
          setUnits([]);
          setDiscoveredCharacters([]);
          setCompiled(false);
        }
      })
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, [OWNER_ID]);

  useEffect(() => {
    if (isAdmin) {
      getSeedVault().then(setSeedVaultData);
    }
  }, [isAdmin]);

  /** 建立目录：极速扫描全文，生成章节索引，成功后原子化入库 */
  const handleExtractChapters = async () => {
    const full = (inputText || activeProject?.inputText || "").trim();
    if (!full) return;

    // 如果没有项目，自动建一个，别让监管账户卡住
    let currentProject = activeProject;
    if (!currentProject) {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId: OWNER_ID, name: `未命名小说 ${projects.length + 1}` }),
        });
        const data = (await res.json()) as { project?: { id: string; name: string }; error?: string };
        if (!res.ok || !data.project) {
          setCompileError(data.error ?? "项目创建失败");
          return;
        }
        const newProject = toScriptProject({ ...data.project, inputText: full, segments: [], chapters: [] });
        setProjects((prev) => [...prev, newProject]);
        setActiveProject(newProject);
        currentProject = newProject;
      } catch (e) {
        setCompileError(e instanceof Error ? e.message : "项目创建异常");
        return;
      }
    }

    setIsExtractingChapters(true);
    setCompileError(null);
    setExtractionProgress(0);
    setExtractionLog("");
    try {
      let res = await fetch("/api/chapters/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: full }),
      });
      if (!res.ok || !res.body) {
        setExtractionLog("流式接口不可用，改用普通接口...");
        res = await fetch("/api/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputText: full }),
        });
        const data = (await res.json()) as { chapters?: NovelChapter[]; error?: string };
        if (!res.ok) {
          setCompileError(data.error ?? "目录提取失败");
          return;
        }
        const newChapters = data.chapters ?? [];
        setChapters(newChapters);
        setSelectedChapterIndex(null);
        setActiveChapter(null);
        setUnits([]);
        setCompiled(false);
        setActiveProject((prev) => (prev ? { ...prev, inputText: full, chapters: newChapters } : null));
        setProjects((prev) => prev.map((p) => (p.id === currentProject!.id ? { ...p, inputText: full, chapters: newChapters } : p)));
        setInputText("");
        await fetch("/api/save-index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: currentProject!.id, chapters: newChapters }),
        });
        await fetch(`/api/projects/${currentProject!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputText: full }),
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let newChapters: NovelChapter[] = [];
      let hasError = false;
      const processChunk = (chunk: string) => {
        if (!chunk.startsWith("data: ")) return;
        try {
          const data = JSON.parse(chunk.slice(6)) as {
            type: string;
            progress?: number;
            log?: string;
            chapters?: NovelChapter[];
            error?: string;
          };
          if (data.type === "progress") {
            setExtractionProgress(data.progress ?? 0);
            setExtractionLog(data.log ?? "");
          } else if (data.type === "done" && data.chapters) {
            newChapters = data.chapters;
          } else if (data.type === "error") {
            setCompileError(data.error ?? "目录提取失败");
            hasError = true;
          }
        } catch {
          /* ignore parse errors */
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processChunk(line);
        if (done) {
          if (buffer.trim()) processChunk(buffer.trim());
          break;
        }
        if (hasError) break;
      }
      if (hasError) return;
      setChapters(newChapters);
      setSelectedChapterIndex(null);
      setActiveChapter(null);
      setUnits([]);
      setCompiled(false);
      setActiveProject((prev) => (prev ? { ...prev, inputText: full, chapters: newChapters } : null));
      setProjects((prev) => prev.map((p) => (p.id === currentProject!.id ? { ...p, inputText: full, chapters: newChapters } : p)));
      setInputText("");

      // 立即入库：保存 startIndex、endIndex、anchor
      await fetch("/api/save-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: currentProject!.id, chapters: newChapters }),
      });
      // 同步原文到项目
      await fetch(`/api/projects/${currentProject!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: full }),
      });
    } catch (e) {
      setCompileError(e instanceof Error ? e.message : "目录提取异常");
    } finally {
      setIsExtractingChapters(false);
      setExtractionProgress(0);
      setExtractionLog("");
    }
  };

  /** 全书人物普查：扫描全文，弹出人物列表，并固化到项目档案 */
  const handleDiscoverCharacters = async () => {
    const full = inputText || activeProject?.inputText || "";
    if (!full.trim()) {
      setCompileError("请先载入小说文本");
      return;
    }
    setIsDiscoveringCharacters(true);
    setCompileError(null);
    try {
      const res = await fetch("/api/discover-characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: full }),
      });
      const data = (await res.json()) as { characters?: Array<{ name: string; summary?: string; bio?: string }>; error?: string };
      if (!res.ok) {
        setCompileError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      const list = (data.characters ?? []).map((c) => ({
        name: c.name,
        summary: String(c.summary ?? c.bio ?? "").trim().slice(0, 80),
      }));
      setDiscoveredCharacters(list);
      setShowCharacterModal(true);
      if (activeProject && list.length > 0) {
        await fetch("/api/init-persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: activeProject.id, characters: list }),
        });
        setActiveProject((p) => (p ? { ...p, personas: list } : null));
        setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? { ...p, personas: list } : p)));
      }
    } catch (e) {
      setCompileError(e instanceof Error ? e.message : "人物普查失败");
    } finally {
      setIsDiscoveringCharacters(false);
    }
  };

  /** 全局常量固化：一次性把所有人物名单发给后端进行物理切片扫描，11 维数据存入 Seed Vault */
  const handleSolidifyAll = async () => {
    if (!activeProject || discoveredCharacters.length === 0) return;
    const full = inputText || activeProject.inputText || "";
    if (!full.trim()) {
      setCompileError("请先载入小说文本");
      return;
    }
    setIsSolidifying(true);
    setSolidifyProgress(0);
    setCompileError(null);
    try {
      const personaNames = discoveredCharacters.map((c) => c.name);
      const res = await fetch("/api/solidify-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          personaNames,
          fullText: full,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok) {
        console.log("[龙骨引擎] 全局常量固化成功，11 维数据已存入 Seed Vault");
        setDiscoveredCharacters((prev) => prev.map((c) => ({ ...c, isSolidified: true })));
        setSolidifyProgress(100);
      } else {
        setCompileError(data.error ?? "固化失败");
      }
    } catch (e) {
      console.error("固化失败:", e);
      setCompileError(e instanceof Error ? e.message : "全局常量固化失败");
    } finally {
      setIsSolidifying(false);
      setSolidifyProgress(0);
    }
  };

  /** 按需编译：点击章节时才编译该章节，每一步都记录入库；charName 动态传入，支持人物档案选择 */
  const handleCompileChapter = async (chapter: NovelChapter, index: number, charName: string) => {
    const full = inputText || activeProject?.inputText || "";
    if (!full || !activeProject) return;
    // 切肉坐标防护：endIndex 为 0 或无效时，用全文长度兜底
    const endIdx = chapter.endIndex > chapter.startIndex ? chapter.endIndex : full.length;
    const chapterText = full.slice(chapter.startIndex, endIdx);
    console.log("[监制审计] 准备编译章节:", chapter.title);
    console.log("[监制审计] 物理坐标:", chapter.startIndex, "->", chapter.endIndex);
    console.log("[监制审计] 文本长度:", chapterText.length, "字符");
    console.log("DEBUG: 准备脱水的文本片段：", chapterText.slice(0, 50) + "...");
    if (chapterText.length < 10) {
      setCompileError("物理对齐失败：切片内容过短或为空，请重新生成排版。");
      return;
    }
    if (!chapterText.trim()) {
      console.error("❌ 切肉失败：chapterText 为空，请检查排版坐标封口");
      setCompileError("切肉失败：章节坐标异常，请重新生成排版");
      return;
    }

    setIsCompiling(true);
    setCompiled(false);
    setCompileError(null);
    setUnits([]);
    setSelectedChapterIndex(index);
    setCurrentSeedId(null);
    setLockProgress(0);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: chapterText,
          mode: "parsing",
          charId: "main_char",
          charName,
          projectId: activeProject.id,
          chapterIndex: index,
          chapterStartIndex: chapter.startIndex,
        }),
      });
      const data = (await res.json()) as { units?: ProcessUnit[]; primarySeedId?: string; lockProgress?: number; error?: string };
      const list = data.units ?? [];
      if (!res.ok) {
        setCompileError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (list.length === 0) {
        console.error("❌ 编译空跑：AI 没吐出任何逻辑片段", data.error ? `| 服务端报错: ${data.error}` : "");
        setCompileError(data.error ?? "编译完成但未提取到任何逻辑片段，可能是 AI 安全拦截或人物轨道未识别");
        return;
      }
      // 修正 textRange 为全书全局坐标
      const offset = chapter.startIndex;
      const adjustedUnits = list.map((u) => ({
        ...u,
        textRange: u.textRange
          ? { start: u.textRange.start + offset, end: u.textRange.end + offset }
          : undefined,
      }));
      setUnits(adjustedUnits);
      setCurrentSeedId(data.primarySeedId ?? (list.length > 0 ? generateSeedId() : null));
      setLockProgress(data.lockProgress ?? 100);
      setCompiled(true);
      const updatedChapters = chapters.map((c, i) => (i === index ? { ...c, isCompiled: true } : c));
      setChapters(updatedChapters);
      const withChapterIndex = adjustedUnits.map((u) => ({ ...u, chapterIndex: index }));
      const existingUnits = activeProject.units ?? [];
      const mergedUnits = [...existingUnits.filter((u) => u.chapterIndex !== index), ...withChapterIndex];
      setActiveProject((prev) => (prev ? { ...prev, chapters: updatedChapters, units: mergedUnits } : null));
      setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? { ...p, chapters: updatedChapters, units: mergedUnits } : p)));

      // 立刻入库：保存 11 维逻辑基因和剧本
      await fetch("/api/save-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id, chapterIndex: index, units: adjustedUnits }),
      });
    } catch (e) {
      console.error("🔥 编译彻底崩了，原因如下:", e);
      setCompileError(e instanceof Error ? e.message : "网络或编译异常");
    } finally {
      setIsCompiling(false);
    }
  };

  /** 整本编译（兼容旧流程） */
  const handleCompile = async () => {
    if (!inputText.trim() || !activeProject) return;
    setIsCompiling(true);
    setCompiled(false);
    setCompileError(null);
    setUnits([]);
    setCurrentSeedId(null);
    setLockProgress(0);
    setSelectedChapterIndex(null);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText,
          mode: "parsing",
          projectId: activeProject.id,
          chapterIndex: -1,
        }),
      });
      const data = (await res.json()) as { units?: ProcessUnit[]; primarySeedId?: string; lockProgress?: number; error?: string };
      const list = data.units ?? [];
      if (!res.ok || (list.length === 0 && data.error)) {
        setCompileError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setUnits(list);
      setActiveProject((prev) => (prev ? { ...prev, inputText, units: list } : null));
      setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? { ...p, inputText, units: list } : p)));
      setCurrentSeedId(data.primarySeedId ?? (list.length > 0 ? generateSeedId() : null));
      setLockProgress(data.lockProgress ?? 100);
      setCompiled(true);
      await fetch("/api/save-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProject.id, chapterIndex: -1, units: list }),
      });
    } catch (e) {
      setCompileError(e instanceof Error ? e.message : "网络或编译异常");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleGenerateVariants = async (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, isReconstructing: true, variants: [] } : u))
    );

    try {
      const isVary = !!currentSeedId && units.length > 0;
      const results = await requestContentStream({
        prompt: unit.novel,
        originalText: unit.script,
        userPrompt: directorInstruction || undefined,
        ...(isVary && {
          action: "vary" as const,
          seed: currentSeedId!,
          baseState: unit.seedState,
        }),
      });
      const variants: VariantItem[] = results.map((r) => ({ text: r.text, state: r.state! }));
      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, isReconstructing: false, variants } : u)));
    } catch (err) {
      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, isReconstructing: false } : u)));
    }
  };

  const handleAdoptVariant = (unitId: string, variantIndex: number) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit?.variants?.[variantIndex]) return;

    const adopted = commitAdoption(unit.seedState, unit.variants[variantIndex].state);
    const chars = unit.characters ?? [{ name: "核心主角", seedId: unit.id.slice(0, 6), seed: unit.seedState }];
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              seedState: adopted,
              script: unit.variants![variantIndex].text,
              storyboard: seedToSoraPrompt(adopted, "SHOT 01"),
              variants: [],
              characters: chars.map((c, i) => (i === 0 ? { ...c, seed: adopted } : c)),
            }
          : u
      )
    );
  };

  const highlightInOriginal = (anchorText: string | undefined, full: string) => {
    if (!anchorText?.trim()) return null;
    const idx = full.indexOf(anchorText);
    if (idx < 0) return null;
    return { start: idx, end: idx + anchorText.length };
  };

  const currentStages = [
    { id: "dehydrate" as const, label: "01 高维脱水 (小说➔剧本)", color: "text-cyan-400" },
    { id: "control" as const, label: "02 精度控制 (剧本➔分镜)", color: "text-green-400" },
    { id: "command" as const, label: "03 视频指令 (分镜➔AI命令)", color: "text-purple-400" },
  ];

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#050505] text-[#d1d5db] font-mono">
      {/* 🚀 版本公告：当前仅开放剧本区（可关闭） */}
      {showBanner && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-1.5 flex items-center justify-center gap-2 flex-shrink-0 relative">
          <span className="text-[10px] text-amber-500 font-bold tracking-widest">
            🚀 当前版本仅开放「剧本区」，其他实验室功能（探索、创作、风格工坊）正处于疯狂建设中，敬请期待！
          </span>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-2 p-0.5 rounded hover:bg-amber-500/20 text-amber-500/80 hover:text-amber-500 transition-colors"
            aria-label="关闭公告"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 顶部：喂料口 */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/[0.06] bg-[#0a0a0c] flex flex-col gap-3">
        {compileError && (
          <pre className="text-red-400 text-[10px] max-w-xl max-h-20 overflow-auto whitespace-pre-wrap break-words flex-shrink mb-2">
            脱水异常：{compileError}
          </pre>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewScript}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors flex-shrink-0"
          >
            <Plus size={12} />
            新建项目
          </button>

          <div className="flex-1 flex items-center gap-2">
            <FileText size={14} className="text-[#a78bfa] flex-shrink-0" />
            <span className="text-[12px] font-semibold text-[#d1d5db] flex-shrink-0">原文载入库</span>
          </div>

          {/* 🚨 新增：支持 TXT 文件直传，拒绝卡顿 */}
          <input
            type="file"
            accept=".txt,.pdf,.epub"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-gray-300 transition-colors flex-shrink-0"
          >
            <Upload size={12} />
            上传小说 (.txt, .pdf, .epub)
          </button>

          <textarea
            className="flex-[1.5] min-h-[36px] max-h-[80px] bg-[#0f0f14] border border-white/[0.05] rounded-lg px-3 py-2 text-[12px] text-[#c4cad4] outline-none focus:border-[#a78bfa]/40 transition-colors resize-none"
            placeholder={inputText ? `已载入 ${(inputText.length / 10000).toFixed(2)} 万字...` : "支持 TXT, PDF, EPUB 小说原稿..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="flex flex-col gap-0 flex-shrink-0">
            <button
              onClick={handleExtractChapters}
              disabled={isExtractingChapters || !(inputText || activeProject?.inputText || "").trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/30 hover:bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-400 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtractingChapters ? (
                <><RefreshCw size={12} className="animate-spin" /> 正在生成排版...</>
              ) : (
                <><Folder size={12} /> 生成排版</>
              )}
            </button>
            {isExtractingChapters && (
              <div className="mt-2 w-full space-y-1 min-w-[200px]">
                <div className="flex justify-between text-[9px] text-amber-500 font-mono">
                  <span className="truncate">{extractionLog}</span>
                  <span className="flex-shrink-0 ml-2">{extractionProgress}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-300"
                    style={{ width: `${extractionProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleDiscoverCharacters}
            disabled={isDiscoveringCharacters || !(inputText || activeProject?.inputText || "").trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] text-emerald-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isDiscoveringCharacters ? (
              <><RefreshCw size={12} className="animate-spin" /> 扫描中...</>
            ) : (
              <><Sparkles size={12} /> 全书人物普查</>
            )}
          </button>
          {/* 核心纠偏：删除「基因定轴」，将「逻辑脱水」重构为「全局常量固化」 */}
          <button
            onClick={handleSolidifyAll}
            disabled={isSolidifying || discoveredCharacters.length === 0 || !(inputText || activeProject?.inputText || "").trim() || !activeProject}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-600/30 border border-purple-500/50 text-[11px] text-purple-300 font-bold hover:bg-purple-600/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all disabled:opacity-30 flex-shrink-0"
          >
            {isSolidifying ? (
              <><RefreshCw size={14} className="animate-spin" /> 正在执行全局常量固化 {solidifyProgress}%</>
            ) : (
              <><Sparkles size={14} /> 全局常量固化 (物理切片驱动)</>
            )}
          </button>
        </div>
      </div>

      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-[#0a0a0c] flex-shrink-0">
        <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          >
            <span className="text-[12px] font-semibold text-white truncate max-w-[150px]">
              {activeProject?.name || "选择项目"}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
          {isProjectDropdownOpen && (
            <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-lg p-2">
              {projects.length === 0 ? (
                <div className="text-[11px] text-gray-500 p-2">暂无项目</div>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-[11px] text-white hover:bg-white/10"
                  >
                    {editingProjectId === p.id ? (
                      <input
                        autoFocus
                        className="flex-1 min-w-0 bg-white/10 rounded px-2 py-1 text-[11px] text-white border border-cyan-500/50 outline-none"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          const name = editingName.trim();
                          if (name) {
                            setActiveProject((prev) => (prev?.id === p.id ? { ...prev, name } : prev));
                            setProjects((prev) => prev.map((proj) => (proj.id === p.id ? { ...proj, name } : proj)));
                            fetch(`/api/projects/${p.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name }),
                            }).catch(console.error);
                          }
                          setEditingProjectId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="truncate flex-1 cursor-pointer"
                        onClick={() => {
                          handleProjectChange(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                      >
                        {p.name}
                      </span>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProjectId === p.id) return;
                          setEditingProjectId(p.id);
                          setEditingName(p.name);
                        }}
                        disabled={editingProjectId !== null}
                        className="p-1 rounded text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-40"
                        title="修改名字"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        disabled={projects.length <= 1}
                        className="p-1 rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="删除项目"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            {currentStages.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStage(s.id)}
                className={`text-[12px] font-bold tracking-widest transition-all ${currentStage === s.id ? s.color : "text-gray-600 hover:text-gray-400"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] px-3 py-1 bg-black/50 border border-white/10 rounded text-gray-400">
            当前独立数据库: <span className="text-cyan-400 font-bold ml-1">{OWNER_ID}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !activeProject}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded text-[11px] font-semibold text-white transition-colors"
          >
            <Save size={12} />
            {isSaving ? "保存中..." : "保存存档"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 人物逻辑底座：支持折叠与永久显示 */}
        {activeProject && discoveredCharacters.length > 0 && (
          <div className="mb-6 mx-6 mt-4 flex-shrink-0 rounded-xl border border-emerald-500/20 bg-emerald-950/10 overflow-hidden transition-all">
            {/* 面板头部：点击整行可折叠 */}
            <div
              className="flex cursor-pointer items-center justify-between border-b border-emerald-500/10 bg-emerald-500/5 px-4 py-2 hover:bg-emerald-500/10"
              onClick={() => setIsCharactersCollapsed(!isCharactersCollapsed)}
            >
              <div className="flex items-center gap-2">
                <div className={`transition-transform duration-200 ${isCharactersCollapsed ? "-rotate-90" : "rotate-0"}`}>
                  <ChevronDown size={14} className="text-emerald-500/60" />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  人物逻辑底座 (已同步至 Seed Vault)
                </h3>
                <span className="font-mono text-[9px] text-emerald-500/40">
                  [{discoveredCharacters.length} 个实体已固化]
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDiscoverCharacters();
                }}
                disabled={isDiscoveringCharacters}
                className="flex items-center gap-1 text-[10px] text-gray-500 transition-colors hover:text-emerald-400"
              >
                <RefreshCw size={10} className={isDiscoveringCharacters ? "animate-spin" : ""} />
                [ 重新扫描全书 ]
              </button>
            </div>
            {!isCharactersCollapsed && (
              <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 lg:grid-cols-6 animate-in slide-in-from-top-1 duration-200">
                {discoveredCharacters.map((char, i) => (
                  <div key={i} className="group relative rounded-lg border border-white/5 bg-black/40 p-3 transition-all hover:border-emerald-500/40">
                    <div className="truncate text-[11px] font-bold text-emerald-500">{char.name}</div>
                    <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-gray-500">
                      {char.summary}
                    </p>
                    <div className="absolute left-0 top-full z-50 mt-2 hidden w-48 rounded border border-emerald-500/50 bg-[#0c0c0f] p-2 text-[10px] leading-relaxed text-gray-300 shadow-2xl group-hover:block">
                      {char.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {chapters.length > 0 ? (
          /* 目录导航模式：左侧剧本卷轴，右侧按需加载 */
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/2 p-6 border-r border-white/5 overflow-y-auto">
              <h3 className="text-[10px] uppercase text-gray-500 mb-4 tracking-tighter">剧本卷轴 · 点击加载</h3>
              {activeChapter ? (
                <div className="chapter-detail-view animate-in fade-in duration-300">
                  <button
                    type="button"
                    onClick={() => setActiveChapter(null)}
                    className="mb-4 text-amber-500 hover:text-amber-400 flex items-center gap-2 text-xs"
                  >
                    <ArrowLeft size={14} /> 返回章节目录
                  </button>
                  <h2 className="text-xl text-amber-500 font-bold mb-6 border-b border-amber-500/30 pb-2">
                    {activeChapter.title}
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        const idx = chapters.findIndex((c) => c.startIndex === activeChapter.startIndex);
                        if (idx < 0) return;
                        if (discoveredCharacters.length > 0) {
                          setCompileCharacterPicker({ chapter: activeChapter, index: idx });
                        } else {
                          handleCompileChapter(activeChapter, idx, "核心主角");
                        }
                      }}
                      disabled={isCompiling}
                      className="text-[11px] px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
                    >
                      {isCompiling ? "编译中..." : "编译此章"}
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-300 font-serif">
                    {(inputText || activeProject?.inputText || "").slice(activeChapter.startIndex, activeChapter.endIndex)}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveChapter(ch);
                      }}
                      disabled={isCompiling}
                      className={`text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedChapterIndex === idx && compiled
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05] hover:border-cyan-500/20"
                      } ${isCompiling ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold truncate">{ch.title}</span>
                        {ch.isCompiled && (
                          <span className="text-[9px] text-cyan-500 flex-shrink-0">✓</span>
                        )}
                      </div>
                      {ch.summary && (
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{ch.summary}</p>
                      )}
                      <p className="text-[9px] text-gray-600 mt-1 font-mono">
                        {ch.startIndex}–{ch.endIndex} 字
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-1/2 p-10 bg-black/40 overflow-y-auto relative">
              <h3 className="text-[10px] uppercase mb-6 tracking-tighter">
                {currentStage === "dehydrate" ? "Refined Script" : currentStage === "control" ? "Kinetic Storyboard" : "AI Video Commands"}
              </h3>
              {isCompiling ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <RefreshCw size={24} className="animate-spin mb-4" />
                  <p className="text-[11px]">正在编译该章节...</p>
                </div>
              ) : !compiled ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <p className="text-[11px]">点击左侧章节加载剧本</p>
                </div>
              ) : (
                <>
                  {currentStage === "dehydrate" && (
                    <div className="space-y-6">
                      {isAdmin && (
                        <div className="p-4 rounded-xl border border-amber-500/20 bg-black/30 mb-8 shadow-lg">
                          <div className="text-[9px] text-amber-500/60 mb-2 uppercase tracking-widest flex items-center justify-between">
                            <span>Admin Console // 全局常数与切片索引</span>
                            <button onClick={() => setShowSeedVault(true)} className="hover:text-amber-400">打开全局图谱</button>
                          </div>
                          <SeedFolderDrillDown
                            units={units}
                            coreExpanded={coreExpanded}
                            expandedChar={expandedChar}
                            selectedFragment={selectedFragment}
                            onCoreExpand={() => setCoreExpanded((p) => !p)}
                            onExpandChar={setExpandedChar}
                            onSelectFragment={setSelectedFragment}
                            onFragmentHover={setHoveredUnitId}
                          />
                        </div>
                      )}
                      {units.map((unit) => (
                        <div
                          key={unit.id}
                          id={`script-unit-${unit.id}`}
                          className="border-b border-white/10 p-6 transition-colors hover:bg-white/[0.02]"
                          onMouseEnter={() => setHoveredUnitId(unit.id)}
                          onMouseLeave={() => setHoveredUnitId(null)}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-cyan-400 text-sm font-bold px-2 py-1 bg-cyan-500/10 rounded border border-cyan-500/20">
                              ⚡ 关键动作触发：{unit.event_trace?.trigger ?? "（未标注）"}
                            </div>
                            {isAdmin && (
                              <span className="text-[10px] text-gray-600 font-mono">
                                IDX:{unit.textRange?.start} | Stress:{unit.seedState.stress} | Compute:{unit.seedState.compute}
                              </span>
                            )}
                          </div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 shadow-inner">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-3 border-b border-white/10 pb-2">【动作剧本】六元素解析</span>
                            <pre className="text-[13px] leading-relaxed text-cyan-50 whitespace-pre-wrap font-serif">{unit.script}</pre>
                          </div>
                          <div className="bg-[#08080a] border border-white/5 rounded-lg p-3">
                            <textarea
                              className="w-full min-h-[48px] bg-[#0c0c0f] border border-white/5 rounded px-3 py-2 text-[11px] text-[#9ca3af] outline-none focus:border-cyan-500/30 resize-none mb-2"
                              placeholder="导演指令（例如：强化肢体的脱力感...）"
                              value={directorInstruction}
                              onChange={(e) => setDirectorInstruction(e.target.value)}
                            />
                            <div className="flex gap-2 mb-2">
                              <button
                                onClick={() => handleGenerateVariants(unit.id)}
                                disabled={unit.isReconstructing}
                                className="px-3 py-1.5 bg-cyan-900/30 border border-cyan-500/40 rounded text-[10px] font-semibold text-cyan-400 hover:bg-cyan-900/50 transition-colors"
                              >
                                {unit.isReconstructing ? "重新渲染中..." : "局部重写"}
                              </button>
                              <button
                                onClick={() => setDirectorInstruction((p) => p.includes("[UPSCALE]") ? p : `[UPSCALE] ${p}`)}
                                className="px-3 py-1.5 bg-black hover:bg-white/5 border border-white/10 rounded text-[10px] text-gray-400 transition-colors"
                              >
                                文学级放高清
                              </button>
                            </div>
                            {(unit.variants ?? []).length > 0 && (
                              <div className="flex gap-3 overflow-x-auto mt-3 pb-2">
                                {unit.variants!.map((v, i) => (
                                  <div key={i} className="flex-shrink-0 w-[220px] bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[10px] relative group hover:border-cyan-500/30 transition-colors">
                                    <p className="line-clamp-4 mb-8 text-gray-300 leading-relaxed">{v.text}</p>
                                    <button onClick={() => handleAdoptVariant(unit.id, i)} className="absolute bottom-3 left-3 right-3 py-1.5 bg-cyan-600/20 text-cyan-400 rounded text-[10px] font-bold hover:bg-cyan-600/40 transition-colors">
                                      确认采纳
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {currentStage === "control" && (
                    <div className="space-y-4">
                      {units.map((unit) => (
                        <div
                          key={unit.id}
                          id={`script-unit-${unit.id}`}
                          className="border border-green-900/30 p-4 bg-black rounded text-[11px] text-[#6b7280] font-mono transition-colors"
                          onMouseEnter={() => setHoveredUnitId(unit.id)}
                          onMouseLeave={() => setHoveredUnitId(null)}
                        >
                          {unit.storyboard}
                        </div>
                      ))}
                    </div>
                  )}
                  {currentStage === "command" && (
                    <div className="p-6 bg-purple-900/10 border border-purple-500/30 rounded-xl">
                      {units.map((unit) => (
                        <pre
                          key={unit.id}
                          id={`script-unit-${unit.id}`}
                          className="text-xs text-purple-300 whitespace-pre-wrap break-words leading-relaxed font-mono rounded transition-colors mb-4"
                          onMouseEnter={() => setHoveredUnitId(unit.id)}
                          onMouseLeave={() => setHoveredUnitId(null)}
                        >
                          Sora_Prompt: {unit.storyboard}
                        </pre>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : !compiled ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#4b5563]">
            <p className="text-[11px] mb-2">载入整本小说原稿</p>
            <p className="text-[10px] text-gray-600">点击「建立目录」生成章节索引，或「整本脱水」一次性编译</p>
          </div>
        ) : (
          /* 整本编译模式：左侧原文，右侧剧本 */
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/2 p-10 border-r border-white/5 overflow-y-auto">
              <h3 className="text-[10px] uppercase text-gray-500 mb-6 tracking-tighter">Raw Novel</h3>
              <div>
                <pre className="text-lg leading-loose font-serif text-[#c4cad4] whitespace-pre-wrap select-text">
                  {(() => {
                    const full = activeProject?.inputText || inputText || "";
                    const unit = hoveredUnitId ? units.find((u) => u.id === hoveredUnitId) : null;
                    let range = unit?.textRange;
                    if (!range || range.start >= range.end || range.start < 0 || range.end > full.length) {
                      range = highlightInOriginal(unit?.anchorText, full) ?? undefined;
                    }
                    if (!range) return full;
                    return (
                      <>
                        {full.slice(0, range.start)}
                        <span className="bg-cyan-500/30 rounded px-0.5 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                          {full.slice(range.start, range.end)}
                        </span>
                        {full.slice(range.end)}
                      </>
                    );
                  })()}
                </pre>
              </div>
            </div>

            <div className="w-1/2 p-10 bg-black/40 overflow-y-auto relative">
              <h3 className="text-[10px] uppercase mb-6 tracking-tighter">
                {currentStage === "dehydrate" ? "Refined Script" : currentStage === "control" ? "Kinetic Storyboard" : "AI Video Commands"}
              </h3>

              {currentStage === "dehydrate" && (
                <div className="space-y-6">
                  {/* 🚨 核心隔离：普通客户看不到这堆复杂的常数结构，只有 url 挂了 ?admin=1 的监制能看到 */}
                  {isAdmin && (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-black/30 mb-8 shadow-lg">
                      <div className="text-[9px] text-amber-500/60 mb-2 uppercase tracking-widest flex items-center justify-between">
                        <span>Admin Console // 全局常数与切片索引</span>
                        <button onClick={() => setShowSeedVault(true)} className="hover:text-amber-400">打开全局图谱</button>
                      </div>
                      <SeedFolderDrillDown
                        units={units}
                        coreExpanded={coreExpanded}
                        expandedChar={expandedChar}
                        selectedFragment={selectedFragment}
                        onCoreExpand={() => setCoreExpanded((p) => !p)}
                        onExpandChar={setExpandedChar}
                        onSelectFragment={setSelectedFragment}
                        onFragmentHover={setHoveredUnitId}
                      />
                    </div>
                  )}

                  {/* 对客户/使用者呈现的干净剧本流 */}
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      id={`script-unit-${unit.id}`}
                      className="border-b border-white/10 p-6 transition-colors hover:bg-white/[0.02]"
                      onMouseEnter={() => setHoveredUnitId(unit.id)}
                      onMouseLeave={() => setHoveredUnitId(null)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-cyan-400 text-sm font-bold px-2 py-1 bg-cyan-500/10 rounded border border-cyan-500/20">
                          ⚡ 关键动作触发：{unit.event_trace?.trigger ?? "（未标注）"}
                        </div>
                        {isAdmin && (
                          <span className="text-[10px] text-gray-600 font-mono">
                            IDX:{unit.textRange?.start} | Stress:{unit.seedState.stress} | Compute:{unit.seedState.compute}
                          </span>
                        )}
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 shadow-inner">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-3 border-b border-white/10 pb-2">【动作剧本】六元素解析</span>
                        <pre className="text-[13px] leading-relaxed text-cyan-50 whitespace-pre-wrap font-serif">{unit.script}</pre>
                      </div>

                      {/* 局部重写控制台 */}
                      <div className="bg-[#08080a] border border-white/5 rounded-lg p-3">
                        <textarea
                          className="w-full min-h-[48px] bg-[#0c0c0f] border border-white/5 rounded px-3 py-2 text-[11px] text-[#9ca3af] outline-none focus:border-cyan-500/30 resize-none mb-2"
                          placeholder="导演指令（例如：强化肢体的脱力感...）"
                          value={directorInstruction}
                          onChange={(e) => setDirectorInstruction(e.target.value)}
                        />
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => handleGenerateVariants(unit.id)}
                            disabled={unit.isReconstructing}
                            className="px-3 py-1.5 bg-cyan-900/30 border border-cyan-500/40 rounded text-[10px] font-semibold text-cyan-400 hover:bg-cyan-900/50 transition-colors"
                          >
                            {unit.isReconstructing ? "重新渲染中..." : "局部重写"}
                          </button>
                          <button
                            onClick={() => setDirectorInstruction((p) => p.includes("[UPSCALE]") ? p : `[UPSCALE] ${p}`)}
                            className="px-3 py-1.5 bg-black hover:bg-white/5 border border-white/10 rounded text-[10px] text-gray-400 transition-colors"
                          >
                            文学级放高清
                          </button>
                        </div>
                        {(unit.variants ?? []).length > 0 && (
                          <div className="flex gap-3 overflow-x-auto mt-3 pb-2">
                            {unit.variants!.map((v, i) => (
                              <div key={i} className="flex-shrink-0 w-[220px] bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[10px] relative group hover:border-cyan-500/30 transition-colors">
                                <p className="line-clamp-4 mb-8 text-gray-300 leading-relaxed">{v.text}</p>
                                <button onClick={() => handleAdoptVariant(unit.id, i)} className="absolute bottom-3 left-3 right-3 py-1.5 bg-cyan-600/20 text-cyan-400 rounded text-[10px] font-bold hover:bg-cyan-600/40 transition-colors">
                                  确认采纳
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStage === "control" && (
                <div className="space-y-4">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      id={`script-unit-${unit.id}`}
                      className="border border-green-900/30 p-4 bg-black rounded text-[11px] text-[#6b7280] font-mono transition-colors"
                      onMouseEnter={() => setHoveredUnitId(unit.id)}
                      onMouseLeave={() => setHoveredUnitId(null)}
                    >
                      {unit.storyboard}
                    </div>
                  ))}
                </div>
              )}
              {currentStage === "command" && (
                <div className="p-6 bg-purple-900/10 border border-purple-500/30 rounded-xl">
                  {units.map((unit) => (
                    <pre
                      key={unit.id}
                      id={`script-unit-${unit.id}`}
                      className="text-xs text-purple-300 whitespace-pre-wrap break-words leading-relaxed font-mono rounded transition-colors mb-4"
                      onMouseEnter={() => setHoveredUnitId(unit.id)}
                      onMouseLeave={() => setHoveredUnitId(null)}
                    >
                      Sora_Prompt: {unit.storyboard}
                    </pre>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 编译人物选择弹窗 */}
      {compileCharacterPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setCompileCharacterPicker(null)}>
          <div
            className="w-full max-w-md bg-[#0c0c0f] border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20">
              <h3 className="text-[12px] font-bold text-cyan-400 uppercase tracking-wider">选择脱水人物</h3>
              <button onClick={() => setCompileCharacterPicker(null)} className="p-1 hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
              <p className="text-[11px] text-gray-500 mb-2">请从人物档案中选择该章节的核心人物，用于 11 维逻辑脱水。</p>
              {discoveredCharacters.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    handleCompileChapter(compileCharacterPicker.chapter, compileCharacterPicker.index, c.name);
                    setCompileCharacterPicker(null);
                  }}
                  disabled={isCompiling}
                  className="w-full text-left px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                >
                  <span className="font-semibold text-cyan-400">{c.name}</span>
                  {c.summary && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{c.summary}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 全书人物普查弹窗 */}
      {showCharacterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowCharacterModal(false)}>
          <div
            className="w-full max-w-2xl max-h-[80vh] bg-[#0c0c0f] border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20">
              <h3 className="text-[12px] font-bold text-emerald-400 uppercase tracking-wider">📋 全书人物普查</h3>
              <button onClick={() => setShowCharacterModal(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {discoveredCharacters.length === 0 ? (
                <p className="text-gray-500 text-[11px]">未识别到人物</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {discoveredCharacters.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/20"
                    >
                      <div className="font-semibold text-emerald-400 text-[12px]">{c.name}</div>
                      <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">{c.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 种子全量审计表弹窗 (The Seed Vault) */}
      {showSeedVault && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60" onClick={() => setShowSeedVault(false)}>
          <div
            className="w-full max-w-4xl max-h-[70vh] bg-[#0c0c0f] border border-purple-500/30 rounded-t-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
              <h3 className="text-[12px] font-bold text-purple-400 uppercase tracking-wider">🧬 种子全量审计表 (The Seed Vault)</h3>
              <button onClick={() => setShowSeedVault(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-purple-300/80 border-b border-white/10">
                    <th className="pb-2">Seed ID</th>
                    <th className="pb-2">固化进度</th>
                    <th className="pb-2">用户关联</th>
                    <th className="pb-2">Depth</th>
                    <th className="pb-2">Locked</th>
                  </tr>
                </thead>
                <tbody>
                  {seedVaultData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">暂无活跃种子</td>
                    </tr>
                  ) : (
                    seedVaultData.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 font-mono text-cyan-400">#{s.id}</td>
                        <td className="py-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${s.confidenceAvg * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-500">{(s.confidenceAvg * 100).toFixed(0)}%</span>
                        </td>
                        <td className="py-2 text-gray-400">{s.scriptTitle ?? "—"} / {s.ownerId ?? "—"}</td>
                        <td className="py-2">{s.depth}</td>
                        <td className="py-2">{s.isLocked ? "🔒" : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
