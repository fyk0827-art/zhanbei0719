# DEVLOG

## 2026-07-18 [AI 生成加载页英文化]
- `PrismAnalysisAnimation.tsx`：六步加载文案 + 字符计数走 i18n（海外默认英文）

### 为什么
AI 报告生成动画仍硬编码中文（「读取行星位置与宫位配置…」等）。

---

## 2026-07-18 [付费解锁墙英文化]
- `reportTypes.ts`：产品名 / 付费墙标题与权益列表改为英文
- `ReportPaywall.tsx`：描述、页脚、微信提示走 i18n
- `paymentApi.ts`：`getPaymentLabels` 按钮文案改为英文（Simulate / WeChat / Alipay）
- 解锁成功条（Blueprint / Marriage / Career）同步英文化

### 为什么
报告页付费卡片仍硬编码中文（「解锁完整行动蓝图」「模拟支付解锁」等），与海外英文 UI 不一致。

---

## 2026-07-18 [出生日期选择器英文化]
- `BirthDatePicker.tsx`：标题 / 取消 / 确定 / 滚轮年日月后缀改为英文（走 i18n）
- 展示格式：`Jan 1, 1990`；滚轮月份用 `Jan`–`Dec`
- `i18n`：新增 `confirm`（en/zh）

### 为什么
海外版 UI 已锁英文，日期抽屉仍硬编码中文（「你降临人间的日期」「年/月/日」「取消/确定」）。

---

## 2026-07-17 [答题区底部诚实作答提示]
- `feelingScaleQuestions.ts`：新增 `honestyHint`（中/英）
- `QuizFlow.tsx`：在「更像左/右」标签下方展示提示
- `prism.css`：`.prism-scale-honesty` 居中弱对比样式，对齐上方 prompt

### 为什么
用户要求在答题选项下方补充诚实作答引导文案。

---

## 2026-07-17 [打通偏向量表全链路]
- 管理端：只录 A/B 两端 + 题干 + Chapter；列表展示 poles
- 后端：校验必须 A/B；答案存 1–6；题目按 id 顺序拉取；默认 20 题
- 种子：`FeelingScaleSeedData` + 一次性 `feeling_scale_v1` 迁移（清空旧 ABCD 样例，写入每年龄组 20 题）
- 前端 QuizFlow：从 `/questions` API 拉题并提交 scale 分值

重启后端后种子会自动跑一次。若需重跑：删 `app_settings` 里 `feeling_scale_v1` 再启动。

---

## 2026-07-17 [十星人介绍卡片改版]
- 按参考图改为：头像 + 英文名 + Personality / Traits & Value / Strengths
- 文案来自《人物介绍.txt》，写成更完整的英文
- 十人统一竖排卡片（含太阳人），去掉旧短描述与太阳 Hero

---

## 2026-07-17 [锁定英文 UI]
- 移除全局 / Generator / Header 语言切换按钮
- i18n 固定 `lng: "en"`，关闭浏览器语言探测
- Back 按钮上移到左上角（原语言按钮位置）

---

## 2026-07-17 [感觉量表题目英文化]

### 改动内容
- `feelingScaleQuestions.ts`：20 题与章节/提示文案增加 `zh` / `en`
- `QuizFlow.tsx`：随 `i18n.language` 切换题目与完成页文案

### 为什么
海外版本需要英文答题；切语言后题目、两端选项、完成页同步切换。

---

## 2026-07-17 [答题方式改六级量表]

### 改动内容
- 新增 `frontend/src/data/feelingScaleQuestions.ts`：20 题前置感觉量表（A/B 两端）
- 重写 `frontend/src/components/QuizFlow.tsx`：从竖排多选改为六级圆点程度选择
- 扩展 `frontend/src/styles/prism.css`：量表 UI（月紫/暖金两侧、大小对称圆点）

### 为什么
产品交互从「选一个选项」改为「一大标题 + 两小标题 + 选更像哪一边的程度」。参考 `prism-landing-v3-20questions` HTML 与题库文档。

### 交互要点
- 点选 1–6 任一圆点后自动下一题；1–3 偏 A，4–6 偏 B
- 答案写入 `sessionStorage`（`qaQuizReport`）供后续报告使用
