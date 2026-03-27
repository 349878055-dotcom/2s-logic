/**
 * 工作流总入口：按业务域分拆在 `./modules/*`，综合层在 `./modules/hub/*`。
 *
 * 【域一览】
 *   · `modules/explore.ts`      — 探索区
 *   · `modules/create.ts`     — 创作区
 *   · `modules/edit.ts`       — 编辑区
 *   · `modules/organize.ts`   — 整理区
 *   · `modules/transpiler.ts` — 剧本区 / ScriptWorkbench
 *   · `modules/style.ts`      — 风格工坊
 *   · `modules/task.ts`       — 任务区
 *   · `modules/hub/types.ts`  — 跨页共享类型
 *   · `modules/hub/routes.ts` — 路由文档汇总 `WORKFLOW_ROUTE_DOC_ALL`
 *   · `modules/hub/dispatch.ts` — `dispatchWorkflow` 旧 action 调度
 *
 * 全站统一入口：`import … from "@/workflows/registry"`（不再保留根目录 `workflow_registry.ts`）。
 *
 * 【三位一体 · 剧本区按钮】原子 `@/lib/atoms/transpiler_atoms` → 本包 `workflow_*` → `presentation/scriptworkbench_ui_specs.ts`。
 *
 * ── 议题保留：剧本区「保存」与主流自动保存（未实现，回头再做）────────────────
 * 现状：`workflow_Transpiler_SaveProject` 仅由视图顶栏「叙事沉淀」手动触发；部分操作会局部写库。
 * 风险：切离「剧本区」卸载组件时，未手动保存的整包状态会丢（见 TranspilerView + page 条件渲染）。
 * 后续可做（调度放在视图或 `useProjectAutosave` Hook，仍调用同一 `workflow_Transpiler_SaveProject`）：
 *   · 停手防抖（如 1.5～2s 无输入后 PATCH 整包）
 *   · 定时兜底（如每 3 分钟有改动则存）
 *   · 离页 / 切导航前提示或自动存一次
 *   · 顶栏极小字状态：已保存 / 有未保存更改 / 保存中 / 失败
 * 实现时不必新增「第二条保存工作流」；只增加何时触发，不重写 PATCH 步骤语义。
 * ─────────────────────────────────────────────────────────────────────────
 */

export * from "@/workflows/presentation/scriptworkbench";

export * from "./modules/hub/types";
export * from "./modules/explore";
export * from "./modules/create";
export * from "./modules/edit";
export * from "./modules/organize";
export * from "./modules/transpiler";
export * from "./modules/style";
export * from "./modules/task";
export * from "./modules/hub/routes";
export * from "./modules/hub/dispatch";
