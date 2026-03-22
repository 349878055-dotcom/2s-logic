"use client";

import { MapPin, X, RotateCcw, Pin, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { DoesValues } from "@/lib/core/types";
import { calcFinalDoes, getDominantDim } from "@/lib/engines/utils";
import DoesRadarChart from "../DoesRadarChart";

const ENV_ROUND_DATA = [
  { pairLabel: "开放 vs 密闭",      biasA: "空间开放", colorA: "#60a5fa", doesA: {d:30,o:45,e:20,s:25}, biasB: "密闭禁锢", colorB: "#6366f1", doesB: {d:80,o:60,e:50,s:90} },
  { pairLabel: "时间高压 vs 延展",   biasA: "时间高压", colorA: "#ef4444", doesA: {d:95,o:70,e:40,s:60}, biasB: "时间延展", colorB: "#10b981", doesB: {d:25,o:35,e:30,s:20} },
  { pairLabel: "道德模糊 vs 清晰",   biasA: "道德灰区", colorA: "#f59e0b", doesA: {d:55,o:75,e:90,s:50}, biasB: "道德明晰", colorB: "#3b82f6", doesB: {d:60,o:50,e:20,s:40} },
  { pairLabel: "信息密集 vs 真空",   biasA: "信息密集", colorA: "#3b82f6", doesA: {d:65,o:95,e:45,s:55}, biasB: "信息真空", colorB: "#9ca3af", doesB: {d:70,o:20,e:55,s:65} },
  { pairLabel: "物理危机 vs 心理隐秘", biasA: "物理极限", colorA: "#ef4444", doesA: {d:85,o:55,e:60,s:95}, biasB: "心理隐秘", colorB: "#10b981", doesB: {d:40,o:60,e:35,s:30} },
] as const;

const ENV_CONTENT: [string, string][] = [
  [`废弃核电站外围，半径三公里内没有人影。\n陈默把车停在检查站旁边，引擎盖在夜风里冷却，嗒嗒作响。\n这种开阔地带的寂静本身就是一种信息：你在这里没有任何掩护。`, `审讯室只有十二平米，没有窗。\n荧光灯的白光把所有阴影都压进角落。这个房间本身是一种胁迫——它是一个没有出口的证词收集机器，每一面墙都在无声施压。`],
  [`七十二小时倒计时。关键节点二十三个，每一个谎言都需要另外三个谎言来维持。\n这里的时间是一种弹性材料，越压越危险，结构开始出现细小的裂缝。`, `码头在黄昏时是安静的。没有截止时间，没有计时器。\n海水拍打浮桥，偶尔有渔船经过。这里的时间允许思考，也允许等待——它是另一种形态的压强：低频但持久。`],
  [`档案室里有三份文件，三套证词，三种版本的同一个事件。\n没有一个是假的，也没有一个是完整的。在这个空间里，真相是一种需要侦探拼出来的多边形。`, `证据清晰：指纹、时间戳、动机，只有一种可能的结论。\n陈默把三张照片排成一行。问题是：为什么这么容易？这个空间里有人想让他找到这些——而这本身就是第二层谜题。`],
  [`监控录像七台，四十八小时素材，十七个可疑人物，四条逃逸路线。\n信息太多了，多到成为一种伪装。这个空间里，真相就藏在数量本身的密度里，等人去筛。`, `只有一条线索，而且它是半截的。没有证人，没有监控，没有动机，只有一张没有名字的名片，背面空白。\n空白也是一种信息密度——它是零，但零也可以是一种回答。`],
  [`天台距离地面三十二层，风很大，对话必须凑近才能听见。\n陈默站在边缘的两步之外——这个位置本身就是一种谈判筹码。物理空间在这里变成了压力容器。`, `茶馆的角落，老建筑厚墙，两层混凝土。外面的声音进不来，这里说的话只在这里存在，不会被记录，不会被转述。\n这是一个物理上的秘密容器，专门为不能存在的对话而建造。`],
];

const ENV_BASE_LABELS: Record<string, string> = {
  d: "逻辑高压型 · 压力驱动叙事节奏",
  o: "叙事迷宫型 · 信息层叠密集交织",
  e: "道德灰区型 · 善恶边界持续消解",
  s: "幽闭拮抗型 · 空间施压恒定激活",
};

const ENV_AXIS_LABELS = ["压强","密度","损耗","张力"];
const TOTAL_ENV_ROUNDS = 5;
const DIM_COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];
const DIM_KEYS: (keyof DoesValues)[] = ["d", "o", "e", "s"];

export default function EnvironmentCalibrator({
  onClose, onComplete,
}: {
  onClose: () => void;
  onComplete: (result: { label: string; does: DoesValues }) => void;
}) {
  const [phase, setPhase] = useState<"intro" | "calibrating" | "results">("intro");
  const [scenario, setScenario] = useState("");
  const [round, setRound] = useState(0);
  const [choices, setChoices] = useState<("A" | "B")[]>([]);
  const [selectedCard, setSelectedCard] = useState<"A" | "B" | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [finalDoes, setFinalDoes] = useState<DoesValues | null>(null);

  const curRound = ENV_ROUND_DATA[round];
  const [contentA, contentB] = ENV_CONTENT[round] ?? ["", ""];

  const handleChoice = (choice: "A" | "B") => {
    if (selectedCard || transitioning) return;
    setSelectedCard(choice);
    setTransitioning(true);
    setTimeout(() => {
      const next = [...choices, choice];
      setChoices(next);
      if (next.length >= TOTAL_ENV_ROUNDS) {
        setFinalDoes(calcFinalDoes(next, ENV_ROUND_DATA));
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
      <div className="w-[500px] rounded-2xl overflow-hidden content-fade-in"
        style={{ background: "#0a0e1a", border: "0.5px solid rgba(96,165,250,0.2)" }}>
        <div className="h-1 bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#6366f1]" />
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(96,165,250,0.1)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={15} className="text-[#60a5fa]" strokeWidth={2} />
              <h2 className="text-[15px] font-bold text-white">极端环境校准器</h2>
              <span className="text-[10px] text-[#4b5563] font-mono">Environment Stressor</span>
            </div>
            <p className="text-[11px] text-[#6b7280]">通过 {TOTAL_ENV_ROUNDS} 轮空间 A/B 对比，锚定世界的物理基调</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06]">
            <X size={13} className="text-[#6b7280]" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10.5px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2 block">故事发生的背景世界（可选）</label>
            <textarea value={scenario} onChange={e => setScenario(e.target.value)}
              placeholder="描述你的故事世界……&#10;例：近未来中国城市，信息管控严密，监控无处不在" rows={3}
              className="w-full bg-[#111116] border rounded-lg px-3 py-2.5 text-[11.5px] text-[#9ca3af] placeholder:text-[#374151] outline-none resize-none"
              style={{ borderColor: "rgba(96,165,250,0.15)" }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "逻辑压强", desc: "事件密度与时间压力", color: "#ef4444" },
              { label: "道德损耗", desc: "善恶边界的模糊程度", color: "#f59e0b" },
              { label: "背景密度", desc: "信息层叠与空间复杂度", color: "#3b82f6" },
            ].map(t => (
              <div key={t.label} className="p-3 rounded-xl text-center"
                style={{ background: t.color + "0c", border: `0.5px solid ${t.color}25` }}>
                <div className="text-[11px] font-bold mb-0.5" style={{ color: t.color }}>{t.label}</div>
                <div className="text-[9.5px] text-[#4b5563]">{t.desc}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setPhase("calibrating")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: "rgba(96,165,250,0.12)", border: "0.5px solid rgba(96,165,250,0.35)", color: "#60a5fa" }}>
            <MapPin size={15} strokeWidth={2.5} />开始环境校准 · 共 {TOTAL_ENV_ROUNDS} 轮
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === "calibrating") return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(14px)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_ENV_ROUNDS }).map((_, i) => (
            <div key={i} className="transition-all duration-400 rounded-full"
              style={{
                width: i < choices.length ? "22px" : "8px", height: "8px",
                background: i < choices.length
                  ? (choices[i] === "A" ? ENV_ROUND_DATA[i].colorA : ENV_ROUND_DATA[i].colorB)
                  : i === round ? "rgba(96,165,250,0.6)" : "rgba(255,255,255,0.1)",
              }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6b7280]">第 {round + 1} 轮 / {TOTAL_ENV_ROUNDS}</span>
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: "#60a5fa", background: "rgba(96,165,250,0.1)", border: "0.5px solid rgba(96,165,250,0.25)" }}>
            {curRound.pairLabel}
          </span>
        </div>
        {scenario && <p className="text-[10px] text-[#4b5563] max-w-[480px] text-center truncate">世界：{scenario}</p>}
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
                background: "#0a0e18",
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
                    <div className="w-1.5 rounded-full" style={{ height: `${Math.round((does[k] / 100) * 28)}px`, background: DIM_COLORS[ki], opacity: 0.72 }} />
                    <span className="text-[8px] font-mono font-bold" style={{ color: DIM_COLORS[ki] }}>{ENV_AXIS_LABELS[ki].slice(0,1)}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10.5px] text-[#4b5563]">选择更符合你故事世界的空间感受</p>
      <button onClick={onClose} className="text-[10px] text-[#374151] hover:text-[#6b7280] transition-colors mt-1">退出校准</button>
    </div>
  );

  const dominant = finalDoes ? getDominantDim(finalDoes) : "d";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(14px)" }}>
      <div className="w-[500px] rounded-2xl overflow-hidden content-fade-in"
        style={{ background: "#0a0e1a", border: "0.5px solid rgba(96,165,250,0.2)" }}>
        <div className="h-1 bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#6366f1]" />
        <div className="px-6 py-5 border-b text-center" style={{ borderColor: "rgba(96,165,250,0.1)", background: "rgba(96,165,250,0.04)" }}>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#60a5fa] animate-pulse" />
            <span className="text-[14px] font-bold text-white">世界物理基调已锚定</span>
            <div className="w-2 h-2 rounded-full bg-[#60a5fa] animate-pulse" />
          </div>
          <p className="text-[11px] text-[#6b7280]">基于 {TOTAL_ENV_ROUNDS} 轮空间选择，故事世界的逻辑参数已生成</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-6 items-center mb-5">
            <div className="flex-shrink-0">
              {finalDoes && <DoesRadarChart does={finalDoes} size={136} axisLabels={ENV_AXIS_LABELS} />}
            </div>
            <div className="flex-1">
              <div className="text-[9.5px] text-[#4b5563] uppercase tracking-widest mb-1.5">环境类型</div>
              <div className="text-[13px] font-semibold text-white leading-snug mb-4">{finalDoes ? ENV_BASE_LABELS[dominant] : ""}</div>
              <div className="space-y-2.5">
                {finalDoes && DIM_KEYS.map((k, ki) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[9.5px] font-bold w-8 text-right" style={{ color: DIM_COLORS[ki] }}>{ENV_AXIS_LABELS[ki]}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${finalDoes[k]}%`, background: DIM_COLORS[ki], opacity: 0.8 }} />
                    </div>
                    <span className="text-[9.5px] font-mono text-[#6b7280] w-7 text-right">{finalDoes[k]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[9.5px] text-[#4b5563] flex-shrink-0">选择轨迹</span>
            {choices.map((ch, i) => {
              const rnd = ENV_ROUND_DATA[i];
              const color = ch === "A" ? rnd.colorA : rnd.colorB;
              const lbl = ch === "A" ? rnd.biasA : rnd.biasB;
              return <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color, background: color + "18", border: `0.5px solid ${color}35` }}>{lbl}</span>;
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (finalDoes) onComplete({ label: ENV_BASE_LABELS[dominant], does: finalDoes }); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12.5px] font-bold transition-all"
              style={{ background: "rgba(96,165,250,0.12)", border: "0.5px solid rgba(96,165,250,0.35)", color: "#60a5fa" }}>
              <Pin size={13} strokeWidth={2.5} />锚定世界基调
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
