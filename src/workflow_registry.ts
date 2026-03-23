/**
 * =====================================================================
 * ⚛️ ATOM INDEX: src/workflow_registry.ts
 * =====================================================================
 * 全厂总调度室：三层——原料从哪来 → 工单绑哪条传送带 → 车间怎么加工、成品往哪送。
 * 界面只负责把原料搬进来；本文件只管排产，不写具体 UI。
 * =====================================================================
 */

import type { ElevenDimensions } from "@/lib/core/types";
import { extractSeedLogic } from "@/lib/engines/seed_engine";
import { convert11DToLex } from "@/lib/engines/lex_adapter";
import { buildRenderPrompt } from "@/lib/engines/render_engine";

// ═══════════════════════════════════════════════════════════════════════════
// 第一层：原材料清单（数据哪里来）
// 每个按钮被按下时，必须从界面搬上流水线的字段，都写在这里。
// 按车间大门编号 1 → 8（对应八个页面）从上到下排。
// ═══════════════════════════════════════════════════════════════════════════

/** 还没单独开模的订单：先装在通用筐里，以后按按钮再换成专用清单 */
export interface PayloadDefault {
  [key: string]: any;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 1：创作台 — 造四宫格、拉历史、变体、采纳
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface PayloadCreateGenerateQuad {
  sourceText: string; // 来自：输入框里拼好的那段「要照着写」的文字（含挂载片段时一并算进来）
  manualOverrides?: Partial<ElevenDimensions>; // 来自：用户手拧的 11 维微调（有则覆盖自动嗅到的味道）
  narrativeContext: string; // 来自：当前这一轮剧情指令 / 导演口令
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 2：编辑区 — 拉种子、重写、模式变体、锐化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 将来：按按钮拆开专用原料单，再替换 PayloadDefault

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 3：探索区 — 选好片段去创作
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 4：剧本区 — 目录、人物、编译、变体、落盘……
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 5：整理区 — 人物卡、资产归档
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 6：风格工坊 — 人物 / 环境校准收工
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 7：实验室 — 对比打分类任务
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 视图 8：监管舱 — 种子图谱一览
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ═══════════════════════════════════════════════════════════════════════════
// 第二层：工单分拣处（这一车原料对应哪道加工命令）
// 把「按钮动作」和上面的原料筐绑死，叉车才知道往哪条传送带送。
// 同样严格按视图 1 → 8。
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowRequest =
  // ── 1. 创作台 ──────────────────────────────────────────
  | { action: "CREATE_GENERATE_QUAD"; payload: PayloadCreateGenerateQuad }
  | { action: "CREATE_LOAD_HISTORY"; payload: PayloadDefault }
  | { action: "CREATE_VARY_CARD"; payload: PayloadDefault }
  | { action: "CREATE_ADOPT_STREAM"; payload: PayloadDefault }

  // ── 2. 编辑区 ──────────────────────────────────────────
  | { action: "EDIT_FETCH_SEED_SNAPSHOT"; payload: PayloadDefault }
  | { action: "EDIT_REWRITE_FRAGMENT"; payload: PayloadDefault }
  | { action: "EDIT_REWRITE_BY_VARIANT"; payload: PayloadDefault }
  | { action: "EDIT_UPSCALE_FRAGMENT"; payload: PayloadDefault }

  // ── 3. 探索区 ──────────────────────────────────────────
  | { action: "EXPLORE_PREPARE_REWRITE_CONTEXT"; payload: PayloadDefault }

  // ── 4. 剧本区（所有 TRANSPILER_ 开头的活）──────────────
  | { action: "TRANSPILER_EXTRACT_CHAPTERS"; payload: PayloadDefault }
  | { action: "TRANSPILER_NEW_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_LIST_PROJECTS"; payload: PayloadDefault }
  | { action: "TRANSPILER_LOAD_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_SAVE_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_DELETE_PROJECT"; payload: PayloadDefault }
  | { action: "TRANSPILER_DISCOVER_CHARACTERS"; payload: PayloadDefault }
  | { action: "TRANSPILER_INIT_PERSONA"; payload: PayloadDefault }
  | { action: "TRANSPILER_SOLIDIFY_ALL"; payload: PayloadDefault }
  | { action: "TRANSPILER_COMPILE_CHAPTER"; payload: PayloadDefault }
  | { action: "TRANSPILER_COMPILE_FULL_BOOK"; payload: PayloadDefault }
  | { action: "TRANSPILER_GENERATE_VARIANTS"; payload: PayloadDefault }
  | { action: "TRANSPILER_ADOPT_VARIANT"; payload: PayloadDefault }
  | { action: "TRANSPILER_UPLOAD_MANUSCRIPT"; payload: PayloadDefault }

  // ── 5. 整理区 ──────────────────────────────────────────
  | { action: "ORGANIZE_COMMIT_CHARACTER_PROFILE"; payload: PayloadDefault }

  // ── 6. 风格工坊 ────────────────────────────────────────
  | { action: "STYLE_COMPLETE_CHARACTER_CALIBRATION"; payload: PayloadDefault }
  | { action: "STYLE_COMPLETE_ENVIRONMENT_CALIBRATION"; payload: PayloadDefault }

  // ── 7. 实验室 ──────────────────────────────────────────
  | { action: "TASK_LAB_RANK_SESSION"; payload: PayloadDefault }

  // ── 8. 监管舱 ──────────────────────────────────────────
  | { action: "ADMIN_SEED_VAULT_SNAPSHOT"; payload: PayloadDefault };

/** 所有工单命令的名字，方便打日志、对台账 */
export type WorkflowAction = WorkflowRequest["action"];

// ═══════════════════════════════════════════════════════════════════════════
// 第三层：自动化流水线（怎么加工、送到哪里）
// dispatchWorkflow = 总车间主任：接到工单就按 A → B → C 排工序，最后把成品交回前台展示。
// A：嗅出 11 维味道（Seed）  B：压成性格暗号（LEX）  C：交给大模型写成正文（Render）
// ═══════════════════════════════════════════════════════════════════════════

export async function dispatchWorkflow(request: WorkflowRequest): Promise<unknown> {
  switch (request.action) {
    // ━━━━━━━━━━━━━━━━━━━━━ 1. 创作台 ━━━━━━━━━━━━━━━━━━━━━
    case "CREATE_GENERATE_QUAD": {
      const data = request.payload;
      // 1. [加工 A]：从小模型 / 规则里抽出 11 维逻辑味道（Seed）
      const dimensions = await extractSeedLogic(data.sourceText, data.manualOverrides);
      // 2. [加工 B]：把味道压成一串 11D-LEX 性格暗号（Adapter）
      const lexCode = convert11DToLex(dimensions);
      // 3. [送到 C]：带着暗号和剧情指令，交给大模型车间去写最终文字（Render）
      const finalPrompt = buildRenderPrompt(lexCode, data.narrativeContext);
      // 4. [最后]：把配方和成品说明一并送回界面（下一步再由界面去要四宫格真文）
      console.log("🏭 [总车间] 创作台·四宫格 流水线就绪：", { lexCode, finalPrompt });
      return { dimensions, lexCode, finalPrompt };
    }
    case "CREATE_LOAD_HISTORY":
      // 原料已分拣：只消去库房把上一单四宫格端回来（待接：历史接口）
      return undefined;
    case "CREATE_VARY_CARD":
      // 原料已分拣：在父卡片味道上微调后再走 A→B→C（待接）
      return undefined;
    case "CREATE_ADOPT_STREAM":
      // 原料已分拣：把看中那一格定型、必要时落盘（待接）
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 2. 编辑区 ━━━━━━━━━━━━━━━━━━━━━
    case "EDIT_FETCH_SEED_SNAPSHOT":
      return undefined;
    case "EDIT_REWRITE_FRAGMENT":
      return undefined;
    case "EDIT_REWRITE_BY_VARIANT":
      return undefined;
    case "EDIT_UPSCALE_FRAGMENT":
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 3. 探索区 ━━━━━━━━━━━━━━━━━━━━━
    case "EXPLORE_PREPARE_REWRITE_CONTEXT":
      // 多半只换车间门牌，不经过大炉（待接）
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 4. 剧本区 ━━━━━━━━━━━━━━━━━━━━━
    case "TRANSPILER_EXTRACT_CHAPTERS":
      return undefined;
    case "TRANSPILER_NEW_PROJECT":
      return undefined;
    case "TRANSPILER_LIST_PROJECTS":
      return undefined;
    case "TRANSPILER_LOAD_PROJECT":
      return undefined;
    case "TRANSPILER_SAVE_PROJECT":
      return undefined;
    case "TRANSPILER_DELETE_PROJECT":
      return undefined;
    case "TRANSPILER_DISCOVER_CHARACTERS":
      return undefined;
    case "TRANSPILER_INIT_PERSONA":
      return undefined;
    case "TRANSPILER_SOLIDIFY_ALL":
      return undefined;
    case "TRANSPILER_COMPILE_CHAPTER":
      return undefined;
    case "TRANSPILER_COMPILE_FULL_BOOK":
      return undefined;
    case "TRANSPILER_GENERATE_VARIANTS":
      return undefined;
    case "TRANSPILER_ADOPT_VARIANT":
      return undefined;
    case "TRANSPILER_UPLOAD_MANUSCRIPT":
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 5. 整理区 ━━━━━━━━━━━━━━━━━━━━━
    case "ORGANIZE_COMMIT_CHARACTER_PROFILE":
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 6. 风格工坊 ━━━━━━━━━━━━━━━━━━━━━
    case "STYLE_COMPLETE_CHARACTER_CALIBRATION":
      return undefined;
    case "STYLE_COMPLETE_ENVIRONMENT_CALIBRATION":
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 7. 实验室 ━━━━━━━━━━━━━━━━━━━━━
    case "TASK_LAB_RANK_SESSION":
      return undefined;

    // ━━━━━━━━━━━━━━━━━━━━━ 8. 监管舱 ━━━━━━━━━━━━━━━━━━━━━
    case "ADMIN_SEED_VAULT_SNAPSHOT":
      return undefined;

    default: {
      const _漏单检查: never = request;
      return _漏单检查;
    }
  }
}
