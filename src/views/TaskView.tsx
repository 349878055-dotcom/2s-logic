"use client";

import { CheckSquare, Users, Cpu, Database, Brain, Activity, Zap, ArrowUpRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { TASKS_DATA } from "@/lib/engines/constants";

// 排名任务 mock 数据：两两对比
const RANK_LOGIC_PAIRS = [
  { a: "陈默放下枪，转身走向窗边。城市的灯光在他眼睛里毫无意义地流动。", b: "陈默把枪扔在桌上，走到窗边，看着外面的城市发呆。" },
  { a: "李医生推了推眼镜，嘴角浮起一丝苦笑。", b: "李医生推了推眼镜，看起来有点无奈。" },
  { a: "雨开始下了。她站在路口，不知道该往哪边走。", b: "下雨了。她在路口犹豫了一会儿。" },
];
const RANK_DIALOGUE_PAIRS = [
  { a: "「你不懂。」他转过身，声音压得很低。", b: "「你不懂。」他说。" },
  { a: "「我以为……」她顿了顿，「我以为你会等我。」", b: "「我以为你会等我。」她说。" },
  { a: "「够了。」他抬手，像要挥开什么。", b: "「够了。」他打断了她。" },
];

export default function TaskView() {
  const [activeTab, setActiveTab] = useState("全部");
  const [selectedRankTaskId, setSelectedRankTaskId] = useState<string | null>(null);
  const [rankPairIdx, setRankPairIdx] = useState(0);
  const [rankedCount, setRankedCount] = useState(0);
  const tabs = ["全部", "核心校准任务", "深度调查", "社区任务"];
  const filtered = activeTab === "全部" ? TASKS_DATA : TASKS_DATA.filter(t => t.type === activeTab);
  const statsRow = [
    { label: "总参与人次",   value: "31,427",  icon: Users,    color: "#ef4444" },
    { label: "活跃算力节点", value: "2,841",   icon: Cpu,      color: "#3b82f6" },
    { label: "本周校准数据", value: "847K",    icon: Database, color: "#f59e0b" },
    { label: "引擎版本",     value: "V2.1-β",  icon: Brain,    color: "#10b981" },
  ];

  const task = selectedRankTaskId ? TASKS_DATA.find(t => t.id === selectedRankTaskId) : null;
  const isLogic = selectedRankTaskId === "rank-logic";
  const isDialogue = selectedRankTaskId === "rank-dialogue";
  const pairs = isLogic ? RANK_LOGIC_PAIRS : isDialogue ? RANK_DIALOGUE_PAIRS : [];
  const currentPair = pairs[rankPairIdx];

  const handleStartRank = (taskId: string) => {
    if (taskId === "rank-logic" || taskId === "rank-dialogue") {
      setSelectedRankTaskId(taskId);
      setRankPairIdx(0);
      setRankedCount(0);
    } else {
      alert("该任务即将开放，敬请期待。");
    }
  };

  const handlePick = (picked: "a" | "b") => {
    setRankedCount(c => c + 1);
    if (rankPairIdx < pairs.length - 1) {
      setRankPairIdx(i => i + 1);
    } else {
      setSelectedRankTaskId(null);
      setRankPairIdx(0);
      alert(`排名完成！感谢您的 ${rankedCount + 1} 次贡献，算力加速已计入账户。`);
    }
  };

  if (task && currentPair) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-[#090909]">
        <div className="flex items-center gap-4 px-8 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={() => { setSelectedRankTaskId(null); setRankPairIdx(0); }}
            className="flex items-center gap-2 text-[12px] text-[#6b7280] hover:text-white transition-colors">
            <ArrowLeft size={16} strokeWidth={2} /> 返回任务列表
          </button>
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-white">{task.title}</h2>
            <p className="text-[10px] text-[#6b7280]">第 {rankPairIdx + 1} / {pairs.length} 组 · 已贡献 {rankedCount} 次</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-3xl grid grid-cols-2 gap-6">
            <button onClick={() => handlePick("a")}
              className="p-6 rounded-2xl text-left transition-all hover:border-[#ef4444]/50 hover:bg-white/[0.04]"
              style={{ background: "#0e0e13", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <span className="text-[9px] font-bold text-[#ef4444] mb-2 block">选项 A</span>
              <p className="text-[13px] text-[#d1d5db] leading-relaxed">{currentPair.a}</p>
            </button>
            <button onClick={() => handlePick("b")}
              className="p-6 rounded-2xl text-left transition-all hover:border-[#ef4444]/50 hover:bg-white/[0.04]"
              style={{ background: "#0e0e13", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <span className="text-[9px] font-bold text-[#ef4444] mb-2 block">选项 B</span>
              <p className="text-[13px] text-[#d1d5db] leading-relaxed">{currentPair.b}</p>
            </button>
          </div>
        </div>
        <p className="px-8 pb-6 text-[10px] text-[#4b5563] text-center">点击您认为更优的选项，帮助改进 Logic-Gateway 算法</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-[#090909]">
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pt-7 pb-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <CheckSquare size={16} className="text-[#ef4444]" strokeWidth={2} />
                <h1 className="text-[18px] font-bold text-white">实验室任务</h1>
                <span className="text-[10px] text-[#4b5563] font-mono">Lab Tasks</span>
              </div>
              <p className="text-[11px] text-[#4b5563]">参与校准任务 · 获取算力加速 · 改进下一代叙事引擎</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#6b7280]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />系统运行中
              </div>
              <div className="text-[10.5px] px-2.5 py-1 rounded-lg text-[#ef4444]"
                style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                5 项活跃任务
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-8 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all"
              style={activeTab === tab
                ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.25)" }
                : { color: "#6b7280", border: "0.5px solid transparent" }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-px border-b" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.03)" }}>
          {statsRow.map(s => (
            <div key={s.label} className="flex items-center gap-3 px-6 py-4 bg-[#090909]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + "12" }}>
                <s.icon size={15} style={{ color: s.color }} strokeWidth={2} />
              </div>
              <div>
                <div className="text-[14px] font-bold text-white font-mono">{s.value}</div>
                <div className="text-[9.5px] text-[#4b5563]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-8 py-6 grid grid-cols-2 gap-5">
          {filtered.map(task => (
            <div key={task.id} className="rounded-2xl overflow-hidden group transition-all hover:border-white/[0.1]"
              style={{ background: "#0e0e13", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <div className="h-0.5 w-full bg-[#1a1a20]">
                <div className="h-full" style={{ width: `${task.progress}%`, background: `linear-gradient(90deg, ${task.typeColor}, ${task.typeColor}88)` }} />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ color: task.typeColor, background: task.typeColor + "15", border: `0.5px solid ${task.typeColor}30` }}>
                    {task.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: task.statusColor }} />
                    <span className="text-[9.5px]" style={{ color: task.statusColor }}>{task.status}</span>
                  </div>
                </div>
                <h3 className="text-[15px] font-bold text-white mb-0.5">{task.title}</h3>
                <p className="text-[10px] text-[#4b5563] font-mono mb-3">{task.subtitle}</p>
                <p className="text-[11.5px] text-[#6b7280] leading-[1.75] mb-4">{task.desc}</p>
                <div className="flex items-center gap-4 mb-4 text-[10px] text-[#4b5563]">
                  <div className="flex items-center gap-1.5"><Users size={10} strokeWidth={2} />{task.participants.toLocaleString()} 人参与</div>
                  <div className="flex items-center gap-1.5"><Activity size={10} strokeWidth={2} />{task.timeEst}</div>
                  <div className="ml-auto flex items-center gap-1.5 font-semibold" style={{ color: task.rewardColor }}>
                    <Zap size={10} strokeWidth={2.5} />{task.reward}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9.5px] text-[#4b5563]">
                    <div className="w-20 h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: task.typeColor, opacity: 0.7 }} />
                    </div>
                    {task.progress}% 完成
                  </div>
                  <button onClick={() => handleStartRank(task.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11.5px] font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: task.typeColor + "15", border: `0.5px solid ${task.typeColor}30`, color: task.typeColor }}>
                    开始参与 <ArrowUpRight size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
