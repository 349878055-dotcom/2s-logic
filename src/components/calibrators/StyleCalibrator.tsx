"use client";

import { Target, X, RotateCcw, Pin, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { DoesValues } from "@/lib/core/types";
import { CHARACTERS } from "@/lib/engines/constants";
import { calcFinalDoes, getDominantDim } from "@/lib/engines/utils";
import DoesRadarChart from "../DoesRadarChart";

const CAL_ROUND_DATA = [
  { pairLabel: "驱动 vs 共情",    biasA: "D · 驱动", colorA: "#ef4444", doesA: { d:90, o:50, e:25, s:35 }, biasB: "E · 共情",  colorB: "#f59e0b", doesB: { d:25, o:55, e:90, s:65 } },
  { pairLabel: "驱动 vs 秩序",    biasA: "D · 驱动", colorA: "#ef4444", doesA: { d:92, o:30, e:40, s:30 }, biasB: "O · 秩序",  colorB: "#3b82f6", doesB: { d:40, o:93, e:50, s:55 } },
  { pairLabel: "共情 vs 安全",    biasA: "E · 共情",  colorA: "#f59e0b", doesA: { d:30, o:45, e:92, s:50 }, biasB: "S · 安全",  colorB: "#10b981", doesB: { d:45, o:60, e:55, s:92 } },
  { pairLabel: "驱动 vs 共情·深", biasA: "D · 驱动", colorA: "#ef4444", doesA: { d:95, o:55, e:20, s:25 }, biasB: "E · 共情",  colorB: "#f59e0b", doesB: { d:20, o:50, e:95, s:70 } },
  { pairLabel: "秩序 vs 安全",    biasA: "O · 秩序",  colorA: "#3b82f6", doesA: { d:50, o:92, e:45, s:40 }, biasB: "S · 安全",  colorB: "#10b981", doesB: { d:40, o:55, e:65, s:94 } },
] as const;

const CAL_CONTENT: [string, string][] = [
  [`他把文件推到桌上，动作干净利落。\n"说。时间、地点、你见过谁。"\n眼神钉在对方脸上，没有给任何缓冲的余地。`, `他在对方旁边坐下，没有开口。\n灯光有点白，对方的手放在桌上，十指交扣，指节发白。\n"……很久了吧。"他轻声说。`],
  [`"你有两分钟。"\n他没有在等答案，他在等对方先露出破绽——谁先开口谁先输，这是颠扑不破的规律。`, `他重新翻到第一页，把三处矛盾并排标注。逻辑是清晰的：时间线不对。\n"这里，这里，还有这里。你给我解释一下。"`],
  [`他看见对方眼底的那点什么——不是恐惧，是疲惫。\n他把水杯推了过去，没有说话。\n有些话，等着说比追着说更有力量。`, `他在心里快速过了一遍：如果对方开口，牵扯面多大，自己能不能兜住。\n"先别说名字，"他后退半步，"说你知道什么就够了。"`],
  [`椅子腿在地板上划出一声，他站起来拿上外套。\n"那就算了。"\n他走向门口，放慢了最后两步的速度。对方会开口的。`, `沉默在审讯室里蔓延。他忽然想起父亲说的话：有些人不是不想说，是不知道从哪里开口。\n他把照片翻转过来。"从你记得的最后一次见面，说起。"`],
  [`审讯进行到第四十七分钟，他找到了漏洞。三次陈述，两处矛盾，一个决定性的问题。\n他把本子转过去。"看这里。"`, `他在离开之前，把录音音量悄悄调小了一格。\n有些东西，不应该被所有人听见。\n"只有我在听。"他背对着对方说。`],
];

const BASE_TONE_LABELS: Record<string, string> = {
  d: "强驱动型 · 意志力与行动先行",
  o: "秩序型 · 逻辑框架主导一切",
  e: "共情型 · 情感感知优先于行动",
  s: "安全型 · 谨慎防御，本能保护",
};

const PRESET_SCENARIOS = [
  "雨夜审讯室，陈默面对沉默的嫌疑人",
  "废弃档案馆，他发现了关于父亲的证词",
  "天台上，与幕后操控者正面对峙",
  "凌晨，他必须在两分钟内做出决定",
];

const TOTAL_CAL_ROUNDS = 5;
const DIM_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];
const DIM_KEYS: (keyof DoesValues)[] = ["d", "o", "e", "s"];
const DIM_LABELS = ["Drive", "Order", "Empathy", "Security"];

export default function StyleCalibrator({
  onClose, onComplete,
}: {
  onClose: () => void;
  onComplete: (result: { charId: string; label: string; does: DoesValues }) => void;
}) {
  const [phase, setPhase] = useState<"intro" | "calibrating" | "results">("intro");
  const [scenario, setScenario] = useState("");
  const [targetCharId, setTargetCharId] = useState(CHARACTERS[0]?.id ?? "");
  const [round, setRound] = useState(0);
  const [choices, setChoices] = useState<("A" | "B")[]>([]);
  const [selectedCard, setSelectedCard] = useState<"A" | "B" | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [finalDoes, setFinalDoes] = useState<DoesValues | null>(null);

  const curRound = CAL_ROUND_DATA[round];
  const [contentA, contentB] = CAL_CONTENT[round] ?? ["", ""];

  const handleChoice = (choice: "A" | "B") => {
    if (selectedCard || transitioning) return;
    setSelectedCard(choice);
    setTransitioning(true);
    setTimeout(() => {
      const next = [...choices, choice];
      setChoices(next);
      if (next.length >= TOTAL_CAL_ROUNDS) {
        setFinalDoes(calcFinalDoes(next, CAL_ROUND_DATA));
        setPhase("results");
      } else {
        setRound(r => r + 1);
        setSelectedCard(null);
      }
      setTransitioning(false);
    }, 600);
  };

  const resetAll = () => { setPhase("intro"); setRound(0); setChoices([]); setSelectedCard(null); setFinalDoes(null); };

  if (phase === "intro") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.86)", backdropFilter: "blur(10px)" }}>
      <div className="w-[520px] rounded-2xl overflow-hidden content-fade-in"
        style={{ background: "#0e0e13", border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={15} className="text-[#ef4444]" strokeWidth={2} />
              <h2 className="text-[15px] font-bold text-white">人物性格校准器</h2>
              <span className="text-[10px] text-[#4b5563] font-mono">Style Calibrator</span>
            </div>
            <p className="text-[11px] text-[#6b7280]">通过 {TOTAL_CAL_ROUNDS} 轮 A/B 对比，系统自动锚定人物底色参数</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06]">
            <X size={13} className="text-[#6b7280]" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-[10.5px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2 block">校准目标人物</label>
            <div className="flex gap-2 flex-wrap">
              {CHARACTERS.map(char => (
                <button key={char.id} onClick={() => setTargetCharId(char.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
                  style={targetCharId === char.id
                    ? { background: char.color + "20", border: `1px solid ${char.color}55`, color: char.color }
                    : { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: char.color + "28", color: char.color }}>{char.initial}</div>
                  {char.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10.5px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2 block">输入测试场景（可选）</label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {PRESET_SCENARIOS.map(s => (
                <button key={s} onClick={() => setScenario(s)}
                  className="px-2.5 py-1 rounded-md text-[10.5px] transition-all"
                  style={scenario === s
                    ? { background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.35)", color: "#ef4444" }
                    : { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)", color: "#6b7280" }}>
                  {s.slice(0, 12)}…
                </button>
              ))}
            </div>
            <textarea value={scenario} onChange={e => setScenario(e.target.value)}
              placeholder="描述一个具体场景……&#10;例：在废弃档案馆，他发现了关键证据" rows={3}
              className="w-full bg-[#111116] border rounded-lg px-3 py-2.5 text-[11.5px] text-[#9ca3af] placeholder:text-[#374151] outline-none resize-none"
              style={{ borderColor: "rgba(255,255,255,0.08)" }} />
          </div>
          <button onClick={() => setPhase("calibrating")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
            <Target size={15} strokeWidth={2.5} />开始性格校准 · 共 {TOTAL_CAL_ROUNDS} 轮
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === "calibrating") return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(14px)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_CAL_ROUNDS }).map((_, i) => (
            <div key={i} className="transition-all duration-400 rounded-full"
              style={{
                width: i < choices.length ? "22px" : "8px", height: "8px",
                background: i < choices.length
                  ? (choices[i] === "A" ? CAL_ROUND_DATA[i].colorA : CAL_ROUND_DATA[i].colorB)
                  : i === round ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.1)",
              }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6b7280]">第 {round + 1} 轮 / {TOTAL_CAL_ROUNDS}</span>
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.25)" }}>
            {curRound.pairLabel}
          </span>
        </div>
        {scenario && <p className="text-[10px] text-[#4b5563] max-w-[480px] text-center truncate">场景：{scenario}</p>}
      </div>

      <div className="flex gap-5 w-full px-10" style={{ maxWidth: "820px" }}>
        {(["A", "B"] as const).map(side => {
          const isA = side === "A";
          const bias = isA ? curRound.biasA : curRound.biasB;
          const color = isA ? curRound.colorA : curRound.colorB;
          const content = isA ? contentA : contentB;
          const does = isA ? curRound.doesA : curRound.doesB;
          const picked = selectedCard === side;
          const rejected = selectedCard !== null && !picked;
          return (
            <button key={side} onClick={() => handleChoice(side)} disabled={!!selectedCard}
              className="flex-1 text-left rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "#0f0f14",
                border: `0.5px solid ${picked ? color : rejected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.09)"}`,
                transform: picked ? "scale(1.025)" : rejected ? "scale(0.965)" : "scale(1)",
                opacity: rejected ? 0.42 : 1,
                boxShadow: picked ? `0 0 28px ${color}35, 0 0 8px ${color}18` : "none",
                cursor: selectedCard ? "default" : "pointer",
              }}>
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ background: color + "10", borderBottom: `0.5px solid ${color}22` }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px] font-black leading-none" style={{ color, opacity: 0.85 }}>{side}</span>
                  <span className="text-[11.5px] font-semibold" style={{ color }}>{bias}</span>
                </div>
                {picked && <div className="flex items-center gap-1 text-[10.5px] font-bold" style={{ color }}><CheckCircle2 size={12} strokeWidth={2.5} />已选择</div>}
              </div>
              <div className="px-5 py-4 min-h-[130px]">
                <pre className="text-[12.5px] leading-[1.88] whitespace-pre-wrap font-light"
                  style={{ fontFamily: "'Noto Serif SC', Georgia, serif", color: picked ? "#e5e7eb" : "#9ca3af" }}>
                  {content}
                </pre>
              </div>
              <div className="flex items-end gap-3 px-5 pb-5">
                {DIM_KEYS.map((k, ki) => (
                  <div key={k} className="flex flex-col items-center gap-1">
                    <div className="w-1.5 rounded-full transition-all"
                      style={{ height: `${Math.round((does[k] / 100) * 28)}px`, background: DIM_COLORS[ki], opacity: 0.72 }} />
                    <span className="text-[8px] font-mono font-bold" style={{ color: DIM_COLORS[ki] }}>{k.toUpperCase()}</span>
                  </div>
                ))}
                <span className="ml-auto text-[9px] text-[#374151]">{Object.values(does).map((v,i)=>`${DIM_KEYS[i].toUpperCase()}:${v}`).join("  ")}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10.5px] text-[#4b5563]">选择更符合你对人物认知的片段</p>
      <button onClick={onClose} className="text-[10px] text-[#374151] hover:text-[#6b7280] transition-colors mt-1">退出校准</button>
    </div>
  );

  const dominant = finalDoes ? getDominantDim(finalDoes) : "d";
  const targetChar = CHARACTERS.find(c => c.id === targetCharId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(14px)" }}>
      <div className="w-[500px] rounded-2xl overflow-hidden content-fade-in"
        style={{ background: "#0e0e13", border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <div className="px-6 py-5 border-b text-center"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(239,68,68,0.04)" }}>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="text-[14px] font-bold text-white tracking-wide">人物底色已锚定</span>
            <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
          </div>
          <p className="text-[11px] text-[#6b7280]">基于 {TOTAL_CAL_ROUNDS} 轮选择，{targetChar?.name ?? "人物"} 的性格坐标已生成</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-6 items-center mb-5">
            <div className="flex-shrink-0">
              {finalDoes && <DoesRadarChart does={finalDoes} size={136} />}
            </div>
            <div className="flex-1">
              <div className="text-[9.5px] text-[#4b5563] uppercase tracking-widest mb-1.5">底色标签</div>
              <div className="text-[13px] font-semibold text-white leading-snug mb-4">{finalDoes ? BASE_TONE_LABELS[dominant] : ""}</div>
              <div className="space-y-2.5">
                {finalDoes && DIM_KEYS.map((k, ki) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[9.5px] font-bold w-5 text-right" style={{ color: DIM_COLORS[ki] }}>{k.toUpperCase()}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${finalDoes[k]}%`, background: DIM_COLORS[ki], opacity: 0.8 }} />
                    </div>
                    <span className="text-[9.5px] font-mono text-[#6b7280] w-7 text-right">{finalDoes[k]}</span>
                    <span className="text-[9px] text-[#374151] w-14">{DIM_LABELS[ki]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[9.5px] text-[#4b5563] flex-shrink-0">选择轨迹</span>
            {choices.map((ch, i) => {
              const rnd = CAL_ROUND_DATA[i];
              const color = ch === "A" ? rnd.colorA : rnd.colorB;
              const lbl = (ch === "A" ? rnd.biasA : rnd.biasB).split("·")[0].trim();
              return <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color, background: color + "18", border: `0.5px solid ${color}35` }}>{lbl}</span>;
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (finalDoes) onComplete({ charId: targetCharId, label: BASE_TONE_LABELS[dominant], does: finalDoes }); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-bold transition-all"
              style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
              <Pin size={13} strokeWidth={2.5} />锚定到 {targetChar?.name ?? "人物"} 的底色
            </button>
            <button onClick={resetAll} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[12px] transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
              <RotateCcw size={12} strokeWidth={2} />重新
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[12px] transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
