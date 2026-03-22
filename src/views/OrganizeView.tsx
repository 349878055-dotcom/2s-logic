"use client";

import {
  Archive, Plus, ArrowUpRight, ChevronDown, ChevronUp, Database,
  Brain, Pin, Briefcase, Thermometer, RefreshCw, Cpu, Lock,
  MapPin, X, RotateCcw, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import type { LegacyCharacterProfile, AssetCard } from "@/lib/core/types";
import {
  CHARACTERS, ASSET_CARDS, DIMENSIONS, ANCHOR_TYPE_COLORS,
  EMOTION_OPTIONS, PHYSIOLOGY_OPTIONS, CLASS_OPTIONS, BANNER_STATES,
} from "@/lib/engines/constants";
import DoesSlider from "@/components/DoesSlider";

// ──────────────────────────────────────────────────────────
// CharacterModelingEngine
// ──────────────────────────────────────────────────────────
function CharacterModelingEngine({
  character, onClose, onSave,
}: {
  character: LegacyCharacterProfile | null;
  onClose: () => void;
  onSave: (c: LegacyCharacterProfile) => void;
}) {
  const defaultChar: LegacyCharacterProfile = character ?? {
    id: `char-${Date.now()}`, name: "", initial: "新", age: 30, color: "#6366f1",
    baseTone: { label: "", weight: 70, traits: [] },
    anchors: [], background: { cls: "底层", profession: "", history: "" },
    instant: { emotion: "冷静", intensity: 50, physiology: "正常", energy: 70 },
    does: { d: 70, o: 55, e: 70, s: 50 }, category: "核心人物",
  };
  const [form, setForm] = useState<LegacyCharacterProfile>(defaultChar);
  const [traitInput, setTraitInput] = useState("");
  const [anchorInput, setAnchorInput] = useState("");
  const [anchorType, setAnchorType] = useState<LegacyCharacterProfile["anchors"][0]["type"]>("物品");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [generating, setGenerating] = useState(false);

  const updateField = (path: string, val: unknown) => {
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] = { ...obj[keys[i]] };
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const addTrait = () => {
    if (!traitInput.trim()) return;
    updateField("baseTone.traits", [...form.baseTone.traits, traitInput.trim()]);
    setTraitInput("");
  };
  const removeTrait = (t: string) =>
    updateField("baseTone.traits", form.baseTone.traits.filter(x => x !== t));

  const addAnchor = () => {
    if (!anchorInput.trim()) return;
    updateField("anchors", [...form.anchors, {
      id: `anchor-${Date.now()}`, label: anchorInput.trim(),
      type: anchorType, color: ANCHOR_TYPE_COLORS[anchorType],
    }]);
    setAnchorInput("");
  };
  const removeAnchor = (id: string) =>
    updateField("anchors", form.anchors.filter(a => a.id !== id));

  const handleGenerate = () => {
    if (!form.name) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); onSave(form); }, 900);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0a0a0a]">
      {/* Banner */}
      <div className="relative flex h-[140px] border-b border-white/[0.06] overflow-hidden">
        {BANNER_STATES.map((s, i) => (
          <div key={s.label} className="flex-1 relative border-r border-white/[0.04] flex flex-col justify-end p-3 cursor-pointer group"
            style={{ background: i === bannerIdx ? "rgba(239,68,68,0.07)" : "rgba(15,15,20,0.95)" }}
            onClick={() => setBannerIdx(i)}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            {i === 4 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white/50 text-center px-2 leading-tight">
                  「{form.name || "人物"}」的不同底色
                </span>
              </div>
            )}
            <div className="relative z-10">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 inline-block"
                style={{ color: "#ef4444", background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                {s.label}
              </span>
              <p className="text-[10px] text-white/60 leading-tight line-clamp-2">{s.snippet}</p>
            </div>
            {i === bannerIdx && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ef4444]" />}
          </div>
        ))}
        <button onClick={() => setBannerIdx(n => (n + 1) % BANNER_STATES.length)}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-20 hover:bg-white/[0.12] transition-colors"
          style={{ background: "rgba(0,0,0,0.6)", border: "0.5px solid rgba(255,255,255,0.15)" }}>
          <RefreshCw size={13} className="text-white/60" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[860px] mx-auto px-8 py-6">
          <h2 className="text-[20px] font-bold text-white mb-2">向系统描述这个人物的底色。</h2>
          <p className="text-[12.5px] text-[#6b7280] leading-[1.7] mb-1">
            每个人物都蕴含着"未言明"的底层逻辑。系统将尝试以最符合其性格的方式填充行为空白。
          </p>
          <p className="text-[12.5px] text-[#4b5563] leading-[1.7] mb-6">
            但你的人物独一无二！锁定底色，并用<span className="text-[#d1d5db]">铆钉物</span>固定核心锚点，
            让系统始终知道这个人物"不会做什么"。
          </p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-widest mb-1.5 block">人物姓名</label>
              <input value={form.name} onChange={e => updateField("name", e.target.value)}
                placeholder="陈默" className="w-full bg-[#111116] border rounded-md px-3 py-2 text-[12.5px] text-white placeholder:text-[#374151] outline-none"
                style={{ borderColor: "rgba(255,255,255,0.08)" }} />
            </div>
            <div>
              <label className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-widest mb-1.5 block">年龄</label>
              <input type="number" value={form.age} onChange={e => updateField("age", Number(e.target.value))}
                className="w-full bg-[#111116] border rounded-md px-3 py-2 text-[12.5px] text-white outline-none"
                style={{ borderColor: "rgba(255,255,255,0.08)" }} />
            </div>
            <div>
              <label className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-widest mb-1.5 block">主色调</label>
              <div className="flex items-center gap-2">
                {["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444"].map(c => (
                  <button key={c} onClick={() => updateField("color", c)}
                    className="w-6 h-6 rounded-full transition-all duration-150 flex-shrink-0"
                    style={{ background: c, outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }} />
                ))}
              </div>
            </div>
          </div>

          {/* Base Tone */}
          <div className="rounded-xl border p-4 mb-4" style={{ background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-[#6366f1]" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-[#6366f1]">底色 · Base Tone</span>
              <span className="text-[9.5px] text-[#4b5563] ml-auto">全局性格权重</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#6b7280] mb-1 block">性格基调标签</label>
                <input value={form.baseTone.label} onChange={e => updateField("baseTone.label", e.target.value)}
                  placeholder="沉郁·复仇" className="w-full bg-[#0d0d14] border rounded-md px-3 py-1.5 text-[12px] text-white placeholder:text-[#374151] outline-none"
                  style={{ borderColor: "rgba(99,102,241,0.2)" }} />
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] mb-1 block">权重 {form.baseTone.weight}%</label>
                <input type="range" min={0} max={100} value={form.baseTone.weight}
                  onChange={e => updateField("baseTone.weight", Number(e.target.value))}
                  className="w-full mt-1.5" style={{ accentColor: "#6366f1",
                    background: `linear-gradient(to right, #6366f199 0%, #6366f199 ${form.baseTone.weight}%, rgba(255,255,255,0.08) ${form.baseTone.weight}%, rgba(255,255,255,0.08) 100%)` }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#6b7280] mb-2 block">性格特质标签</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.baseTone.traits.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] cursor-pointer hover:opacity-70"
                    style={{ background: "rgba(99,102,241,0.15)", border: "0.5px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
                    onClick={() => removeTrait(t)}>
                    {t} <X size={8} strokeWidth={2.5} />
                  </span>
                ))}
                <input value={traitInput} onChange={e => setTraitInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTrait()}
                  placeholder="+ 添加特质" className="bg-transparent text-[10px] text-[#6366f1] outline-none placeholder:text-[#374151] w-20" />
              </div>
            </div>
          </div>

          {/* Anchors */}
          <div className="rounded-xl border p-4 mb-4" style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.18)" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-[#ef4444]" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-[#ef4444]">铆钉物 · Anchors</span>
              <span className="text-[9.5px] text-[#4b5563] ml-auto">逻辑核心锚点 · 定海神针</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {form.anchors.map(a => (
                <span key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer hover:opacity-70"
                  style={{ background: a.color + "18", border: `0.5px solid ${a.color}40`, color: a.color }}
                  onClick={() => removeAnchor(a.id)}>
                  <Pin size={9} strokeWidth={2.5} />{a.label}
                  <span className="text-[8px] opacity-60">{a.type}</span>
                  <X size={8} strokeWidth={2.5} />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select value={anchorType} onChange={e => setAnchorType(e.target.value as typeof anchorType)}
                className="bg-[#0d0d14] border rounded-md px-2 py-1.5 text-[11px] text-[#9ca3af] outline-none"
                style={{ borderColor: "rgba(239,68,68,0.2)" }}>
                {(["物品","记忆","关系","秘密"] as const).map(t => <option key={t}>{t}</option>)}
              </select>
              <input value={anchorInput} onChange={e => setAnchorInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addAnchor()}
                placeholder="父亲遗像、那份证词……"
                className="flex-1 bg-[#0d0d14] border rounded-md px-3 py-1.5 text-[12px] text-white placeholder:text-[#374151] outline-none"
                style={{ borderColor: "rgba(239,68,68,0.2)" }} />
              <button onClick={addAnchor} className="px-3 py-1.5 rounded-md text-[11px] text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                style={{ border: "0.5px solid rgba(239,68,68,0.3)" }}>
                <Plus size={12} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Background */}
          <div className="rounded-xl border p-4 mb-4" style={{ background: "rgba(59,130,246,0.04)", borderColor: "rgba(59,130,246,0.18)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase size={14} className="text-[#3b82f6]" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-[#3b82f6]">背景参数 · Background</span>
              <span className="text-[9.5px] text-[#4b5563] ml-auto">阶层 · 职业 · 过往经历</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-[#6b7280] mb-1 block">社会阶层</label>
                <select value={form.background.cls} onChange={e => updateField("background.cls", e.target.value)}
                  className="w-full bg-[#0d0d14] border rounded-md px-3 py-1.5 text-[12px] text-[#9ca3af] outline-none"
                  style={{ borderColor: "rgba(59,130,246,0.2)" }}>
                  {CLASS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] mb-1 block">职业身份</label>
                <input value={form.background.profession} onChange={e => updateField("background.profession", e.target.value)}
                  placeholder="前刑警、调查记者……"
                  className="w-full bg-[#0d0d14] border rounded-md px-3 py-1.5 text-[12px] text-white placeholder:text-[#374151] outline-none"
                  style={{ borderColor: "rgba(59,130,246,0.2)" }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#6b7280] mb-1 block">核心过往经历</label>
              <textarea value={form.background.history} onChange={e => updateField("background.history", e.target.value)}
                placeholder="亲历1997年工厂事故，父亲离奇死亡后离职……" rows={2}
                className="w-full bg-[#0d0d14] border rounded-md px-3 py-2 text-[11.5px] text-white placeholder:text-[#374151] outline-none resize-none"
                style={{ borderColor: "rgba(59,130,246,0.2)" }} />
            </div>
          </div>

          {/* Instant State */}
          <div className="rounded-xl border p-4 mb-6" style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.18)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Thermometer size={14} className="text-[#f59e0b]" strokeWidth={2} />
              <span className="text-[12px] font-semibold text-[#f59e0b]">瞬时参数 · Instant State</span>
              <span className="text-[9.5px] text-[#4b5563] ml-auto">当前情绪 · 生理状态</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-[#6b7280]">情绪状态</label>
                  <span className="text-[10px] text-[#f59e0b] font-mono">{form.instant.intensity}%</span>
                </div>
                <select value={form.instant.emotion} onChange={e => updateField("instant.emotion", e.target.value)}
                  className="w-full bg-[#0d0d14] border rounded-md px-3 py-1.5 text-[12px] text-[#9ca3af] outline-none mb-2"
                  style={{ borderColor: "rgba(245,158,11,0.2)" }}>
                  {EMOTION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                <input type="range" min={0} max={100} value={form.instant.intensity}
                  onChange={e => updateField("instant.intensity", Number(e.target.value))}
                  className="w-full" style={{ accentColor: "#f59e0b",
                    background: `linear-gradient(to right, #f59e0b99 0%, #f59e0b99 ${form.instant.intensity}%, rgba(255,255,255,0.08) ${form.instant.intensity}%, rgba(255,255,255,0.08) 100%)` }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-[#6b7280]">生理状态</label>
                  <span className="text-[10px] text-[#f59e0b] font-mono">{form.instant.energy}%</span>
                </div>
                <select value={form.instant.physiology} onChange={e => updateField("instant.physiology", e.target.value)}
                  className="w-full bg-[#0d0d14] border rounded-md px-3 py-1.5 text-[12px] text-[#9ca3af] outline-none mb-2"
                  style={{ borderColor: "rgba(245,158,11,0.2)" }}>
                  {PHYSIOLOGY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                <input type="range" min={0} max={100} value={form.instant.energy}
                  onChange={e => updateField("instant.energy", Number(e.target.value))}
                  className="w-full" style={{ accentColor: "#f59e0b",
                    background: `linear-gradient(to right, #f59e0b99 0%, #f59e0b99 ${form.instant.energy}%, rgba(255,255,255,0.08) ${form.instant.energy}%, rgba(255,255,255,0.08) 100%)` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleGenerate} disabled={!form.name || generating}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200"
              style={{ background: form.name ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
                color: form.name ? "#0a0a0a" : "#4b5563" }}>
              {generating ? <><RefreshCw size={14} strokeWidth={2} className="animate-spin" />生成行为模板中……</>
                : <><Cpu size={14} strokeWidth={2} />生成行为模板</>}
            </button>
            <button className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
              <Lock size={13} strokeWidth={2} />锁定参数
            </button>
            <button onClick={onClose} className="px-5 py-3.5 rounded-xl text-[13px] transition-all text-[#6b7280] hover:text-[#9ca3af]">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// OrganizeView
// ──────────────────────────────────────────────────────────
export default function OrganizeView({ draftCount }: { draftCount: number }) {
  const [showEngine, setShowEngine] = useState(false);
  const [editingChar, setEditingChar] = useState<LegacyCharacterProfile | null>(null);
  const [cards, setCards] = useState<AssetCard[]>(ASSET_CARDS);
  const [activeCategory, setActiveCategory] = useState("全部资产");
  const [filterOpen, setFilterOpen] = useState({ search: false, profiles: true, filters: true });
  const [filterChars, setFilterChars] = useState<Set<string>>(new Set());
  const [filterEmotions, setFilterEmotions] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  if (showEngine) {
    return (
      <CharacterModelingEngine character={editingChar}
        onClose={() => { setShowEngine(false); setEditingChar(null); }}
        onSave={(char) => {
          setShowEngine(false); setEditingChar(null);
          setToast(`「${char.name}」行为模板生成完毕，已存入资产库`);
          setTimeout(() => setToast(null), 2800);
        }} />
    );
  }

  const categories = [
    { label: "全部资产", count: cards.length },
    { label: "核心人物", count: cards.filter(c => c.category === "核心人物").length },
    { label: "背景设定", count: 0 },
    { label: "对白草稿", count: draftCount },
    { label: "关键道具", count: 0 },
  ];

  const filteredCards = cards.filter(c => {
    if (activeCategory !== "全部资产" && c.category !== activeCategory) return false;
    if (filterChars.size > 0 && !filterChars.has(c.characterId)) return false;
    if (filterEmotions.size > 0 && !filterEmotions.has(c.state)) return false;
    return true;
  });

  const grouped: Record<string, AssetCard[]> = {};
  filteredCards.forEach(c => {
    if (!grouped[c.date]) grouped[c.date] = [];
    grouped[c.date].push(c);
  });

  const toggleSetItem = (set: Set<string>, item: string) => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item); else next.add(item);
    return next;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧分类面板 */}
      <div className="w-[180px] min-w-[180px] border-r border-white/[0.06] bg-[#0d0d10] flex flex-col">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <Archive size={13} className="text-[#9ca3af]" strokeWidth={1.8} />
            <span className="text-[10.5px] font-semibold text-[#6b7280] uppercase tracking-widest">资产分类</span>
          </div>
          <div className="space-y-0.5">
            {categories.map(cat => (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] font-medium transition-all ${
                  activeCategory === cat.label ? "bg-[#1c1c1c] text-white" : "text-[#6b7280] hover:bg-white/[0.03] hover:text-[#9ca3af]"}`}>
                <span>{cat.label}</span>
                <span className={`text-[10px] font-mono rounded px-1 ${activeCategory === cat.label ? "text-[#ef4444] bg-[#ef4444]/10" : "text-[#374151]"}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mx-3 my-2 h-px bg-white/[0.05]" />
        <div className="px-3 pb-3">
          <button onClick={() => { setEditingChar(null); setShowEngine(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11.5px] font-semibold transition-all"
            style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <Plus size={12} strokeWidth={2.5} />新建人物档案
          </button>
        </div>
        <div className="flex-1" />
        {toast && (
          <div className="mx-3 mb-3 p-2 rounded-lg text-[10px] text-[#10b981] leading-tight content-fade-in"
            style={{ background: "rgba(16,185,129,0.1)", border: "0.5px solid rgba(16,185,129,0.25)" }}>
            <CheckCircle2 size={10} strokeWidth={2} className="inline mr-1" />{toast}
          </div>
        )}
      </div>

      {/* 中央卡片网格 */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-5">
        {Object.entries(grouped).map(([date, dateCards]) => (
          <div key={date} className="mb-7">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[13px] font-semibold text-[#9ca3af]">{date}</span>
              <button className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors"
                style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <Plus size={10} className="text-[#6b7280]" strokeWidth={2} />
              </button>
              <span className="text-[10px] text-[#374151] font-mono">{dateCards.length} 张</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dateCards.map(card => {
                const char = CHARACTERS.find(c => c.id === card.characterId);
                return (
                  <div key={card.id}
                    className="rounded-xl overflow-hidden border border-white/[0.05] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group bg-[#0f0f14]"
                    onClick={() => { setEditingChar(char ?? null); setShowEngine(true); }}>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.05]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ background: char?.color + "20", border: `0.5px solid ${char?.color}50`, color: char?.color }}>
                          {char?.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11.5px] font-semibold text-[#d1d5db]">{char?.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: card.intensity > 70 ? "#ef444418" : card.intensity > 40 ? "#f59e0b18" : "#10b98118",
                                color: card.intensity > 70 ? "#ef4444" : card.intensity > 40 ? "#f59e0b" : "#10b981",
                                border: `0.5px solid ${card.intensity > 70 ? "#ef444430" : card.intensity > 40 ? "#f59e0b30" : "#10b98130"}` }}>
                              {card.emotionLabel}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-[#4b5563]">{char?.background.profession} · {char?.background.cls}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Brain size={9} style={{ color: char?.color }} strokeWidth={2} />
                        <div className="flex-1 h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${char?.baseTone.weight}%`, background: char?.color }} />
                        </div>
                        <span className="text-[9px] font-mono text-[#4b5563]">{char?.baseTone.weight}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(char?.anchors ?? []).slice(0, 2).map(a => (
                          <span key={a.id} className="flex items-center gap-0.5 text-[8.5px] px-1.5 py-0.5 rounded"
                            style={{ background: a.color + "18", border: `0.5px solid ${a.color}30`, color: a.color }}>
                            <Pin size={7} strokeWidth={2.5} />{a.label}
                          </span>
                        ))}
                        {(char?.anchors.length ?? 0) > 2 && (
                          <span className="text-[8.5px] text-[#374151] px-1">+{(char?.anchors.length ?? 0) - 2}</span>
                        )}
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <pre className="text-[10.5px] leading-[1.65] text-[#9ca3af] whitespace-pre-wrap break-words line-clamp-5 font-light"
                        style={{ fontFamily: "'Noto Serif SC', Georgia, serif" }}>{card.content}</pre>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04] bg-[#0a0a0d]">
                      <div className="flex items-center gap-1">
                        {DIMENSIONS.map(dim => (
                          <span key={dim.key} className="text-[8.5px] font-mono px-1 py-0.5 rounded"
                            style={{ color: dim.color, background: dim.colorBg }}>
                            {dim.key.replace("V-","")}:{card.does[dim.field]}
                          </span>
                        ))}
                      </div>
                      <span className="text-[8.5px] text-[#374151] font-mono opacity-0 group-hover:opacity-100 transition-opacity">点击编辑</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredCards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Database size={32} className="text-[#374151]" strokeWidth={1.2} />
            <p className="text-[12.5px] text-[#4b5563]">该分类暂无资产</p>
            <button onClick={() => { setEditingChar(null); setShowEngine(true); }}
              className="text-[11px] text-[#ef4444] hover:underline">+ 新建人物档案</button>
          </div>
        )}
      </div>

      {/* 右侧过滤面板 */}
      <div className="w-[192px] min-w-[192px] border-l border-white/[0.06] bg-[#0d0d10] flex flex-col overflow-y-auto">
        <div className="border-b border-white/[0.06]">
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]"
            onClick={() => setFilterOpen(p => ({ ...p, search: !p.search }))}>
            <span className="text-[11.5px] font-semibold text-[#d1d5db]">已保存的搜索</span>
            {filterOpen.search ? <ChevronUp size={12} className="text-[#6b7280]" /> : <ChevronDown size={12} className="text-[#6b7280]" />}
          </button>
          {filterOpen.search && (
            <div className="px-4 pb-3"><p className="text-[10.5px] text-[#4b5563]">无已保存搜索</p></div>
          )}
        </div>
        <div className="border-b border-white/[0.06]">
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]"
            onClick={() => setFilterOpen(p => ({ ...p, profiles: !p.profiles }))}>
            <span className="text-[11.5px] font-semibold text-[#d1d5db]">人物档案</span>
            {filterOpen.profiles ? <ChevronUp size={12} className="text-[#6b7280]" /> : <ChevronDown size={12} className="text-[#6b7280]" />}
          </button>
          {filterOpen.profiles && (
            <div className="px-4 pb-3 space-y-2">
              {CHARACTERS.map(char => (
                <label key={char.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="w-3.5 h-3.5 rounded border flex items-center justify-center transition-all"
                    style={filterChars.has(char.id) ? { background: char.color + "40", borderColor: char.color + "80" } : { borderColor: "rgba(255,255,255,0.2)" }}
                    onClick={() => setFilterChars(s => toggleSetItem(s, char.id))}>
                    {filterChars.has(char.id) && <div className="w-1.5 h-1.5 rounded-sm" style={{ background: char.color }} />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ background: char.color + "20", color: char.color }}>
                      {char.initial}
                    </div>
                    <span className="text-[11px] text-[#9ca3af] group-hover:text-[#d1d5db] transition-colors">{char.name}</span>
                  </div>
                  <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setEditingChar(char); setShowEngine(true); }}>
                    <ArrowUpRight size={10} className="text-[#6b7280]" />
                  </button>
                </label>
              ))}
              <button onClick={() => { setEditingChar(null); setShowEngine(true); }}
                className="flex items-center gap-1.5 text-[10.5px] text-[#ef4444] hover:opacity-80 transition-opacity mt-1">
                <Plus size={10} strokeWidth={2.5} />新个人资料
              </button>
            </div>
          )}
        </div>
        <div>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]"
            onClick={() => setFilterOpen(p => ({ ...p, filters: !p.filters }))}>
            <span className="text-[11.5px] font-semibold text-[#d1d5db]">过滤器</span>
            {filterOpen.filters ? <ChevronUp size={12} className="text-[#6b7280]" /> : <ChevronDown size={12} className="text-[#6b7280]" />}
          </button>
          {filterOpen.filters && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">类型</p>
                {["底色档", "铆钉档", "瞬时档"].map(t => (
                  <label key={t} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                    <div className="w-3.5 h-3.5 rounded border border-white/20 bg-transparent" />
                    <span className="text-[11px] text-[#9ca3af]">{t}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">情绪状态</p>
                {["愤怒", "冷静", "悲伤", "决心", "警觉", "从容"].map(e => (
                  <label key={e} className="flex items-center gap-2 mb-1.5 cursor-pointer"
                    onClick={() => setFilterEmotions(s => toggleSetItem(s, e))}>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${filterEmotions.has(e) ? "border-[#ef4444]/60 bg-[#ef4444]/20" : "border-white/20"}`}>
                      {filterEmotions.has(e) && <div className="w-1.5 h-1.5 rounded-sm bg-[#ef4444]" />}
                    </div>
                    <span className="text-[11px] text-[#9ca3af]">{e}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">D.O.E.S 维度</p>
                {DIMENSIONS.map(dim => (
                  <label key={dim.key} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                    <div className="w-3.5 h-3.5 rounded border border-white/20" />
                    <span className="text-[10px] font-mono" style={{ color: dim.color }}>{dim.key}</span>
                    <span className="text-[10px] text-[#6b7280]">{dim.label}</span>
                  </label>
                ))}
              </div>
              {(filterChars.size > 0 || filterEmotions.size > 0) && (
                <button onClick={() => { setFilterChars(new Set()); setFilterEmotions(new Set()); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10.5px] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
                  style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <RotateCcw size={10} strokeWidth={2} />清除全部过滤
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
