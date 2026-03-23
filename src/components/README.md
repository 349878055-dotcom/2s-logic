# 2S-LOGIC | components UI 零件区索引 (二级)

> **🎯 区域职责：** 本大区是纯粹的「视觉与交互零件仓库」。它只负责“长什么样”和“捕获用户点击”，**绝对禁止生产任何业务核心逻辑**。

## 1. 子车间导航 (Folders)
如果你要修改或新增特定类型的组件，请进入以下对应文件夹（进入后如需深究，请看文件头部的 ATOM INDEX）：

- **[/calibrators] - 校准器组件**
  - 范围：用于调节数值的专门滑块/面板（如 `StyleCalibrator`, `EnvironmentCalibrator`）。
- **[/layout] - 布局组件**
  - 范围：页面的框架结构（如 `Sidebar` 侧边栏）。
- **[/panels] - 信息面板组件**
  - 范围：展示特定聚合信息的区块（如 `ProfileCard`, `ThemePanel`, `NotifPanel`, `HelpDrawer`）。

## 2. 驻留散落零件 (Local Files)
本目录下散落的 `.tsx` 文件是基础的基础（如 `DoesRadarChart.tsx`, `DoesSlider.tsx`, `ConstraintBadge.tsx`）。
- **定位：** 它们是高度复用的原子组件。
- **纪律：** 修改这些文件时，必须确保向后兼容，因为它们可能被全局的 `views/` 无数次调用。

## 3. ⚠️ 绝对隔离禁令 (CRITICAL)
- **数据单向流：** 本区内的所有组件，只能通过 `props` 接收数据，或者从 `src/lib/core/store.ts` 读取状态。
- **严禁写算法：** 绝对不允许在任何一个组件内部编写 11 维度 D.O.E.S. 的权重计算公式（如 $C_{n+1}$）。计算必须交给 `src/lib/engines/`，UI 只能负责展示结果或触发请求（API/Store Action）！
- **不准拼装页面：** 这里只造“汽车零件（轮胎、方向盘）”，如果你要把它们拼成一辆完整的车（完整页面），请去 `src/views/` 区。
