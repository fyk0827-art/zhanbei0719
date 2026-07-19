# PRISM 02｜页面层规则（严格对齐方艺最终版）

> 用途：只负责页面结构、视觉规范、组件规则、响应式规则。  
> 不负责生成正文，不负责计算分数。  
> 最高参考文件：`outputs/PRISM人生剧本_新版_方艺_魅力领讲人.html`  
> 总原则：**页面怎么长，必须写死；内容换人，框架不换。**

---

## 一、页面层的职责

页面层负责：

- HTML 页面骨架
- Banner 结构
- Hero Strip 结构
- Score Strip 结构
- Sticky Nav 结构
- 19个 Section 容器
- 图表容器
- 卡片系统
- 表格系统
- 时间线
- 一页执行卡
- Footer
- 色系变量
- 手机端适配

页面层不负责：

- 重新写报告正文
- 重新判断案主类型
- 重新计算能力分数
- 重新计算幸运指数
- 改写职业、行业、伴侣、财富方向

---

## 二、固定页面骨架

页面必须固定为以下顺序：

```text
<!doctype html>
<html lang="zh-CN">
<head>
  meta / title / chart.js / style
</head>
<body data-planet="{theme_planet}">
  Banner
  Hero Strip
  Score Strip
  Sticky Nav
  Main
    Section 1 人物画像
    Section 2 12项核心能力评估
    Section 3 能力雷达图
    Section 4 经典人物案例
    Section 5 核心身份
    Section 6 职业方向
    Section 7 行业主角配角地图
    Section 8 幸运指数
    Section 9 财富方式
    Section 10 关系地图
    Section 11 运气体检
    Section 12 内耗指数
    Section 13 堵运的人
    Section 14 开运的人
    Section 15 风险红线
    Section 16 你可能不知道的5件事
    Section 17 90天行动建议
    Section 18 一页执行卡
    Section 19 最后一句话
  Footer
  chart script
</body>
</html>
```

禁止：

- 删除板块
- 合并板块
- 调整顺序
- 新增“3分钟总览”类新结构
- 把页面改成营销落地页
- 把页面改成纯文档页

---

## 三、动态字段协议

以下字段必须来自当前案主数据，禁止沿用样例：

### 1. 页面标题

```html
<title>{name} · PRISM 人生剧本</title>
```

### 2. body 类型

```html
<body data-planet="{theme_planet}">
```

`theme_planet` 必须由程序根据案主主类型决定。

### 3. Banner 字段

- 品牌字：固定 `PRISM 人生剧本`
- 姓名：`{name}`
- 身份标签：固定为 `{planet_person} · {identity_sub_label}`
- `{planet_person}` 只能是十大行星人之一：太阳人、月亮人、水星人、金星人、火星人、木星人、土星人、天王星人、海王星人、冥王人
- 禁止把星座、形容词、身份解释混入 `{planet_person}`，例如禁止：`木星射手型开路者`、`冥王系深潜者`、`太阳使命型领袖`
- 一句话人物说明：`{tagline}`
- 版本行：`V4.5 · 幸运指数{lucky_score}分（{lucky_level_desc}）`

### 4. Hero 字段

- 头像 / 首字母 / 图片路径
- 身份标签
- 2-3句人物定义

Hero 不显示姓名，避免和 Banner 重复。

### 5. Score Strip 字段

只显示 TOP4 能力：

- 分数
- 能力名
- 短注释

### 6. 图表字段

- 雷达图：TOP6 能力
- 柱状图：能力排名
- 表格：12项能力完整数据

所有图表数值必须来自程序，不允许前端写死样例值。

---

## 四、色系规则

色系由程序根据案主类型自动决定，页面不出现手动换色按钮。

### 1. 色系映射

- 太阳 / 火星 / 木星：红色系
- 金星 / 月亮：暖金系
- 水星 / 天王 / 海王：蓝色系
- 土星 / 冥王：黑灰系升级版

### 2. 红色系

用于太阳人、火星人、木星人。

气质：热烈、高级、行动、领导、扩张。

推荐变量方向：

- 主色：深红 / 酒红
- 深色：暗红 / 棕红
- 浅底：淡玫瑰白
- Banner：黑红渐变，不用廉价正红

### 3. 暖金系

用于金星人、月亮人。

气质：温暖、价值、关系、稳定、柔和但不甜腻。

推荐变量方向：

- 主色：玫金 / 暖金
- 深色：古铜金 / 深咖金
- 浅底：暖白 / 象牙白
- Banner：深棕金渐变，不要奶茶店风

### 4. 蓝色系

用于水星人、天王星人、海王星人。

气质：理性、灵感、未来、思维、科技感。

推荐变量方向：

- 主色：深蓝 / 孔雀蓝
- 深色：午夜蓝
- 浅底：冷白 / 雾蓝白
- Banner：深蓝到靛蓝渐变，不要儿童蓝

### 5. 黑灰系升级版

用于土星人、冥王人。

气质：神秘、结构、深度、权力、重建。

必须避免：

- 纯黑
- 死黑
- 脏灰
- 丧葬感
- 大面积压抑黑底

优先使用：

- 深紫黑
- 银灰
- 雾紫灰
- 暗曜石感
- 黑金 / 黑银轻微点缀

页面感觉要是“高级神秘”，不是“丧”。

---

## 五、Banner 规则

### 1. Banner 作用

Banner 不是正文解释区，是气场区。

它负责让用户第一眼知道：

- 这是谁的报告
- 这是什么类型的人
- 这份报告是什么级别
- 整体色系是什么

### 2. Banner 固定结构

```html
<header class="banner">
  背景纹理
  背景网格
  背景暗角
  装饰画 / SVG
  banner-inner
    banner-text
      brand
      h1 name
      sub identity
      tagline
      version
    banner-sigil / 装饰徽章
</header>
```

### 3. Banner 设计要求

- 深色高级背景
- 左文右图结构
- 必须有抽象装饰画 / SVG / 氛围图形
- 不用粗线条卡通
- 不用可爱风
- 不用营销海报式大口号
- 不写长段解释

### 3.1 Banner 背景图规则（V4.6新增）

**优先使用漫画风景画作为Banner背景，铺满整个Banner区域。**

#### 生成要求

使用 ImageGen 工具生成对应行星主题的漫画风格风景插画：

- **尺寸**：1536×1024（16:9横向构图，适合Banner）
- **风格**：高质量漫画/动漫风格插画，柔和水彩质感，梦幻氛围
- **色系**：必须匹配行星人主题色系
  - 太阳/火星/木星：暖红、橙红、金红渐变
  - 金星/月亮：暖金、古铜金、深棕金渐变
  - 水星/天王/海王：深蓝、靛蓝、孔雀蓝渐变
  - 土星/冥王：深紫黑、雾紫灰、暗曜石感

#### 画面元素建议

根据行星气质选择风景元素：

- **金星/月亮**：樱花飘落、起伏山丘、蜿蜒小路、渐变天空、柔和光线
- **太阳/火星/木星**：日落火烧云、开阔平原、远方城市轮廓、光芒四射
- **水星/天王/海王**：星空银河、未来感建筑、流动光带、科技感线条
- **土星/冥王**：深夜森林、月光穿透、神秘山谷、深邃洞穴

#### CSS实现

```css
.banner {
  position: relative;
  min-height: 430px;
  background: url('漫画风景图.png') center center / cover no-repeat;
  color: #fff;
}

.banner:after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.25));
  pointer-events: none;
}

.banner-inner {
  position: relative;
  z-index: 2;
  padding: 58px 0 80px;
}
```

**效果**：漫画风景铺满背景，半透明深色渐变遮罩保证文字清晰可读，沉浸式视觉体验。

### 4. Banner 字体层级

- 姓名最大
- 身份标签第二
- 人物说明第三
- 幸运指数版本行第四

### 5. Banner 限制

禁止出现：

- 手动换色按钮
- `theme-dot`
- `theme-bar`
- 样例案主姓名
- 样例幸运指数
- 样例身份标签

---

## 六、Hero Strip 规则

Hero Strip 浮在 Banner 下方。

固定结构：

```html
<div class="hero-strip">
  <div class="hero-card">
    <div class="hero-avatar">...</div>
    <div class="hero-info">
      <div class="role">...</div>
      <p class="desc">...</p>
    </div>
  </div>
</div>
```

要求：

- 卡片白底
- 圆形头像或首字母头像
- 头像居中
- 身份标签居中放大
- 描述文字 2-3 句
- 不写姓名
- 不写行动建议

---

## 七、Score Strip 规则

固定为 4 张卡，不多不少。

结构：

```html
<div class="score-strip">
  <div class="score-grid">
    <div class="score-card">
      <div class="num">89</div>
      <div class="label">洞察力</div>
      <div class="note">属于高穿透型能力</div>
    </div>
  </div>
</div>
```

桌面端：4列。  
手机端：2列。

禁止：

- 首屏放 6 张或 12 张卡
- 注释写成长句
- 使用非当前案主分数

---

## 八、Sticky Nav 规则

导航必须对应 19 个板块，顺序固定。

导航项：

1. 人物画像
2. 能力评估
3. 能力雷达
4. 经典案例
5. 核心身份
6. 职业方向
7. 主角配角
8. 幸运指数
9. 财富方式
10. 关系地图
11. 运气体检
12. 内耗指数
13. 堵运的人
14. 开运的人
15. 风险红线
16. 5件事
17. 90天行动
18. 执行卡
19. 最后的话

设计：

- sticky 顶部吸附
- 横向滚动
- 小型胶囊按钮
- 不换行挤压

---

## 九、Section 容器规则

每个 Section 固定结构：

```html
<section id="s1">
  <div class="wrap">
    <div class="sec-num">1</div>
    <h2>标题</h2>
    <p class="section-lead">lead</p>
    内容组件
  </div>
</section>
```

### 标题规则

- 使用衬线大标题
- 保持强标题感
- 不用过多副标题

### 容器宽度

- 正文：`wrap`，最大约 960px
- 宽图表 / 卡片组：可用 `wrap-wide`，最大约 1100px

### 背景节奏

- 奇偶 section 可轻微区分
- 不要每个板块都做成独立大卡片
- 页面节奏要像高级报告，而不是卡片堆砌

---

## 十、组件系统

### 1. 普通信息卡 `.card`

用于：职业方向、行业卡、关系卡、开运人、堵运人、方法卡。

要求：

- 白底
- 细边框
- 小圆角
- 轻阴影
- 不套卡片

### 2. 结论引用 `.quote-block`

用于：人物画像、核心身份。

要求：

- 左侧主题色竖线
- 浅色背景
- 文字更有判断感

### 3. 正向提示 `.callout.good`

用于：行动建议、优势提醒、路线建议。

### 4. 风险提示 `.callout.danger`

用于：财富红线、关系红线、事业红线。

### 5. 经典人物卡 `.figure-card`

固定 4 张。

必须包含：

- 编号
- 人物名
- 对应能力说明

### 6. 幸运卡 `.lucky-card`

必须包含：

- 大分数
- 分档标题
- 原因说明
- 幸运公式

### 7. 时间线 `.timeline`

用于 90 天行动建议。

固定三段：

- 第1-30天
- 第31-60天
- 第61-90天

### 8. 执行表 `.exec-table`

固定四列：

- 维度
- 行动项
- 时间
- 状态

状态列用空 checkbox 视觉。

---

## 十一、百分位视觉规范（V4.6新增）

### 1. 百分位颜色分级

百分位必须按稀缺性分级显示，不同区间使用不同视觉强度：

| 百分位区间 | 视觉层级 | 字体颜色 | 字重 | 用途说明 |
|-----------|---------|---------|------|---------|
| 前1%-5% | 极稀缺 | 主题色（加深20%） | 700 bold | 王牌能力，最高视觉优先级 |
| 前6%-10% | 顶尖稀缺 | 主题色 | 600 semibold | 核心优势，次高优先级 |
| 前11%-28% | 优秀 | 主题色（减淡15%） | 500 medium | 明显优势，中等优先级 |
| 前29%-55% | 中等 | #666 灰色 | 400 regular | 可用但非优势，弱化显示 |
| 前56%及以后 | 待开发/弱势 | #999 浅灰 | 400 regular | 明确短板，最弱化显示 |

### 2. 百分位显示位置

百分位在能力卡片中的位置必须固定：

```html
<div class="ability-card">
  <div class="ability-header">
    <span class="ability-name">审美力</span>
    <span class="ability-score">91</span>
  </div>
  <div class="ability-percentile" data-percentile="4">
    前4%
  </div>
  <div class="ability-desc">属于高价值翻译能力</div>
</div>
```

### 3. 百分位样式规则

```css
.ability-percentile {
  font-size: 0.85rem;
  margin-top: 4px;
  font-weight: 500;
}

/* 前5%：极稀缺，主题色加深 */
.ability-percentile[data-percentile="1"],
.ability-percentile[data-percentile="2"],
.ability-percentile[data-percentile="3"],
.ability-percentile[data-percentile="4"],
.ability-percentile[data-percentile="5"] {
  color: var(--theme-primary-dark);
  font-weight: 700;
}

/* 前6%-10%：顶尖稀缺，主题色 */
.ability-percentile[data-percentile^="6"],
.ability-percentile[data-percentile^="7"],
.ability-percentile[data-percentile^="8"],
.ability-percentile[data-percentile^="9"],
.ability-percentile[data-percentile="10"] {
  color: var(--theme-primary);
  font-weight: 600;
}

/* 前11%-28%：优秀，主题色减淡 */
.ability-percentile[data-percentile^="1"]:not([data-percentile="10"]),
.ability-percentile[data-percentile^="2"] {
  color: var(--theme-primary-light);
  font-weight: 500;
}

/* 前29%-55%：中等，灰色 */
.ability-percentile[data-percentile^="3"],
.ability-percentile[data-percentile^="4"],
.ability-percentile[data-percentile^="5"] {
  color: #666;
  font-weight: 400;
}

/* 前56%及以后：弱势，浅灰 */
.ability-percentile[data-percentile^="6"],
.ability-percentile[data-percentile^="7"],
.ability-percentile[data-percentile^="8"] {
  color: #999;
  font-weight: 400;
}
```

### 4. 主题色变量映射

不同行星主题的百分位颜色必须使用对应主题色：

```css
/* 红色系（太阳/火星/木星） */
body[data-planet="sun"] .ability-percentile,
body[data-planet="mars"] .ability-percentile,
body[data-planet="jupiter"] .ability-percentile {
  --theme-primary: #C84B31;
  --theme-primary-dark: #A63A24;
  --theme-primary-light: #D67162;
}

/* 暖金系（金星/月亮） */
body[data-planet="venus"] .ability-percentile,
body[data-planet="moon"] .ability-percentile {
  --theme-primary: #D4A574;
  --theme-primary-dark: #B8884E;
  --theme-primary-light: #E4C19B;
}

/* 蓝色系（水星/天王/海王） */
body[data-planet="mercury"] .ability-percentile,
body[data-planet="uranus"] .ability-percentile,
body[data-planet="neptune"] .ability-percentile {
  --theme-primary: #3A6EA5;
  --theme-primary-dark: #2B5280;
  --theme-primary-light: #5A8BC4;
}

/* 黑灰系（土星/冥王） */
body[data-planet="saturn"] .ability-percentile,
body[data-planet="pluto"] .ability-percentile {
  --theme-primary: #5E4F6B;
  --theme-primary-dark: #3D2F4A;
  --theme-primary-light: #7D6A8C;
}
```

---

## 十二、图表规则（V4.6完整版）

### 1. Section 2：横向柱状对比图

**容器ID**：`horizontalBar`

**用途**：显示TOP6能力的分数对比，横向柱状图

**HTML结构**：
```html
<section id="s2">
  <div class="wrap">
    <h2>12项核心能力评估</h2>
    <div class="chart-container">
      <canvas id="horizontalBar" width="800" height="400"></canvas>
    </div>
    <!-- 12项能力表格 -->
  </div>
</section>
```

**Chart.js配置**：
- 类型：`horizontalBar`
- 数据源：`ability_scores` 中TOP6能力的 `score` 字段
- X轴范围：0-100
- 柱状颜色：使用主题色（`--theme-primary`）
- 响应式：桌面端宽800px，手机端自适应

**配色规则**：
- 红色系：`#C84B31`（深红）
- 暖金系：`#D4A574`（古铜金）
- 蓝色系：`#3A6EA5`（孔雀蓝）
- 黑灰系：`#5E4F6B`（深紫灰）

---

### 2. Section 5：职业雷达图

**容器ID**：`careerRadar`

**用途**：显示7维职业匹配能力雷达图

**HTML结构**：
```html
<section id="s5">
  <div class="wrap">
    <h2>核心身份</h2>
    <div class="chart-container">
      <canvas id="careerRadar" width="600" height="600"></canvas>
    </div>
    <!-- 职业身份解读 -->
  </div>
</section>
```

**Chart.js配置**：
- 类型：`radar`
- 维度（7维）：领导力、共情力、表达力、审美力、行动力、职业匹配度、行业适配度
- 数据源：`ability_scores` 中对应能力的 `score` 字段，加上职业匹配度和行业适配度
- 范围：0-100
- 填充颜色：主题色半透明（`rgba(..., 0.2)`）
- 描边颜色：主题色（`--theme-primary`）
- 响应式：桌面端600×600，手机端缩小至400×400

---

### 3. Section 8：财富来源占比饼图

**容器ID**：`wealthPie`

**用途**：显示财富来源的5种方式占比

**HTML结构**：
```html
<section id="s8">
  <div class="wrap">
    <h2>财富方式</h2>
    <div class="chart-container">
      <canvas id="wealthPie" width="500" height="500"></canvas>
    </div>
    <!-- 财富方式解读 -->
  </div>
</section>
```

**Chart.js配置**：
- 类型：`pie`
- 数据源：财富来源占比（示例：定价30%、咨询25%、课程20%、顾问15%、内容产品10%）
- 配色方案：使用主题色渐变系列
  - 红色系：`['#C84B31', '#D67162', '#E89A8D', '#F4BDB2', '#FFE0D9']`
  - 暖金系：`['#D4A574', '#E4C19B', '#F0D8B8', '#F9ECDA', '#FFF9F0']`
  - 蓝色系：`['#3A6EA5', '#5A8BC4', '#7AA8D8', '#9AC5E8', '#BAE0F5']`
  - 黑灰系：`['#5E4F6B', '#7D6A8C', '#9C87AB', '#BBA5C8', '#DAC4E3']`
- 响应式：桌面端500×500，手机端缩小至350×350

---

### 4. Section 9：漏斗流程图

**容器ID**：`luckyFunnel`

**用途**：显示从入口能力到最终转化的漏斗效率

**HTML结构**：
```html
<section id="s9">
  <div class="wrap">
    <h2>幸运指数</h2>
    <div class="chart-container">
      <canvas id="luckyFunnel" width="700" height="400"></canvas>
    </div>
    <!-- 幸运指数解读 -->
  </div>
</section>
```

**Chart.js配置**：
- 类型：`funnel`（如Chart.js不支持，使用自定义SVG或horizontalBar模拟）
- 数据源：4层漏斗
  - 第1层：入口能力（如"洞察力85分"）
  - 第2层：付费化能力（如"洞察付费化+5分 → 90分"）
  - 第3层：溢价能力（如"审美力溢价-6分 → 84分"）
  - 第4层：最终效率（如"整体漏斗效率84分"）
- 配色规则：从深到浅的主题色渐变
- 响应式：桌面端700×400，手机端缩小至全宽×300

---

### 5. Section 3：能力雷达图（原有）

**容器ID**：`radarChart`

**用途**：显示TOP6能力雷达图

**Chart.js配置**：
- 类型：`radar`
- 数据源：`ability_scores` 中TOP6能力
- 范围：0-100
- 配色：主题色填充 + 主题色描边

---

### 6. 表格系统

12项能力表使用 `data-table`。

要求：

- TOP3 行高亮（使用主题色浅色背景）
- 必须包含：能力名、分数、百分位、等级
- 手机端可横向滚动或重排

---

### 7. 图表通用规则

**所有图表必须遵守：**

1. **数据来源**：所有图表数值必须来自程序计算结果，禁止手写样例分数
2. **配色规则**：图表颜色必须匹配当前案主的主题色系（通过 `body[data-planet]` 判断）
3. **响应式**：桌面端和手机端必须分别设置合适的尺寸
4. **容器结构**：
```html
<div class="chart-container">
  <canvas id="chartId" width="W" height="H"></canvas>
</div>
```
5. **手机端适配**：
   - 图表宽度缩小至容器100%
   - 高度按比例缩小
   - 字号适当减小但保持可读性

---

## 十二、手机端规则

手机端不能只是桌面页缩小。

### 1. Banner

- 高度下降
- 可隐藏右侧装饰徽章
- 姓名、身份、说明、幸运指数必须可读
- 不允许文字溢出

### 2. Hero

- 卡片缩小
- 头像居中
- 身份标签字号下降但仍突出
- 描述文字不超过 3 句

### 3. Score Strip

- 2列布局
- 每张卡高度固定
- 数字清晰可读

### 4. 卡片网格

- `col2` / `col3` 手机端统一单列
- 卡片间距缩小
- 不允许左右挤压

### 5. 表格

`data-table` 和 `exec-table` 手机端必须：

- 允许横向滚动，或
- 转成移动端列表

### 6. 时间线

- 保留时间线结构
- 节点不要太大
- 文字宽度优先

---

## 十三、页面禁止项

禁止：

- 白底大 Banner
- 营销落地页风
- 可爱幼稚卡通风
- 粗糙黑底
- 纯黑丧感
- 手动换色按钮
- 样例案主字段残留
- 桌面端硬缩小当手机端
- 过度装饰
- 卡片套卡片
- 图表遮挡文字
- 文字溢出按钮或卡片

---

## 十四、页面生成顺序

每次生成页面必须按以下顺序：

1. 读取当前案主字段
2. 确定 `theme_planet`
3. 注入 CSS 变量
4. 注入 Banner 字段
5. 注入 Hero 字段
6. 注入 Score Strip TOP4
7. 注入 19 个 Section 内容
8. 注入图表数据
9. 检查手机端样式
10. 检查是否残留旧案主姓名 / 幸运指数 / 色系按钮

---

## 十五、最终标准

用户输入另一个案主时，页面应该只发生这些变化：

- 姓名变
- 身份标签变
- 色系变
- 幸运指数变
- 能力分数变
- 图表变
- 正文内容变
- 职业、行业、伴侣、财富、风险结论变

但这些不能变：

- 页面骨架
- 板块数量
- 板块顺序
- 首屏结构
- 卡片系统
- 图表位置
- 手机端规则
- 页面气质

一句话：

**内容换人，框架不换，设计不跑偏。**
