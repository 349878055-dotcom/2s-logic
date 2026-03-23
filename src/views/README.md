# 2S-LOGIC | views 业务组装区索引 (二级)

> **🎯 区域职责：** 本大区是项目的「总装流水线」。负责把 `components/` 里的零碎 UI 部件拿过来，结合 `lib/core/store` 里的数据，拼装成一个个完整的业务大屏（如：创作视图、演化视图）。

## 1. 核心总装线 (View Files)
本目录下的文件都是“页面级”的超级组件，进入修改前请明确你要动的是哪条产线：

- **`CreateView.tsx` / `EditView.tsx`**: 负责角色/剧本的创建与编辑组装。
- **`StyleTunerView.tsx`**: 风格微调器总成。
- **`TranspilerView.tsx`**: 剧本与 11 维度转换的超级控制台。
- **`TaskView` / `OrganizeView` / `ExploreView`**: 其他具体业务流总装。

## 2. ⚠️ 绝对装配禁令 (CRITICAL)
- **禁止造轮子：** 这里只准“拼装”，不准“生产”。如果你需要一个新的滑块或按钮，必须去 `src/components/` 里面写，然后再 import 到这里来用。
- **禁止写底层逻辑：** 虽然这里可以触发用户的点击事件（如 `onClick`），但这里**绝对不许写 11 维度的具体运算过程（如 D.O.E.S. 权重增减）**。所有的事件必须 `dispatch` 给 `src/lib/` 里的引擎去算。
- **状态流转：** 本区只准读取和调用 `store.ts` 里的状态。

## 3. 修改口诀
- UI 错位了？在这里找布局层代码，或者去 `components/` 找具体零件。
- 数据算错了？立刻退出本区，去 `src/lib/engines/`！
