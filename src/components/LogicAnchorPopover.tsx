"use client";

import { Anchor, Search, Dna, FileText, ArrowUpRight, ChevronDown, ChevronUp, X, Users } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { GENE_SUBSETS, GENE_COLORS, REFERENCE_BOARDS } from "@/lib/engines/constants";

export default function LogicAnchorPopover({
  onClose, anchorRef,
}: {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [anchorEnabled, setAnchorEnabled] = useState(true);
  const [profilesOpen, setProfilesOpen] = useState(true);
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [geneFilter, setGeneFilter] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = useCallback(() => { setVisible(false); setTimeout(onClose, 200); }, [onClose]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) handleClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [handleClose, anchorRef]);

  const filteredGenes = GENE_SUBSETS.filter((g) => g.includes(geneFilter) || !geneFilter);

  return (
    <>
      <div className="fixed inset-0 z-40 transition-all duration-200"
        style={{ backdropFilter: visible ? "blur(2px)" : "blur(0)", background: visible ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)" }}
        onClick={handleClose} />
      <div ref={popoverRef} className="fixed z-50 top-[52px] right-[204px] w-[340px] rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "#1a1a20", border: "0.5px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06) inset",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.97)", transition: "opacity 0.2s ease, transform 0.2s ease" }}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Anchor size={14} className="text-[#ef4444]" strokeWidth={2} />
            <span className="text-[13.5px] font-semibold text-white">逻辑锚定</span>
            <span className="text-[11px] text-[#6b7280] font-mono">Logic Anchor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {[{label:"启用",active:anchorEnabled},{label:"关闭",active:!anchorEnabled}].map(({label,active},i) => (
                <button key={label} onClick={() => setAnchorEnabled(label==="启用")}
                  className="px-3 py-1 text-[11px] font-semibold transition-all duration-150"
                  style={{ background: active ? (label==="启用" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)") : "transparent",
                    color: active ? (label==="启用" ? "#ef4444" : "#d1d5db") : "#6b7280",
                    borderRight: i===0 ? "0.5px solid rgba(255,255,255,0.08)" : undefined }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors">
              <X size={12} className="text-[#6b7280]" />
            </button>
          </div>
        </div>

        <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors" onClick={() => setProfilesOpen(v => !v)}>
            <div className="flex items-center gap-2">
              <Users size={13} className="text-[#9ca3af]" strokeWidth={1.8} />
              <span className="text-[12.5px] font-semibold text-[#d1d5db]">角色 / 场景档案</span>
              <span className="text-[10px] font-mono text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-1.5 py-0.5 rounded-full">255</span>
            </div>
            {profilesOpen ? <ChevronUp size={13} className="text-[#6b7280]" /> : <ChevronDown size={13} className="text-[#6b7280]" />}
          </button>
          {profilesOpen && (
            <div className="px-4 pb-4">
              <p className="text-[11.5px] text-[#6b7280] leading-[1.6] mb-3">基因库包含 <span className="text-[#d1d5db]">255</span> 个叙事子集，每个子集代表一种可激活的角色动机或场景原型模式。</p>
              <div className="flex items-center gap-2 bg-[#111116] border rounded-md px-2.5 py-1.5 mb-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <Search size={11} className="text-[#4b5563]" strokeWidth={1.8} />
                <input type="text" placeholder="过滤基因子集……" value={geneFilter} onChange={e => setGeneFilter(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-[#9ca3af] placeholder:text-[#374151] outline-none" />
              </div>
              <div className="flex flex-wrap gap-1 max-h-[110px] overflow-y-auto mb-3 pr-1">
                {filteredGenes.map((gene, i) => (
                  <button key={gene} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-150 hover:opacity-80"
                    style={{ background: GENE_COLORS[i%GENE_COLORS.length]+"18", border: `0.5px solid ${GENE_COLORS[i%GENE_COLORS.length]}35`, color: GENE_COLORS[i%GENE_COLORS.length] }}>
                    <Dna size={8} strokeWidth={2} />{gene}
                  </button>
                ))}
                {filteredGenes.length < GENE_SUBSETS.length && <span className="text-[10px] text-[#4b5563] self-center px-1">+{255-filteredGenes.length} 个隐藏</span>}
              </div>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[12px] font-semibold transition-all duration-150 group"
                style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                <div className="flex items-center gap-2"><Dna size={13} strokeWidth={2} />解锁全部基因库子集</div>
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors" onClick={() => setBoardsOpen(v => !v)}>
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-[#9ca3af]" strokeWidth={1.8} />
              <span className="text-[12.5px] font-semibold text-[#d1d5db]">逻辑参考板</span>
            </div>
            {boardsOpen ? <ChevronUp size={13} className="text-[#6b7280]" /> : <ChevronDown size={13} className="text-[#6b7280]" />}
          </button>
          {boardsOpen && (
            <div className="px-4 pb-4">
              <p className="text-[11.5px] text-[#6b7280] leading-[1.6] mb-3">上传参考文本片段，让系统在逻辑重写时以此为锚点进行语境对齐。</p>
              <div className="space-y-1.5 mb-3">
                {REFERENCE_BOARDS.map(b => (
                  <div key={b.id} className="rounded-md px-3 py-2.5 cursor-pointer hover:border-white/[0.1] transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11.5px] font-semibold text-[#d1d5db]">{b.title}</span>
                      <div className="flex gap-1">{b.tags.map(t => <span key={t} className="text-[9px] text-[#6b7280] bg-white/[0.05] px-1.5 py-0.5 rounded">{t}</span>)}</div>
                    </div>
                    <p className="text-[10.5px] text-[#4b5563] line-clamp-1">{b.excerpt}</p>
                  </div>
                ))}
              </div>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[12px] font-semibold transition-all group"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
                <div className="flex items-center gap-2"><FileText size={13} strokeWidth={2} />新建参考板</div>
                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: anchorEnabled ? "#10b981" : "#6b7280" }} />
            <span className="text-[10px] text-[#4b5563]">{anchorEnabled ? "锚定激活中" : "锚定已停用"}</span>
          </div>
          <span className="text-[10px] font-mono text-[#374151]">v0.9.2 · beta</span>
        </div>
      </div>
    </>
  );
}
