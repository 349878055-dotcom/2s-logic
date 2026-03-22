/**
 * @Snapshot engines-engine_stable-v1
 * @Role 成熟小说降维：目录、全局常数、切片、法典渲染（可调用 AI）
 * @Guardrail 禁止 fs；结果仅写入内存 fictionLibrary 或作为返回值
 */
// ══════════════════════════════════════════════════════════
// Engine Stable — 剧本区物理脱水管线
// 成熟小说降维：目录提取 → 全局常数锁定 → 逻辑切片 → 三级法典渲染
// 公式：Global Constant + Current Stress = Physical Script
// 严禁任何「偏移」「收敛」逻辑
// ══════════════════════════════════════════════════════════

/** 从 AI 返回中剥壳提取 JSON 字符串，兼容 ```json ... ```、裸 [ ... ]、裸 { ... }
 * 使用括号计数法，正确处理 { "characters": [...] } 等嵌套结构，避免正则歧义
 */
function parseJsonFromAi(raw: string): string | null {
  if (!raw?.trim()) return null;

  // 1. 优先提取 Markdown 代码块
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeBlock ? codeBlock[1]!.trim() : raw.trim();
  if (!toParse) return null;

  // 2. 找到第一个 [ 或 {
  const firstBrace = toParse.search(/[\[\{]/);
  if (firstBrace === -1) return null;
  const startChar = toParse[firstBrace]!;
  const endChar = startChar === "[" ? "]" : "}";

  // 3. 括号匹配提取（避开字符串内的括号），避免 { "characters": [...] } 产生歧义
  let depth = 0;
  let inString = false;
  let escape = false;
  let quoteChar = "";
  for (let i = firstBrace; i < toParse.length; i++) {
    const c = toParse[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === quoteChar) {
        inString = false;
        continue;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quoteChar = c;
      continue;
    }
    if (c === startChar) {
      depth++;
      continue;
    }
    if (c === endChar) {
      depth--;
      if (depth === 0) return toParse.slice(firstBrace, i + 1);
    }
  }
  return null;
}

import {
  fictionLibrary,
  generateSeedId,
  type GlobalPersona,
  type NovelChapter,
  type SeedSegment,
} from "@/lib/core/store";
import type { ScriptCard } from "./will_engine";

// ── 依赖 will_engine 的公共工具（仅 API 与常数构造）────────────────────────
import {
  getOpenAI,
  createLockedConstant,
  createLockedMatrix,
  toEgo,
  toGoal,
  toLogic,
} from "./will_engine";

// ============================================================================
// 目录索引提取 — 纯物理双层排版（废弃所有 AI）
// ============================================================================

/** 无自然章节时退化为 5000 字硬切 */
function physicalHardCut(fullText: string): NovelChapter[] {
  const chapters: NovelChapter[] = [];
  const CHUNK = 5000;
  for (let i = 0; i < fullText.length; i += CHUNK) {
    const start = i;
    const end = Math.min(i + CHUNK, fullText.length);
    const chunk = fullText.slice(start, end);
    chapters.push({
      title: `逻辑片段 #${chapters.length}`,
      startIndex: start,
      endIndex: end,
      summary: "物理锁定",
      isCompiled: false,
      anchor: chunk.slice(0, 20).replace(/\n/g, " "),
    });
    console.log(`[Batch] 逻辑片段 #${chapters.length - 1} | 范围: ${start} -> ${end} | 结尾: ${chunk.slice(-30).replace(/\n/g, "\\n")}`);
  }
  return chapters;
}

/**
 * 🛠️ 纯物理双层排版逻辑
 * 层级 1: 正则抓取自然章节 (页面显示)
 * 层级 2: 3500-5000 字物理聚合 (后台逻辑)
 */
export async function extractChapterMap(fullText: string): Promise<NovelChapter[]> {
  if (!fullText?.trim()) return [];

  const chapters: NovelChapter[] = [];
  // 1. 定义特征库 (支持回、章、节、Chapter)
  const chapterRegex = /(第[一二三四五六七八九十百]+[回章节].*|Chapter\s+\d+.*)\n/g;
  const matches = [...fullText.matchAll(chapterRegex)];

  // 如果找不到自然章节，退化为 5000 字硬切模式
  if (matches.length === 0) return physicalHardCut(fullText);

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]!.index!;
    const end = matches[i + 1] ? matches[i + 1]!.index! : fullText.length;
    const title = matches[i]![0].trim();
    const content = fullText.slice(start, end);

    // 2. 内部物理聚合：不准断句，不准碰 AI
    let ptr = 0;
    while (ptr < content.length) {
      let subEnd = ptr + 5000;
      if (subEnd < content.length) {
        const window = content.slice(ptr + 3500, subEnd);
        const lastLine = window.lastIndexOf("\n");
        subEnd = lastLine !== -1 ? ptr + 3500 + lastLine + 1 : subEnd;
      } else {
        subEnd = content.length;
      }

      const batchContent = content.slice(ptr, subEnd);
      chapters.push({
        title: ptr === 0 ? title : `${title} (续)`,
        startIndex: start + ptr,
        endIndex: start + subEnd,
        summary: "物理锁定",
        isCompiled: false,
        anchor: batchContent.slice(0, 20).replace(/\n/g, " "),
      });

      // 🔴 CMD 全量审计输出
      const tail = batchContent.slice(Math.max(0, batchContent.length - 30)).replace(/\n/g, "\\n");
      console.log(`[Batch] ${ptr === 0 ? title : title + " (续)"} | 范围: ${start + ptr} -> ${start + subEnd} | 结尾: ...${tail}`);

      ptr = subEnd;
    }
  }
  return chapters;
}

// ============================================================================
// 全文切片人设粗抽（全局常数提纯）
// ============================================================================

const CHUNK_PERSONA_PROMPT = `
你是一个无情的文学数据清洗员、心理侧写师和博弈论分析专家。请阅读以下物理切片文本。

【核心任务】：在下文片段中寻找指定的【目标人物】。
1. 过滤：如果【目标人物】在本段没有出场，或仅仅是被路人顺嘴提到而没有实质动作，必须返回 "is_active": false，其他所有特征值填 null！绝对禁止脑补！
2. 提取：如果【目标人物】明确出场并有实质言行，请返回 "is_active": true，并严格按照下方的【5档原子死指令量表】评估他的 D.O.E.S 状态。

=========================================
【D.O.E.S 量表与原子死指令】（请根据目标人物在本段的表现，分别在 0, 25, 50, 75, 100 中选择唯一确定的值）

[D: 驱动力]
0   [绝对淡泊]: 拒绝干预环境。禁止出现争抢、反击或主动获取资源的行为。
25  [低度驱动]: 被动反应。禁止主动出击。只在被攻击或生存受威胁时进行最小限度反击。
50  [动态平衡]: 常规进取。禁止冒险。在确认风险可控的前提下按部就班获取资源。
75  [积极扩张]: 寻找突破点。禁止原地踏步。必须带有明显的推动意图或目标导向。
100 [极端扩张]: 贪婪式吞噬。必须不断通过压榨环境或他人来完成自我膨胀。

[O: 规则感]
0   [极端实用]: 规则即累赘。绝对禁止提及公平、道德。所有违规行为以“效率”为唯一逻辑。
25  [灵活底线]: 寻找漏洞。禁止死守协议。寻找一切可规避责任且不触发致命惩罚的手段。
50  [契约合规]: 框架内博弈。禁止主动违法。严格按合同/规矩办事。
75  [名声导向]: 维护社会评价。禁止执行任何可能损害长期信誉的行为，即便短期利益极大。
100 [规则洁癖]: 程序正义高于一切。禁止出现变通。宁可归零，不可违约。

[E: 情感核算]
0   [绝对冷酷]: 视人为耗材。禁止出现歉意。严禁对伤亡进行描述，只允许计算损益。
25  [利益优先]: 承认生命存在，但 ROI 优先。禁止为拯救生命牺牲既定利益。
50  [职业理性]: 标准社会化反应。在不影响成本前提下执行常规人道。
75  [温情主义]: 生命具有溢价。禁止在有营救可能时抛弃。台词带安抚倾向。
100 [情感燃烧]: 感性逻辑高于理性。禁止进行成本核算。可为情感推翻利益计算。

[S: 信任防御]
0   [绝对共享]: 单向透明。禁止隐瞒信息与设防。即使面对敌人也保持逻辑全开放。
25  [低度设防]: 信任先行。禁止预设性怀疑。假定所有人都是伙伴。
50  [标准社交]: 对等防御。禁止透露核心机密。根据对方反馈线性调整信任等级。
75  [高度警惕]: 预设敌意。禁止在公共场合说真话。回应必须经过语义伪装。
100 [绝对堡垒]: 生存妄想症。禁止产生任何信任。处于极致的闭锁态。

### 📋 必须严格遵循的 JSON Schema ###
{
  "is_active": <boolean, 目标人物在本段是否有实质出场与行为>,
  
  "chunk_does": { 
    "d": <number, 必须是 0 , 25 , 50, 75, 100 之一>, 
    "o": <number, 必须是 0 , 25 , 50, 75, 100 之一>, 
    "e": <number, 必须是 0 , 25 , 50, 75, 100 之一>, 
    "s": <number, 必须是 0 , 25 , 50, 75, 100 之一> 
  },
  
  "chunk_bandwidth": <number 0-100, 本段展现出的逻辑带宽/智力上限。100为算无遗策, 0为大脑宕机>,
  
  "ego_type": "<string, 仅限填写：自卑、自负 或 客观>",
  "dynamic_goal": "<string, 仅限填写：生存、获利、情感 或 复仇>",
  "logic_link": "<string, 仅限填写：因果论、情绪论 或 利弊论>",

  "anchor_object": "<string 或 null, 人生长期锚定物。必须是本段中【明确体现】的执念！如果没有明确写出，绝对不允许脑补，必须严格填 null>",
  "anchor_intensity": "<number 0-100 或 null, 锚定物的强烈度。若 anchor_object 为 null, 此项必须填 null>"
}
`;

function deduplicateCharacters(
  list: Array<{ name: string; summary?: string }>
): Array<{ name: string; summary: string }> {
  const seen = new Set<string>();
  return list
    .filter((c) => {
      const key = c.name.trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({ name: c.name.trim(), summary: (c.summary ?? "").trim().slice(0, 80) }));
}

/**
 * 全量逻辑片段驱动的人物普查：大批次 4 万字 + 逻辑切片 3000-5000 字，禁止采样
 */
export async function discoverCharacters(
  fullText: string
): Promise<{ characters?: Array<{ name: string; summary: string }> }> {
  const BIG_BATCH_SIZE = 40000;
  const pipeline = new DehydrationPipeline();
  const allDiscoveredCharacters: Array<{ name: string; summary?: string }> = [];

  console.log(
    `\n[物理审计] 开始全量扫描，总长度: ${fullText.length}，每轮处理: ${BIG_BATCH_SIZE} 字\n`
  );

  for (let offset = 0; offset < fullText.length; offset += BIG_BATCH_SIZE) {
    const bigBatchText = fullText.slice(offset, offset + BIG_BATCH_SIZE);
    const logicalBatches = pipeline.splitIntoLogicalBatchesForScope(bigBatchText, offset);
    const roundNum = Math.floor(offset / BIG_BATCH_SIZE) + 1;

    console.log(`\n--- [第 ${roundNum} 轮大扫描] ---`);
    console.log(
      `区间: ${offset} -> ${offset + bigBatchText.length} | 产生逻辑片段数: ${logicalBatches.length}`
    );

    const promptContext = logicalBatches
      .map(
        (b) =>
          `【逻辑片段 #${b.batchSequence} | 物理指针: ${b.startIndex}-${b.endIndex}】\n${b.text}`
      )
      .join("\n\n===\n\n");

    console.log(`[CMD 原始发送审计] 发送前汇总: 第 ${roundNum} 轮 | ${logicalBatches.length} 个 Batch`);
    for (const b of logicalBatches) {
      const tail = b.text.slice(-50).replace(/\n/g, "\\n");
      console.log(`  BATCH_ID #${b.batchSequence} | [${b.startIndex}-${b.endIndex}] | 结尾50字: ...${tail}`);
    }
    console.log(`[CMD 原始发送审计] 正在向 Jimmy 发送完整 ${bigBatchText.length} 字逻辑矩阵...`);

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
      messages: [
        {
          role: "user",
          content: `请从以下逻辑片段中识别所有出场人物名及其 25 字内简介，以 JSON 格式返回，如 {"characters": [{"name": "西门庆", "summary": "清河县殷实药商"}]}。\n\n${promptContext}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    console.log(`[CMD 原始返回审计] 第 ${roundNum} 轮返回数据:\n${raw}\n`);

    const jsonStr = parseJsonFromAi(raw) ?? raw;
    const parsed = JSON.parse(jsonStr) as { characters?: Array<{ name: string; summary?: string }> };
    const chars = parsed.characters ?? [];
    allDiscoveredCharacters.push(...chars);

    // 人物 Idx 验证：拿着名单去逻辑片段里硬碰硬搜索
    if (chars.length > 0 && logicalBatches.length > 0) {
      console.log(`[人物 Idx 验证] 本轮发现 ${chars.length} 人，坐标染色:`);
      for (const c of chars) {
        const name = c.name?.trim();
        if (!name) continue;
        for (const batch of logicalBatches) {
          let pos = batch.text.indexOf(name);
          while (pos !== -1) {
            const globalIdx = batch.startIndex + pos;
            const inRange =
              globalIdx >= batch.startIndex && globalIdx <= batch.endIndex ? "✓" : "✗";
            console.log(`  ${name} Found at Idx: ${globalIdx} (Batch #${batch.batchSequence}) ${inRange}`);
            pos = batch.text.indexOf(name, pos + 1);
          }
        }
      }
    }
  }

  const result = deduplicateCharacters(allDiscoveredCharacters);
  console.log(`\n[物理审计完成] 去重后共 ${result.length} 个人物\n`);
  return { characters: result };
}

const LOCAL_DELTA_PROMPT = `
你是一个无情的剧本场记和状态分析师。你的任务是从小说片段中，切分出该人物的【动作分镜】，并评估其当前的【物理/社会负荷】。
注意：人物的性格是固定常数，你不需要分析性格！你只需要提取触发事件、环境压强，以及决定他"算力余量"的限制条件！

### 📋 必须返回的 JSON 格式 ###
{
  "segments": [
    {
      "text_excerpt": "识别到的原文关键句（用于物理对齐）",
      "event_trace": { "trigger": "瞬时刺激源（如：听到宝玉定亲）" },
      "stress": 98,
      "status_limiters": {
        "physical_condition": "当下的生理状态（如：健康/咳血濒死/醉酒）",
        "social_standing": "当下的处境/地位（如：绝对权威/孤立无援）",
        "compute_penalty": 0.2
      }
    }
  ]
}
`;

// ============================================================================
// 逻辑批次：带有物理坐标和人物指针，避免暴力切肉导致语义碎裂
// ============================================================================

export interface LogicalBatch {
  batchSequence: number;
  startIndex: number;
  endIndex: number;
  text: string;
  characterPointers: Record<string, Array<{ start: number; end: number }>>;
}

/**
 * CoordConverter: 坐标转换器
 * 将 AI 提取的局部偏移量叠加 Batch 基准地址，还原为全书绝对坐标
 */
export function convertToGlobalRange(
  batch: LogicalBatch,
  textExcerpt: string
): { start: number; end: number } {
  const relativeStart = batch.text.indexOf(textExcerpt);
  if (relativeStart === -1 && textExcerpt.length > 10) {
    const fuzzySearch = textExcerpt.slice(0, 10);
    const fuzzyRelativeStart = batch.text.indexOf(fuzzySearch);
    if (fuzzyRelativeStart !== -1) {
      return {
        start: batch.startIndex + fuzzyRelativeStart,
        end: batch.startIndex + fuzzyRelativeStart + textExcerpt.length,
      };
    }
  }
  if (relativeStart !== -1) {
    return {
      start: batch.startIndex + relativeStart,
      end: batch.startIndex + relativeStart + textExcerpt.length,
    };
  }
  return { start: batch.startIndex, end: batch.startIndex + 10 };
}

// ============================================================================
// DehydrationPipeline — 剧本区降维管线
// ============================================================================

export class DehydrationPipeline {
  private productionId: string;

  constructor(productionId?: string) {
    this.productionId = productionId ?? `dehydrate-${Date.now()}`;
  }

  get id(): string {
    return this.productionId;
  }

  async processMatureNovel(charId: string, charName: string, fullText: string): Promise<void> {
    console.log("========== 🚀 启动成熟小说降维管线 (剧本区) ==========");

    const globalPersona = await this.extractTrueGlobalPersona(charName, fullText);
    if (!globalPersona) throw new Error("全局常量提取失败，未找到足够的人物戏份。");

    const batches = this.splitIntoLogicalBatches(fullText, [charName]);

    for (const batch of batches) {
      const deltas = await this.extractLocalDeltas(batch.text, charName);
      await new Promise((r) => setTimeout(r, 4500)); // 物理降速，避免 API 限流
      if (!deltas || deltas.length === 0) continue;

      const enrichedDeltas = deltas.map((delta) => {
        const globalRange = convertToGlobalRange(batch, delta.text_excerpt);
        return { ...delta, textRange: globalRange };
      });

      const translatedScripts = await this.translateWithConstants(
        batch.text,
        enrichedDeltas,
        globalPersona
      );
      this.saveDehydratedBatch(
        charId,
        charName,
        batch.batchSequence,
        batch.text,
        enrichedDeltas,
        globalPersona,
        translatedScripts
      );
    }
  }

  /** 公开：供 discoverCharacters 调用，对局部文本切片并叠加基准偏移得到全局坐标 */
  splitIntoLogicalBatchesForScope(text: string, baseOffset: number): LogicalBatch[] {
    return this.splitIntoLogicalBatches(text, [], baseOffset);
  }

  /**
   * 物理段落对齐切片：在 3500-5000 字区间寻找第一个 \n，见换行就收刀，确保 Batch 结尾是完整段落
   */
  private splitIntoLogicalBatches(
    fullText: string,
    targetNames: string[] = [],
    baseOffset = 0
  ): LogicalBatch[] {
    const batches: LogicalBatch[] = [];
    const totalLength = fullText.length;
    let currentPtr = 0;
    const MIN_CHUNK = 3500;
    const MAX_CHUNK = 5000;
    let batchSequence = 0;

    const globalPointers: Record<string, Array<{ start: number; end: number }>> = {};
    for (const name of targetNames) {
      globalPointers[name] = [];
      const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeName, "g");
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        globalPointers[name].push({ start: match.index, end: match.index + name.length - 1 });
      }
    }

    while (currentPtr < totalLength) {
      if (totalLength - currentPtr <= MAX_CHUNK) {
        const lastBatch = this.buildBatchData(
          batchSequence++,
          currentPtr,
          totalLength - 1,
          fullText,
          globalPointers,
          baseOffset
        );
        this.logBatchDetail(lastBatch);
        batches.push(lastBatch);
        break;
      }

      const searchWindow = fullText.slice(currentPtr + MIN_CHUNK, currentPtr + MAX_CHUNK);
      const lineBreakMatch = searchWindow.indexOf("\n");

      let cutOffset = MAX_CHUNK;
      if (lineBreakMatch !== -1) {
        cutOffset = MIN_CHUNK + lineBreakMatch + 1;
      }

      const endPtr = currentPtr + cutOffset - 1;
      const newBatch = this.buildBatchData(
        batchSequence++,
        currentPtr,
        endPtr,
        fullText,
        globalPointers,
        baseOffset
      );
      this.logBatchDetail(newBatch);
      batches.push(newBatch);
      currentPtr = endPtr + 1;
    }

    console.log(
      `\n[物理审计完成] 共生成 ${batches.length} 个逻辑片段，平均长度: ${batches.length > 0 ? Math.round(totalLength / batches.length) : 0} 字\n`
    );
    return batches;
  }

  /** CMD 审计员：全量打印 BATCH_ID/起止坐标，结尾 50 字用 \\n 显示换行，肉眼验证不断句 */
  private logBatchDetail(batch: LogicalBatch) {
    console.log(`\n================== [CMD 逻辑片段审计] ==================`);
    console.log(`BATCH_ID: #${batch.batchSequence}`);
    console.log(`物理区间: [${batch.startIndex} -> ${batch.endIndex}]`);
    console.log(`总计字数: ${batch.text.length}`);
    console.log(`片段开头: "${batch.text.slice(0, 50).replace(/\n/g, "\\n")}..."`);
    console.log(`片段结尾(封口检查): "...${batch.text.slice(-50).replace(/\n/g, "\\n")}"`);
    const charactersFound = Object.keys(batch.characterPointers);
    console.log(
      `物理染色结果: ${charactersFound.length > 0 ? charactersFound.join(", ") : "【本段无目标人物】"}`
    );
    if (charactersFound.length > 0) {
      for (const name of charactersFound) {
        const ptrs = batch.characterPointers[name]!.map((p) => p.start);
        for (const idx of ptrs) {
          const inRange = idx >= batch.startIndex && idx <= batch.endIndex ? "✓" : "✗";
          console.log(`  └─ ${name} Idx: ${idx} (Batch ${batch.startIndex}-${batch.endIndex}) ${inRange}`);
        }
      }
    }
    console.log(`========================================================\n`);
  }

  /**
   * 基准叠加：localPointers 必须将片段内相对位置加上 baseOffset，确保 Idx 落在 startIndex-endIndex
   */
  private buildBatchData(
    batchSequence: number,
    startPtr: number,
    endPtr: number,
    fullText: string,
    globalPointers: Record<string, Array<{ start: number; end: number }>>,
    baseOffset = 0
  ): LogicalBatch {
    const text = fullText.slice(startPtr, endPtr + 1);
    const localPointers: Record<string, Array<{ start: number; end: number }>> = {};
    for (const [name, ptrs] of Object.entries(globalPointers)) {
      const valid = ptrs
        .filter((p) => p.start >= startPtr && p.end <= endPtr)
        .map((p) => ({
          start: p.start + baseOffset,
          end: p.end + baseOffset,
        }));
      if (valid.length > 0) localPointers[name] = valid;
    }
    return {
      batchSequence,
      startIndex: startPtr + baseOffset,
      endIndex: endPtr + baseOffset,
      text,
      characterPointers: localPointers,
    };
  }

  /** 公开：供 /api/solidify-persona 调用，单独提取某角色的全局常数 */
  async extractGlobalPersona(charName: string, fullText: string): Promise<GlobalPersona | null> {
    return this.extractTrueGlobalPersona(charName, fullText);
  }

  /**
   * 全局常数提纯：11 维允许 null，仅用有效打分的章节数求平均，严禁 50 分稀释
   */
  private async extractTrueGlobalPersona(
    charName: string,
    fullText: string
  ): Promise<GlobalPersona | null> {
    console.log(`[Global Constant] 开始对 ${charName} 进行全文本切片提取...`);
    const chunks = this.splitIntoBatches(fullText, 15000);
    const chunkResults: Array<{
      chunk_does?: { d?: number; o?: number; e?: number; s?: number };
      chunk_bandwidth?: number | null;
      ego_type?: string;
      dynamic_goal?: string;
      logic_link?: string;
      anchor_object?: string | null;
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const completion = await getOpenAI().chat.completions.create({
          model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
          messages: [
            { role: "user", content: `${CHUNK_PERSONA_PROMPT}\n【目标人物】：${charName}\n【切片原文】：\n${chunks[i]}` },
          ],
          response_format: { type: "json_object" },
        });
        const raw = completion.choices[0]?.message?.content?.trim() ?? "";
        const jsonStr = parseJsonFromAi(raw);
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr) as {
            is_active?: boolean;
            chunk_does?: { d?: number; o?: number; e?: number; s?: number };
            chunk_bandwidth?: number;
            ego_type?: string;
            dynamic_goal?: string;
            logic_link?: string;
            anchor_object?: string | null;
          };
          const hasValidData = parsed?.chunk_does || parsed?.chunk_bandwidth || parsed?.ego_type;
          if (parsed?.is_active !== false && hasValidData) {
            chunkResults.push({
              chunk_does: {
                d: parsed.chunk_does?.d,
                o: parsed.chunk_does?.o,
                e: parsed.chunk_does?.e,
                s: parsed.chunk_does?.s,
              },
              chunk_bandwidth: parsed.chunk_bandwidth,
              ego_type: parsed.ego_type,
              dynamic_goal: parsed.dynamic_goal,
              logic_link: parsed.logic_link,
              anchor_object: parsed.anchor_object,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (chunkResults.length === 0) {
      // 兜底：返回默认 persona，避免因 AI 未识别而直接崩溃
      console.warn(`[Global Constant] ${charName} 未在切片中识别到戏份，使用默认 persona 继续`);
      return {
        character_name: charName,
        global_does: { d: 55, o: 50, e: 50, s: 50 },
        global_bandwidth: 72,
        ego_type: "客观",
        dynamic_goal: "情感",
        logic_link: "因果论",
      };
    }

    // 仅对有效打分求和，严禁 50 稀释；统计锚定物出现频次
    let sumD = 0, countD = 0;
    let sumO = 0, countO = 0;
    let sumE = 0, countE = 0;
    let sumS = 0, countS = 0;
    let sumBw = 0, countBw = 0;
    const egoCounts: Record<string, number> = { 自卑: 0, 自负: 0, 客观: 0 };
    const goalCounts: Record<string, number> = { 生存: 0, 获利: 0, 情感: 0, 复仇: 0 };
    const logicCounts: Record<string, number> = { 因果论: 0, 情绪论: 0, 利弊论: 0 };
    const anchorCounts: Record<string, number> = {};

    for (const r of chunkResults) {
      if (r.anchor_object) anchorCounts[r.anchor_object] = (anchorCounts[r.anchor_object] || 0) + 1;
      const d = r.chunk_does?.d;
      if (typeof d === "number" && !Number.isNaN(d)) { sumD += d; countD++; }
      const o = r.chunk_does?.o;
      if (typeof o === "number" && !Number.isNaN(o)) { sumO += o; countO++; }
      const e = r.chunk_does?.e;
      if (typeof e === "number" && !Number.isNaN(e)) { sumE += e; countE++; }
      const s = r.chunk_does?.s;
      if (typeof s === "number" && !Number.isNaN(s)) { sumS += s; countS++; }
      const bw = r.chunk_bandwidth;
      if (typeof bw === "number" && !Number.isNaN(bw)) { sumBw += bw; countBw++; }
      if (r.ego_type) egoCounts[r.ego_type] = (egoCounts[r.ego_type] || 0) + 1;
      if (r.dynamic_goal)
        goalCounts[r.dynamic_goal] = (goalCounts[r.dynamic_goal] || 0) + 1;
      if (r.logic_link)
        logicCounts[r.logic_link] = (logicCounts[r.logic_link] || 0) + 1;
    }

    const getMajority = (counts: Record<string, number>, defaultVal: string) =>
      (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as string) || defaultVal;

    // 仅当该维度有有效样本时才求平均；无样本时使用 50（仅作兜底，非稀释）
    const avgD = countD > 0 ? Math.round(sumD / countD) : 50;
    const avgO = countO > 0 ? Math.round(sumO / countO) : 50;
    const avgE = countE > 0 ? Math.round(sumE / countE) : 50;
    const avgS = countS > 0 ? Math.round(sumS / countS) : 50;
    const avgBw = countBw > 0 ? Math.round(sumBw / countBw) : 80;

    const majorityAnchor = Object.entries(anchorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      character_name: charName,
      global_does: { d: avgD, o: avgO, e: avgE, s: avgS },
      global_bandwidth: avgBw,
      ego_type: getMajority(egoCounts, "客观") as "自卑" | "自负" | "客观",
      dynamic_goal: getMajority(goalCounts, "生存") as "生存" | "获利" | "情感" | "复仇",
      logic_link: getMajority(logicCounts, "因果论") as "因果论" | "情绪论" | "利弊论",
      global_anchor_object: majorityAnchor,
    };
  }

  private async extractLocalDeltas(text: string, charName: string) {
    try {
      const promptPayload = `${LOCAL_DELTA_PROMPT}\n【目标人物】：${charName}\n【原文】：\n${text}`;

      console.log("\n--- [DEBUG] 正在发送【逻辑脱水】给 ChatGPT ---");
      console.log(`TARGET: ${charName}`);
      console.log(`PAYLOAD: ${promptPayload.slice(0, 500)}...`);
      console.log("----------------------------------------------\n");

      const completion = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
        messages: [
          { role: "system", content: "你现在是逻辑脱水机，必须严格输出 11 维度 JSON 数据。" },
          { role: "user", content: promptPayload },
        ],
        response_format: { type: "json_object" },
      });
      const rawText = completion.choices[0]?.message?.content?.trim() ?? "";
      const jsonStr = parseJsonFromAi(rawText);
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr) as
            | { segments?: Array<{
                text_excerpt: string;
                event_trace?: { trigger?: string };
                stress?: number;
                status_limiters?: {
                  physical_condition?: string;
                  social_standing?: string;
                  compute_penalty?: number;
                };
              }> }
            | unknown[];
          if (Array.isArray(parsed)) return parsed as Array<{
            text_excerpt: string;
            event_trace?: { trigger?: string };
            stress?: number;
            status_limiters?: { physical_condition?: string; social_standing?: string; compute_penalty?: number };
          }>;
          return parsed.segments || [];
        } catch (e) {
          console.error("脱水解析失败，AI原话：", rawText.slice(0, 200));
          return [];
        }
      }
    } catch (err) {
      console.error("局部切片提取失败:", err);
    }
    return [];
  }

  private async translateWithConstants(
    text: string,
    deltas: Array<{
      text_excerpt: string;
      event_trace?: { trigger?: string };
      stress?: number;
      status_limiters?: {
        physical_condition?: string;
        social_standing?: string;
        compute_penalty?: number;
      };
    }>,
    globalPersona: GlobalPersona
  ): Promise<ScriptCard[]> {
    const mapContext = deltas.map((delta) => {
      const stress = delta.stress ?? 50;
      const penalty = delta.status_limiters?.compute_penalty ?? 1.0;
      const maxBw = globalPersona.global_bandwidth ?? 80;
      return {
        PRIORITY_1_CONTEXT: {
          trigger: delta.event_trace?.trigger ?? "剧情推进",
          immediate_stress: stress,
        },
        PRIORITY_2_GLOBAL_CONSTANT: {
          does: globalPersona.global_does,
          ego: globalPersona.ego_type,
          goal: globalPersona.dynamic_goal,
          logic: globalPersona.logic_link,
          anchor: globalPersona.global_anchor_object ?? "无",
        },
        PRIORITY_3_STATUS_LIMITERS: {
          physical_condition: delta.status_limiters?.physical_condition ?? "正常",
          social_standing: delta.status_limiters?.social_standing ?? "正常",
          effective_compute: Math.max(
            2,
            Math.round(maxBw * penalty * (1 - stress / 150))
          ),
        },
      };
    });

    const prompt = `你是一个顶级的物理剧本渲染引擎。必须严格按照【三级物理法典】的优先级，将下方的小说原文转化为客观动作剧本。
【!!! 三级物理法典（绝对优先级） !!!】
🔴 [优先级 1：当下上下文事实] 动作发生严格遵循原文事实与 immediate_stress (瞬时压强)。不允许篡改剧情！
🟡 [优先级 2：人物底色常数] 基因锁死！必须符合 DOES 的物理习惯（如S低的人动作必须带有防备感）。
🔵 [优先级 3：算力余量限制] 若 effective_compute < 30，人物已被摧毁，台词必须严重破碎失声，肢体失控！严禁给低算力人物写长逻辑台词！
【原文】:\n${text}\n
【三级控制面板】:\n${JSON.stringify(mapContext, null, 2)}
请直接返回标准六元素剧本的 JSON 数组（包含 environment, action, expression, detail, monologue, dialogue）。严禁使用主观形容词！`;

    try {
      const completion = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
      const jsonStr = parseJsonFromAi(raw) ?? raw;
      try {
        const parsed = JSON.parse(jsonStr) as { scripts?: ScriptCard[] } | ScriptCard[];
        if (Array.isArray(parsed)) return parsed;
        return parsed.scripts || [];
      } catch (e) {
        console.error("剧本渲染解析失败，AI原话：", raw.slice(0, 200));
        return [];
      }
    } catch {
      return [];
    }
  }

  private saveDehydratedBatch(
    charId: string,
    charName: string,
    seq: number,
    raw: string,
    deltas: Array<{
      text_excerpt: string;
      event_trace?: { trigger?: string };
      stress?: number;
      status_limiters?: {
        physical_condition?: string;
        social_standing?: string;
        compute_penalty?: number;
      };
      textRange?: { start: number; end: number };
    }>,
    globalPersona: GlobalPersona,
    scripts: ScriptCard[]
  ) {
    const batchId = `${this.productionId}-${seq}`;
    let batch = fictionLibrary.get(batchId);
    if (!batch) {
      batch = { batchSequence: seq, batchId, rawText: raw, characterTracks: {} };
      fictionLibrary.set(batchId, batch);
    }

    const segments: SeedSegment[] = deltas.map((delta, idx) => {
      const startIdx = raw.indexOf(delta.text_excerpt);
      const textRange = delta.textRange ?? {
        start: Math.max(0, startIdx),
        end: startIdx >= 0 ? startIdx + delta.text_excerpt.length : 0,
      };
      const stress = delta.stress ?? 50;
      const penalty = delta.status_limiters?.compute_penalty ?? 1.0;
      const lockedSeed = {
        skin: "经典角色",
        context: delta.status_limiters?.physical_condition ?? "剧情推进",
        does: {
          d: createLockedConstant(globalPersona.global_does.d),
          o: createLockedConstant(globalPersona.global_does.o),
          e: createLockedConstant(globalPersona.global_does.e),
          s: createLockedConstant(globalPersona.global_does.s),
        },
        bandwidth: createLockedConstant(globalPersona.global_bandwidth),
        ego_type: createLockedMatrix(toEgo(globalPersona.ego_type), ["自卑", "自负", "客观"]),
        dynamic_goal: createLockedMatrix(toGoal(globalPersona.dynamic_goal), ["生存", "获利", "情感", "复仇"]),
        logic_link: createLockedMatrix(toLogic(globalPersona.logic_link), ["因果论", "情绪论", "利弊论"]),
        anchor: { value: globalPersona.global_anchor_object ?? null, locked: true },
        stress,
        compute: Math.max(
          2,
          Math.round(
            globalPersona.global_bandwidth * penalty * (1 - stress / 150)
          )
        ),
        depth: seq,
        createdAt: Date.now(),
      };
      return {
        segmentId: `dehydrated-${generateSeedId()}`,
        textRange,
        identity: {
          character_name: charName,
          social_profile: delta.status_limiters?.social_standing || "常态",
          social_background: "",
          status_bias: 0.5,
          vocabulary_domain: "原著",
        },
        event_trace: {
          trigger: delta.event_trace?.trigger ?? "剧情推进",
          is_milestone: false,
        },
        seed: lockedSeed,
        script:
          scripts[idx] || {
            environment: "",
            action: "翻译丢失",
            expression: "",
            detail: "",
            monologue: "",
            dialogue: "",
          },
      };
    });

    if (!batch.characterTracks[charId])
      batch.characterTracks[charId] = { characterId: charId, name: charName, segments };
    else batch.characterTracks[charId].segments.push(...segments);
  }

  private splitIntoBatches(text: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
    return chunks;
  }
}
