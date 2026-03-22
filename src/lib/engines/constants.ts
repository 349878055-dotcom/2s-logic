"use client";

/**
 * @Snapshot engines-constants-v1
 * @Role 静态展示与校准用数据表
 * @Guardrail 禁止副作用、禁止 I/O
 */
import {
  Compass, Wand2, Pencil, FolderOpen, Sparkles, LayoutGrid, Palette,
  CheckSquare, HelpCircle, Bell, Moon, User, Flame, Tag, Heart,
  Zap, Scale, HandHeart, ShieldCheck, Code2,
} from "lucide-react";
import type { LegacyCharacterProfile, AssetCard, DimensionDef } from "@/lib/core/types";

// ══════════════════════════════════════════════════════════
// D.O.E.S 四维定义 — 核心数据结构（已恢复）
// ══════════════════════════════════════════════════════════
export const DIMENSIONS: DimensionDef[] = [
  {
    key: "V-D", label: "驱动", enLabel: "DRIVE", icon: Zap,
    color: "#ef4444", colorBg: "rgba(239,68,68,0.08)", colorBorder: "rgba(239,68,68,0.2)",
    desc: "情节推进力与行动驱动强度", field: "d",
  },
  {
    key: "V-O", label: "秩序", enLabel: "ORDER", icon: Scale,
    color: "#3b82f6", colorBg: "rgba(59,130,246,0.08)", colorBorder: "rgba(59,130,246,0.2)",
    desc: "叙事结构与逻辑架构密度", field: "o",
  },
  {
    key: "V-E", label: "共情", enLabel: "EMPATHY", icon: HandHeart,
    color: "#f59e0b", colorBg: "rgba(245,158,11,0.08)", colorBorder: "rgba(245,158,11,0.2)",
    desc: "情感渗透力与共情张力", field: "e",
  },
  {
    key: "V-S", label: "安全", enLabel: "SECURE", icon: ShieldCheck,
    color: "#10b981", colorBg: "rgba(16,185,129,0.08)", colorBorder: "rgba(16,185,129,0.2)",
    desc: "策略布局与安全防御倾向", field: "s",
  },
];

// ══════════════════════════════════════════════════════════
// Nav / Tabs — status: 'open' 唯一开放 | 'building' 疯狂建设中
// ══════════════════════════════════════════════════════════
export const NAV_TOP = [
  { icon: Compass, label: "探索", status: "building" as const },
  { icon: Wand2, label: "创作", status: "building" as const },
  { icon: Pencil, label: "编辑", status: "building" as const },
  { icon: FolderOpen, label: "整理", status: "building" as const },
  { icon: Code2, label: "剧本区", status: "open" as const }, // 原逻辑转译，唯一开放
];
export const NAV_WORKSPACE = [
  { icon: Sparkles, label: "个性化", status: "building" as const },
  { icon: LayoutGrid, label: "情绪板", status: "building" as const },
  { icon: Palette, label: "风格工坊", badge: "新", status: "building" as const },
];
export const NAV_COMMUNITY = [{ icon: CheckSquare, label: "任务", status: "building" as const }];
export const NAV_BOTTOM = [
  { icon: HelpCircle, label: "帮助" },
  { icon: Bell,  label: "更新日志" },
  { icon: Moon,  label: "深色模式" },
  { icon: User,  label: "我的账户" },
];
export const TABS = [
  { label: "为你推荐", icon: Flame },
  { label: "随机浏览" },
  { label: "热门标签", icon: Tag },
  { label: "已收藏",  icon: Heart },
];

// ══════════════════════════════════════════════════════════
// Script Content
// ══════════════════════════════════════════════════════════
export const PROTOTYPE_VARIANTS: Record<string, string[]> = {
  "V-D": [
    `陈默将档案袋重重摔在桌上，照片散落一地。

三年。他等了整整三年，今天终于轮到他了。

                    陈默
          （低沉，决绝）
          今晚，结束它。

他检查了一遍外套口袋，推开了门。
外面的雨很大，他没有带伞。`,

    `陈默在走廊尽头停住了脚步。

他知道前面有人在等他。他也知道，
如果退缩，这辈子都不会再有机会。

                    陈默
          （对自己）
          怕，又怎样。

他深吸一口气，推开了那扇门。`,

    `档案室的门被陈默一脚踢开。

没有时间了。四十八小时的窗口，
已经用掉了四十六小时。

                    陈默
          （扫视房间）
          在这里。一定在这里。

他开始翻箱倒柜，完全不顾及动静。`,
  ],
  "V-O": [
    `事件序列已经清晰：

一、工厂事故（1997年3月）→ 47人死亡
二、调查压制（1997年5月）→ 档案封存
三、证人逐一失踪（1998—2001）
四、陈默父亲离奇死亡（2002年）

第五步，还没有发生。
这就是陈默必须在今晚行动的原因。`,

    `陈默将所有线索铺开在地板上，
开始梳理结构：

已知条件：凶手、动机、物证。
未知条件：第48号证人的下落。

逻辑闭环只差一环。
而那一环，就在林晓手里。`,

    `从结果反推：
如果林晓不知情，她为何保留那份档案？
如果她知情，她为何从未开口？

两种假设只有一个交集——
她一直在保护某个人。

问题变成了：那个人，是谁？`,
  ],
  "V-E": [
    `林晓把那杯已经凉透的茶推到陈默面前。

他没有看她。只是盯着窗外某个角度——
那是一个她从未见过的角度，
像一个人在凝视自己走不回去的地方。

                    林晓
          （轻声）
          你怕吗？

沉默。长到林晓以为他不会回答了。

                    陈默
          （转头，第一次直视她）
          我只怕一件事。你问我。`,

    `陈默拿起那张旧照片。

照片里的父亲三十多岁，笑得很放松，
背后是工厂的奠基典礼现场。

那是陈默有记忆以来，看过的父亲
最快乐的一张照片。

他把照片翻过去，放在口袋里，
不让自己再看一眼。`,

    `母亲的声音突然出现在陈默脑海里。

                    母亲（画外音）
          撒谎的时候，你的耳朵会动。

陈默摸了摸自己的耳朵。

他在对自己撒谎——
他一直以为自己是为了正义。
但他清楚，他只是想要一个答案。
一个"对不起"。`,
  ],
  "V-S": [
    `陈默在脑中清点筹码：

可动用的：李刑警（忠诚度待定），
          林晓（绝不能牵连），
          那份证词（唯一实证）。

对方掌握的：他的住址、他的弱点、
            还有他在乎的人。

如果今晚失败，证词消失，
林晓会被当作威胁处理。

所以他不能失败。一次机会，没有第二次。`,

    `两辆黑色轿车，在楼下守了三天了。

陈默从窗缝里观察它们的换班规律：
早六点，晚十一点，各换一次。

间隙，二十分钟。

够了。`,

    `陈默设好了三条退路：

A线：从停车场地下通道，
     向西四个街区，公共汽车。
B线：屋顶，相邻楼，外墙。
C线：林晓不知道的那个地址。

他希望用不上C线。
如果用上了，说明他已经失去了
别的所有选择。`,
  ],
};

export const ORIGINAL_FRAGMENTS = [
  {
    id: 101, scene: "第一幕 · 第01场", location: "内景 — 废弃工厂 — 深夜",
    tag: "开场", tagColor: "#6366f1",
    content: `铁锈色的光线从破碎的天窗斜切而下，落在遍地的机械残骸上。

陈默（30岁，面容沉郁）站在一台停转已久的冲压机前，手指缓慢划过冰冷的钢铁表面。

锈迹在他指尖留下橙红色的痕迹，像是旧时代流下的血。

远处，一声金属碰撞的脆响——

陈默猛地回头。

                    陈默
          （低声）
          谁在那里？

黑暗中没有回答。只有风从破洞的墙缝穿过，发出类似哨音的呜咽。`,
  },
  {
    id: 102, scene: "第一幕 · 第03场", location: "外景 — 天台 — 黄昏",
    tag: "对峙", tagColor: "#ef4444",
    content: `林晓（28岁，眼神犀利）靠在水塔边，点燃一根烟。

陈默从楼梯间推门而出，两人相距三步，像两块磁铁的同极。

                    林晓
          你为什么要回来？

                    陈默
          因为有些事没有结束。

                    林晓
          （冷笑）
          对你来说没结束。对我来说，
          早就结束了。那年冬天，
          你离开的那天，就结束了。

陈默沉默。城市的噪音在他们之间流淌，像一条无法踏入的河。`,
  },
  {
    id: 103, scene: "第二幕 · 第07场", location: "内景 — 地铁隧道 — 凌晨",
    tag: "追逐", tagColor: "#f59e0b",
    content: `地铁轰鸣。

陈默在列车车厢之间奔跑，荧光灯闪烁，将他的影子切割成碎片。

追逐者——三个穿制服的男人——距离在缩短。

陈默猛地拉开通往维修走廊的金属门，冷风扑面。

他跳下。

黑暗中，他紧贴墙壁，屏住呼吸。列车掠过，只差半米。

一秒。两秒。三秒。

列车过去了。`,
  },
  {
    id: 104, scene: "第二幕 · 第09场", location: "内景 — 母亲的房间 — 闪回/1998年",
    tag: "回忆", tagColor: "#8b5cf6",
    content: `画面颗粒感变重，色调暖黄。

年轻的母亲坐在窗边缝制什么，光落在她的头发上。

八岁的陈默爬上床，把头靠在母亲膝盖上。

                    母亲
          （不抬头，微笑）
          今天，有没有欺负人？

                    小陈默
          没有。

                    母亲
          撒谎的时候，你的耳朵会动。

小陈默用手捂住耳朵。`,
  },
  {
    id: 105, scene: "第三幕 · 第12场", location: "内景 — 档案室 — 午后",
    tag: "揭露", tagColor: "#10b981",
    content: `陈默翻开最后一个文件夹，里面的照片散落出来。

定格。

照片上的人——是他父亲——和他一直以为的"死对头"站在一起，两人在笑，背景是某个工厂的奠基典礼。

时间标注：1997年3月，工厂事故前六个月。

陈默的手开始抖。

                    陈默
          （喃喃）
          不可能……

他把所有照片铺在地上，跪下来，像是在重新拼一幅破碎的世界地图。

灯突然灭了。`,
  },
  {
    id: 106, scene: "第三幕 · 第15场", location: "内景/外景 — 工厂顶楼 — 暴雨夜",
    tag: "高潮", tagColor: "#ef4444",
    content: `暴雨倾盆。闪电将整个城市劈成黑白两色。

陈默和幕后人（60岁，西装，神态从容）在顶楼相对而立。

                    幕后人
          你父亲知道实情。是他选择
          了沉默。你以为你在追查真相，
          其实你只是在寻找一个可以恨的人。

                    陈默
          （颤抖）
          你杀了他们——

                    幕后人
          我保护了更多人。你能做到吗？

远处，警车的蓝红灯光在雨雾中旋转，像是一场迟到了二十年的审判。`,
  },
];

// ══════════════════════════════════════════════════════════
// Character & Asset Data
// ══════════════════════════════════════════════════════════
export const CHARACTERS: LegacyCharacterProfile[] = [
  {
    id: "chen-mo", name: "陈默", initial: "陈", age: 30, color: "#6366f1",
    baseTone: { label: "沉郁·复仇", weight: 72, traits: ["执着", "内敛", "理性", "压抑"] },
    anchors: [
      { id: "a1", label: "父亲遗像", type: "物品", color: "#8b5cf6" },
      { id: "a2", label: "那份证词", type: "秘密", color: "#ef4444" },
      { id: "a3", label: "旧档案袋", type: "物品", color: "#f59e0b" },
    ],
    background: { cls: "底层", profession: "前刑警", history: "亲历1997年工厂事故，父亲离奇死亡后离职" },
    instant: { emotion: "愤怒", intensity: 80, physiology: "体能透支", energy: 30 },
    does: { d: 78, o: 52, e: 68, s: 45 }, category: "核心人物",
  },
  {
    id: "lin-xiao", name: "林晓", initial: "林", age: 28, color: "#ec4899",
    baseTone: { label: "警觉·独立", weight: 68, traits: ["敏锐", "克制", "保护欲", "疏离"] },
    anchors: [
      { id: "b1", label: "那个秘密档案", type: "秘密", color: "#ef4444" },
      { id: "b2", label: "旧烟盒", type: "物品", color: "#6366f1" },
      { id: "b3", label: "陈默的影响", type: "关系", color: "#ec4899" },
    ],
    background: { cls: "中产", profession: "调查记者", history: "独自追查工厂事故五年，持有关键目击记录" },
    instant: { emotion: "警觉", intensity: 75, physiology: "精神亢奋", energy: 65 },
    does: { d: 60, o: 70, e: 85, s: 55 }, category: "核心人物",
  },
  {
    id: "mastermind", name: "幕后人", initial: "暗", age: 60, color: "#f59e0b",
    baseTone: { label: "从容·掌控", weight: 88, traits: ["冷酷", "远见", "自我辩护", "权威"] },
    anchors: [
      { id: "c1", label: "那场火灾的真相", type: "秘密", color: "#ef4444" },
      { id: "c2", label: "保护名单", type: "记忆", color: "#10b981" },
      { id: "c3", label: "陈默父亲", type: "关系", color: "#8b5cf6" },
    ],
    background: { cls: "上层", profession: "前工厂主/退休官员", history: "主导了1997年的事故善后与封锁，以此保全了更多人" },
    instant: { emotion: "从容", intensity: 20, physiology: "精力充沛", energy: 85 },
    does: { d: 55, o: 90, e: 30, s: 82 }, category: "核心人物",
  },
];

export const ASSET_CARDS: AssetCard[] = [
  {
    id: 1001, characterId: "chen-mo", state: "愤怒", emotionLabel: "愤怒", intensity: 80,
    date: "2026年3月17日", category: "核心人物",
    does: { d: 82, o: 48, e: 65, s: 40 },
    content: `"你知道那天谁在现场。"

陈默的手指按在桌面上，发出清脆的笃笃声。他没有抬头。

李刑警退后了半步，眼神飘向别处。

                    陈默
          （低声，更冷）
          别告诉我你不知道。`,
  },
  {
    id: 1002, characterId: "chen-mo", state: "冷静", emotionLabel: "冷静", intensity: 30,
    date: "2026年3月17日", category: "核心人物",
    does: { d: 58, o: 75, e: 55, s: 62 },
    content: `陈默在档案馆待了整整三个小时。

他没有翻任何东西，只是坐在角落的椅子上，把那份名单默背了三遍。

然后他把文件夹还了回去，推开椅子，不动声色地离开。

门关上的声音，轻得像一声告别。`,
  },
  {
    id: 1003, characterId: "chen-mo", state: "决心", emotionLabel: "决心", intensity: 92,
    date: "2026年3月15日", category: "核心人物",
    does: { d: 95, o: 60, e: 70, s: 35 },
    content: `                    陈默
          （低声，只对自己说）
          这是最后一次了。

他推开了那扇门。

外面是暴雨。他没有带伞，没有回头，径直走进了雨里。`,
  },
  {
    id: 1004, characterId: "lin-xiao", state: "警觉", emotionLabel: "警觉", intensity: 75,
    date: "2026年3月17日", category: "核心人物",
    does: { d: 55, o: 72, e: 78, s: 60 },
    content: `林晓在收到消息的第十秒，就换好了衣服。

她没有带手机——那部手机早就被监听了。

路过镜子时，她没有看自己。

出了门，她沿着平时绝不会走的路线，向东走了六个街区。`,
  },
  {
    id: 1005, characterId: "lin-xiao", state: "温柔", emotionLabel: "温柔", intensity: 40,
    date: "2026年3月15日", category: "核心人物",
    does: { d: 35, o: 55, e: 95, s: 68 },
    content: `                    林晓
          （很轻，像不想被听见）
          你这次，能不能让我先走？

陈默没有说话。

林晓把手从他的手臂上移开，整理了一下外套的领子，像是在整理别的什么。`,
  },
  {
    id: 1006, characterId: "lin-xiao", state: "愤怒", emotionLabel: "愤怒", intensity: 85,
    date: "2026年3月12日", category: "核心人物",
    does: { d: 72, o: 60, e: 88, s: 45 },
    content: `林晓把那个信封摔在桌上。

                    林晓
          三年。三年你一次都没有联系我。
          现在你来，是因为你需要我。
          不是因为你想起了我。

她没有等陈默回答，就走出了那扇门。`,
  },
  {
    id: 1007, characterId: "mastermind", state: "从容", emotionLabel: "从容", intensity: 20,
    date: "2026年3月14日", category: "核心人物",
    does: { d: 50, o: 92, e: 28, s: 85 },
    content: `幕后人低下头，看了一眼那份陈默递来的文件。

然后，他笑了。

                    幕后人
          你来得比我预想的晚了三年。
          但你来了，就好。

他把文件推了回去，没有再看第二眼。`,
  },
  {
    id: 1008, characterId: "mastermind", state: "冷酷", emotionLabel: "冷酷", intensity: 88,
    date: "2026年3月14日", category: "核心人物",
    does: { d: 62, o: 88, e: 18, s: 92 },
    content: `                    幕后人
          那47个人，每一个我都记得。
          那是我二十年来睡得最好的一段日子。

他把茶杯放回桌上，没有发出任何声响。

陈默攥紧了拳头。`,
  },
  {
    id: 1009, characterId: "mastermind", state: "揭示", emotionLabel: "揭示", intensity: 55,
    date: "2026年3月9日", category: "核心人物",
    does: { d: 45, o: 95, e: 35, s: 78 },
    content: `幕后人走到窗边，背对着陈默。

外面的城市，灯火还亮着。

                    幕后人
          你父亲，和我一样清楚那份名单。
          区别在于，他选择了沉默。
          你选择了什么？`,
  },
];

export const ANCHOR_TYPE_COLORS: Record<string, string> = {
  "物品": "#f59e0b", "记忆": "#8b5cf6", "关系": "#ec4899", "秘密": "#ef4444",
};

export const EMOTION_OPTIONS = ["愤怒", "冷静", "悲伤", "决心", "警觉", "温柔", "从容", "迷茫", "兴奋", "恐惧"];
export const PHYSIOLOGY_OPTIONS = ["正常", "体能透支", "精神亢奋", "精力充沛", "筋疲力尽", "轻微受伤", "酒精影响"];
export const CLASS_OPTIONS = ["底层", "中产", "上层", "边缘人", "流亡者"];

export const BANNER_STATES = [
  { label: "冷静", snippet: "陈默放下枪，转身走向窗边。城市的灯光在他眼睛里毫无意义地流动。" },
  { label: "愤怒", snippet: "陈默将椅子摔在地上。他的喘息声比他想让别人听到的要粗重得多。" },
  { label: "悲伤", snippet: "陈默抬起头，眼眶发红，但他不允许自己哭出声来。" },
  { label: "决绝", snippet: "陈默签下了那份协议，钢笔在纸上划出清晰的声音，像一道判决。" },
  { label: "迷茫", snippet: "陈默在路口站了很久，不知道该往哪边走。雨开始下了。" },
];

// ── LogicAnchorPopover 基因库 ──
export const GENE_SUBSETS = [
  "孤独英雄","复仇母题","道德困境","权力腐化","爱与牺牲","身份认同",
  "背叛弧线","救赎之路","创伤回响","命运与选择","阶级对立","记忆重构",
  "暗恋语境","父子断裂","女性觉醒","战争代价","科技异化","信任崩溃",
  "禁忌之爱","边界人物","替代家庭","隐秘罪行","理想幻灭","孤儿弧线",
  "导师陨落","末日前夕","系统失灵","流亡主题","镜像自我","仪式重演",
];
export const GENE_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#3b82f6","#06b6d4"];
export const REFERENCE_BOARDS = [
  { id: "ref-1", title: "契诃夫之枪原则", excerpt: "凡是在故事第一幕出现的枪，到第三幕必须被使用……", tags: ["结构","悬念"] },
  { id: "ref-2", title: "英雄旅程第七阶", excerpt: "主角深入最深渊，面对最终考验，旧自我在此死亡……", tags: ["弧线","转折"] },
  { id: "ref-3", title: "对话潜台词层次", excerpt: "人们说话时永远不直接说出他们真正想要的东西……", tags: ["对话","情感"] },
];

// ── TasksView 数据 ──
export const TASKS_DATA = [
  {
    id: "rank-logic", type: "核心校准任务", typeColor: "#ef4444",
    title: "叙事逻辑排名", subtitle: "Logic Ranking · Logic-Gateway V2",
    desc: "通过对生成的剧情片段进行排名，帮助改进下一代逻辑网关（Logic-Gateway V2）。您的评分将直接优化 D.O.E.S 算法的精准度，提升个性化生成质量。",
    reward: "算力 2×", rewardColor: "#f59e0b",
    participants: 12847, timeEst: "15 分钟", status: "进行中", statusColor: "#10b981", progress: 73,
  },
  {
    id: "rank-dialogue", type: "核心校准任务", typeColor: "#ef4444",
    title: "高密度对白审美排名", subtitle: "Dialogue Aesthetics · Priority Queue",
    desc: "浏览不同风格的对白并挑选你最认可的。这不仅能提升你的个性化体验，还能获得「算力加速点」。每日排名前 2000 位的贡献者将获得 1 小时额外高速采样时间。",
    reward: "快速赚取工时", rewardColor: "#ef4444",
    participants: 8293, timeEst: "20 分钟", status: "进行中", statusColor: "#10b981", progress: 61,
  },
  {
    id: "survey-mbti", type: "深度调查", typeColor: "#3b82f6",
    title: "人格多重测量", subtitle: "MBTI & Beyond · 181 Questions",
    desc: "181 道题，200+ 种性格与叙事风格匹配结果！分享您的想法，帮助我们探索人类性格与叙事美学的交集。只需 2 小时即可赚取加倍点数！",
    reward: "加倍点数", rewardColor: "#3b82f6",
    participants: 3412, timeEst: "约 2 小时", status: "开放中", statusColor: "#6b7280", progress: 45,
  },
  {
    id: "survey-values", type: "深度调查", typeColor: "#3b82f6",
    title: "核心价值观与逻辑信仰", subtitle: "Core Values Survey · Deep Cognition",
    desc: "关于人类基本价值观与原始叙事逻辑倾向的深度普查。您的反馈将帮助 AI 理解更深层的「逻辑锚点」。4 小时快速赚取贡献积分！",
    reward: "4h 高额积分", rewardColor: "#8b5cf6",
    participants: 1856, timeEst: "约 4 小时", status: "开放中", statusColor: "#6b7280", progress: 28,
  },
  {
    id: "community-roadmap", type: "社区任务", typeColor: "#10b981",
    title: "功能优先级评审", subtitle: "Feature Roadmap · Community Vote",
    desc: "帮助我们确定下一代「数字人代理」的任务优先级。为您重视的功能（如：角色长程记忆、情感偏移算法、跨场景连续性）分配积分，左右产品路线图。",
    reward: "社区影响力", rewardColor: "#10b981",
    participants: 5019, timeEst: "10 分钟", status: "进行中", statusColor: "#10b981", progress: 89,
  },
];

// ── ThemePanel 主题色 ──
export const ACCENT_OPTIONS = [
  { label: "冷色红", color: "#ef4444", desc: "默认 · MJ 经典" },
  { label: "冰蓝",   color: "#60a5fa", desc: "实验室 · 冷感科技" },
  { label: "荧光绿", color: "#10b981", desc: "矩阵 · 数据终端" },
  { label: "深紫",   color: "#a78bfa", desc: "暗物质 · 量子视界" },
];

// ── HelpDrawer 文档目录 ──
export const HELP_SECTIONS = [
  { title: "§1  算法架构白皮书", items: [
    "1.1  D.O.E.S 四维叙事向量理论",
    "1.2  Logic-Gateway V2 接入规范",
    "1.3  基因库 255 子集采样方法论",
    "1.4  叙事连续性约束函数 (Narrative Continuity Fn)",
    "1.5  上下文注入标准化协议 (CIP v1.2)",
  ]},
  { title: "§2  校准系统参考手册", items: [
    "2.1  StyleCalibrator API Reference",
    "2.2  EnvironmentStressor 接口规范",
    "2.3  校准向量合并算法 (WeightedMerge v3)",
    "2.4  A/B 偏好积累机制与权重衰减",
    "2.5  跨会话校准状态持久化方案",
  ]},
  { title: "§3  数据协议规范", items: [
    "3.1  ScriptFragment 数据结构 v1.3",
    "3.2  DoesValues 向量空间定义",
    "3.3  CharacterAnchor 锚点传输协议",
    "3.4  ConstraintInfo 约束注入格式",
    "3.5  EnvValues 环境参数序列化",
  ]},
  { title: "§4  部署与集成指南", items: [
    "4.1  Logic-Gateway 独立接入指南",
    "4.2  基因库实时同步 WebSocket API",
    "4.3  叙事引擎容器化部署方案",
    "4.4  算力节点自动分配策略",
    "4.5  多租户隔离与安全沙箱",
  ]},
  { title: "§5  附录", items: [
    "A.   D.O.E.S 参数校准实验数据集 (n=12,847)",
    "B.   Logic-Gateway 错误码速查表",
    "C.   更新日志 v2.0 → v2.1.0-beta",
    "D.   算法贡献者署名列表",
  ]},
];

// ── NotifPanel 日志 ──
export const NOTIF_LOGS = [
  { time: "14:32", level: "success", msg: "逻辑网关 V2.0 接入成功", detail: "延迟 12ms · 节点 CN-BJ-07 在线" },
  { time: "13:45", level: "success", msg: "基因库子集同步完成", detail: "255 / 255 子集就绪 · 总量 847K 数据点" },
  { time: "12:18", level: "info",    msg: "StyleCalibrator v1.2.1 热更新", detail: "A/B 权重积累算法优化" },
  { time: "10:05", level: "success", msg: "D.O.E.S 精准度 +2.3%", detail: "批次 #4,821 校准数据已并入模型" },
  { time: "09:41", level: "warn",    msg: "叙事模型负载 82%", detail: "高峰期预警 · 已触发弹性算力扩容" },
  { time: "昨天",  level: "success", msg: "环境校准器模块载入成功", detail: "EnvironmentStressor v1.0 · 5 轮校准协议" },
  { time: "昨天",  level: "success", msg: "算力配额重置", detail: "用户算力剩余度已恢复 · 99.9%" },
];
