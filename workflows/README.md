# 2S-LOGIC | workflows 分拣调度区索引 (二级)

> **🎯 区域职责：** 本大区是「**工单编排**」层：视图发来原材料，这里定义**先调谁、再解码谁、再 PATCH 谁**。**不写**具体算法实现（交给 `lib/engines`）；**不写**页面 JSX（交给 `views/`）；**不写**纯 UI 类名长表（交给 `presentation/`）。

## 1. 子车间导航 (Folders)

- **[/modules](./modules/) - 按业务域拆分的工作流实现**
  - `explore.ts` / `create.ts` / `edit.ts` / `organize.ts` / `transpiler.ts` / `style.ts` / `task.ts` 等。
  - `hub/types.ts` — 跨页共享 payload / 结果类型。  
  - `hub/dispatch.ts` — `dispatchWorkflow` 字符串调度（兼容旧入口）。  
  - `hub/routes.ts` — 路由文档汇总。

- **[/presentation](./presentation/) - 表现层规格**
  - 文案、Tailwind 类名、Lucide `iconKey`、阶段条等与 UI 强绑定但**不**属于 React 组件的常量（如 `SCRIPTWORKBENCH_UI_*`）。

- **`registry.ts`（本层根文件）**
  - **全站统一出口**：`import { workflow_* } from "@/workflows/registry"`。  
  - 聚合导出各 `modules/*` 与 presentation 再导出。

## 2. 与 lib 的分界

- **工作流** 可调用：`lib/atoms/*`、`lib/toolkit/*` 发请求、读 codec。  
- **工作流** 不应：在文件内实现 500 行章目正则；应 `import` `engine_stable` / `chapter_index_engine` 等。

## 3. ⚠️ 绝对隔离禁令 (CRITICAL)

- **禁止**在 `workflows/` 内 `import` 任意 `views/*` 或 `app/*`（避免环依赖）。  
- **剧本区三位一体：** 原子 HTTP → `workflow_*`（本区）→ `SCRIPTWORKBENCH_UI_*`（presentation）；视图只消费三者，不在视图里复制编排。  
- 新增按钮动线时：优先在对应 `modules/*.ts` 增加函数，再在 `registry` 导出，**不要**在视图里散落未命名的异步流程。
