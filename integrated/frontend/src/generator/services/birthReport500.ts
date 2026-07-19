/**
 * 出生图500字极简报告 · 确定性规则引擎
 * 移植自 aaaa/birth_report_input.py，零 AI 依赖
 */
import type { NatalChart } from "./astrologyEngine";
import {
  getLocalePack,
  planetLabel,
  resolveReportLocale,
  signLabel,
} from "./birthReport500Locale";

const RULER: Record<string, string> = {
  白羊: "火星", 金牛: "金星", 双子: "水星", 巨蟹: "月亮",
  狮子: "太阳", 处女: "水星", 天秤: "金星", 天蝎: "火星",
  射手: "木星", 摩羯: "土星", 水瓶: "土星", 双鱼: "木星",
};

const DIGNITY: Record<string, { 入庙: string[]; 入旺: string[]; 失势: string[]; 落陷: string[] }> = {
  太阳: { 入庙: ["狮子"], 入旺: ["白羊"], 失势: ["水瓶"], 落陷: ["天秤"] },
  月亮: { 入庙: ["巨蟹"], 入旺: ["金牛"], 失势: ["摩羯"], 落陷: ["天蝎"] },
  水星: { 入庙: ["双子", "处女"], 入旺: ["处女"], 失势: ["射手", "双鱼"], 落陷: ["双鱼"] },
  金星: { 入庙: ["金牛", "天秤"], 入旺: ["双鱼"], 失势: ["天蝎", "白羊"], 落陷: ["处女"] },
  火星: { 入庙: ["白羊", "天蝎"], 入旺: ["摩羯"], 失势: ["天秤", "金牛"], 落陷: ["巨蟹"] },
  木星: { 入庙: ["射手", "双鱼"], 入旺: ["巨蟹"], 失势: ["双子", "处女"], 落陷: ["摩羯"] },
  土星: { 入庙: ["摩羯", "水瓶"], 入旺: ["天秤"], 失势: ["巨蟹", "狮子"], 落陷: ["白羊"] },
};

const PLANET_BASE: Record<string, number> = {
  太阳: 65, 月亮: 61, 金星: 57, 水星: 53,
  木星: 51, 土星: 50, 火星: 47, 天王星: 43, 海王星: 42, 冥王星: 41,
};

const PLANET_ESSENCE: Record<string, string> = {
  太阳: "自我实现与领导力", 月亮: "情绪感知与滋养", 水星: "思维与沟通表达",
  金星: "价值判断与关系联结", 火星: "行动突破与执行力", 木星: "远见扩张与机遇",
  土星: "秩序耐力与积累", 天王星: "创新变革与突破", 海王星: "共情想象与灵性",
  冥王星: "深度转化与洞察",
};

const PLANET_PERSON: Record<string, string> = {
  太阳: "以自我实现为核心，天生要活出影响力",
  月亮: "以情感感知为导航，能捕捉未说出口的需求",
  水星: "以思维表达为引擎，能把复杂信息变成清晰方案",
  金星: "以价值和关系为判断标准，能在混乱中找到值得投入的东西",
  火星: "以行动力为先锋，能在别人犹豫时快速出手",
  木星: "以远见扩张为本能，总能看到更大的机会",
  土星: "以秩序耐力为根基，能把不确定做成确定成果",
  天王星: "以创新突破为使命，能在旧规则中找到新解法",
  海王星: "以共情想象力为天赋，能感知隐性层面",
  冥王星: "以深度转化为天赋，能在危机里找到重生力量",
};

const COMBO_NAMES: Record<string, string> = {
  "太阳,月亮": "内心指挥官", "太阳,水星": "思想战略家", "太阳,金星": "价值锻造师", "太阳,火星": "行动指挥官",
  "太阳,木星": "远见领航员", "太阳,土星": "基业建筑师", "太阳,天王星": "未来架构师", "太阳,海王星": "理想布道师",
  "太阳,冥王星": "权力锻造师", "月亮,水星": "情绪翻译官", "月亮,金星": "关系调音师", "月亮,火星": "情感急救员",
  "月亮,木星": "心灵导师", "月亮,土星": "安全建筑师", "月亮,天王星": "情绪破壁人", "月亮,海王星": "灵魂疗愈师",
  "月亮,冥王星": "深渊勘探员", "水星,金星": "创意策展人", "水星,火星": "突击策划师", "水星,木星": "全局战略师",
  "水星,土星": "体系架构师", "水星,天王星": "认知破壁人", "水星,海王星": "灵感翻译官", "水星,冥王星": "真相调查官",
  "金星,火星": "吸引力工程师", "金星,木星": "财富策展人", "金星,土星": "经典铸造师", "金星,天王星": "审美革命者",
  "金星,海王星": "梦境设计师", "金星,冥王星": "关系炼金师", "火星,木星": "远征先锋官", "火星,土星": "铁血建造师",
  "火星,天王星": "破局突击手", "火星,海王星": "信仰战士", "火星,冥王星": "重生锻造师", "木星,土星": "格局建筑师",
  "木星,天王星": "未来预言家", "木星,海王星": "信念领航员", "木星,冥王星": "资源炼金师", "土星,天王星": "秩序革命者",
  "土星,海王星": "理想建筑师", "土星,冥王星": "权力建筑师", "天王星,海王星": "未来造梦师", "天王星,冥王星": "系统重构师",
  "海王星,冥王星": "灵魂炼金师",
};

const HOUSE_WEIGHT: Record<number, number> = {
  1: 10, 10: 9, 7: 9, 4: 9, 2: 4, 5: 4, 8: 4, 11: 4, 3: -2, 6: -2, 9: -2, 12: -2,
};

const ALL_SIGNS = ["白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼"];

const FLY_SCENE: Record<number, string> = {
  1: "自我展现", 2: "资源变现", 3: "学习沟通", 4: "根基家庭",
  5: "创作表达", 6: "日常工作", 7: "一对一合作", 8: "深度资源",
  9: "远见探索", 10: "事业名声", 11: "社群圈子", 12: "灵性超越",
};

const FIRDARIA_DAY: [number, number, string][] = [
  [0, 10, "太阳"], [10, 19, "金星"], [19, 31, "水星"], [31, 40, "月亮"],
  [40, 51, "土星"], [51, 63, "木星"], [63, 70, "火星"],
];

const FIRDARIA_NIGHT: [number, number, string][] = [
  [0, 9, "月亮"], [9, 20, "土星"], [20, 31, "木星"], [31, 40, "火星"],
  [40, 51, "太阳"], [51, 62, "金星"], [62, 75, "水星"],
];

const FIRDARIA_PARTNER_DESC: Record<string, string> = {
  太阳: "鼓励你放大格局、敢想敢做的人",
  月亮: "帮你落地执行、把感受变成行动的人",
  水星: "帮你从细节跳到全局的人",
  金星: "推你从权衡走向行动的人",
  火星: "帮你从冲撞转向合作的人",
  木星: "帮你从扩张回到聚焦的人",
  土星: "帮你在压力里看到可能性的人",
};

const DIG_NOTES: Record<string, string> = {
  入庙: "，入庙状态让你的天赋天然就是你的武器",
  入旺: "，入旺状态让你的能力更容易被看见",
  失势: "，你表达这股能量的方式与众不同",
  落陷: "，这是你一生要驯服的能量，但驯服后力量极大",
};

function shortSign(sign: string): string {
  return sign.replace(/座$/, "");
}

function getDignity(planet: string, sign: string): [string, number] {
  const d = DIGNITY[planet];
  if (!d) return ["中性", 0];
  for (const [label, score] of [["入庙", 7], ["入旺", 6], ["失势", -5], ["落陷", -4]] as const) {
    if (d[label].includes(sign)) return [label, score];
  }
  return ["中性", 0];
}

function computeHouseCusps(ascSign: string, chart: NatalChart): Record<number, string> {
  const cusps: Record<number, string> = {};
  for (const h of chart.houses) {
    cusps[h.house] = shortSign(h.sign);
  }
  const ascShort = shortSign(ascSign);
  for (let h = 1; h <= 12; h++) {
    if (!cusps[h]) {
      const idx = (ALL_SIGNS.indexOf(ascShort) + h - 1) % 12;
      cusps[h] = ALL_SIGNS[idx];
    }
  }
  return cusps;
}

function computeFly(cusps: Record<number, string>, planetHouses: Record<string, number>): Record<number, number> {
  const fly: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) {
    const ruler = RULER[cusps[h]];
    fly[h] = planetHouses[ruler] ?? 1;
  }
  return fly;
}

function scorePlanets(
  planets: Record<string, { sign: string; house: number }>,
  planetHouses: Record<string, number>,
  ascSign: string,
  isDay: boolean
): Record<string, number> {
  const scores: Record<string, number> = {};
  const dayTeam = ["太阳", "木星", "土星"];
  const nightTeam = ["月亮", "金星", "火星"];
  const ruler1 = RULER[ascSign] ?? "太阳";

  for (const [planet, info] of Object.entries(planets)) {
    let score = PLANET_BASE[planet] ?? 40;
    const house = planetHouses[planet] ?? info.house;

    if (isDay) {
      if (dayTeam.includes(planet)) score += 5;
      else if (nightTeam.includes(planet)) score -= 3;
    } else {
      if (nightTeam.includes(planet)) score += 5;
      else if (dayTeam.includes(planet)) score -= 3;
    }

    const [, ds] = getDignity(planet, info.sign);
    score += ds;
    score += HOUSE_WEIGHT[house] ?? 0;
    if (planet === "太阳" || planet === "月亮") score += 3;
    if (planet === ruler1) score += 15;

    scores[planet] = score;
  }
  return scores;
}

function getFirdaria(age: number, isDay: boolean): [[string, number, number], [number, number, string][]] {
  const seq = isDay ? FIRDARIA_DAY : FIRDARIA_NIGHT;
  for (let i = 0; i < seq.length; i++) {
    const [start, end, ruler] = seq[i];
    if (age >= start && age < end) {
      return [[ruler, start, end], seq.slice(i + 1, i + 3)];
    }
  }
  const last = seq[seq.length - 1];
  return [[last[2], last[0], last[1]], []];
}

function calcAge(bd: { year: number; month: number; day: number }): number {
  const now = new Date();
  let age = now.getFullYear() - bd.year;
  if (now.getMonth() + 1 < bd.month || (now.getMonth() + 1 === bd.month && now.getDate() < bd.day)) {
    age -= 1;
  }
  return age;
}

/** 判断是否为500字极简报告（非 AI 深度报告） */
export function isPreviewReport500(text: string): boolean {
  return (
    text.includes("500字人生剧本")
    || text.includes("500字极简报告")
    || text.includes("500-Word Life Script")
    || text.includes("Unlock the full 19-section Life Script")
    || (text.includes("PRISM Life Script") && text.includes("Luck index:"))
  );
}

export function isEnglishPreview(text: string): boolean {
  return /500-Word Life Script/i.test(text)
    || text.includes("Unlock the full 19-section Life Script")
    || (text.includes("PRISM Life Script") && text.includes("Luck index:"));
}

export function isChinesePreview(text: string): boolean {
  return text.includes("500字人生剧本") || text.includes("500字极简报告");
}

/** 缓存的预览报告是否与当前界面语言一致 */
export function previewMatchesLocale(text: string, lang?: string): boolean {
  if (!text.trim()) return false;
  const localeKey = resolveReportLocale(lang);
  if (localeKey === "en") return isEnglishPreview(text);
  if (isChinesePreview(text)) return true;
  return !isEnglishPreview(text);
}

/** 从 NatalChart 生成500字确定性报告 */
export function generateBirthReport500(chart: NatalChart, lang?: string): string {
  const localeKey = resolveReportLocale(lang);
  const L = getLocalePack(localeKey);
  const ascSign = shortSign(chart.risingSign);
  const cusps = computeHouseCusps(ascSign, chart);

  const planets: Record<string, { sign: string; house: number }> = {};
  const planetHouses: Record<string, number> = {};
  for (const p of chart.planets) {
    const sign = shortSign(p.sign);
    planets[p.name] = { sign, house: p.house };
    planetHouses[p.name] = p.house;
  }

  const fly = computeFly(cusps, planetHouses);
  const sunHouse = planetHouses["太阳"] ?? 1;
  const isDay = sunHouse >= 7 && sunHouse <= 12;

  const scores = scorePlanets(planets, planetHouses, ascSign, isDay);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top1 = ranked[0]?.[0] ?? "太阳";
  const top2 = ranked[1]?.[0] ?? "月亮";

  const age = calcAge(chart.birthData);
  const [firdariaCurrent, firdariaFuture] = getFirdaria(age, isDay);
  const [fRuler, fStart, fEnd] = firdariaCurrent;

  const key1 = fly[1];
  const key2 = fly[key1];
  const ruler1 = RULER[cusps[1]] ?? "太阳";
  const rulerScore = scores[ruler1] ?? 50;
  const isStrong = rulerScore >= 58;

  const moneyH = fly[2];
  const careerH = fly[10];
  const sideH = fly[8];
  const loveH = fly[5];
  const marriageH = fly[7];

  const comboKey = [top1, top2].sort((a, b) => (PLANET_BASE[b] ?? 0) - (PLANET_BASE[a] ?? 0)).join(",");
  const comboRole = L.comboNames[comboKey] ?? COMBO_NAMES[comboKey] ?? L.comboFallback(
    planetLabel(top1, localeKey),
    planetLabel(top2, localeKey),
  );
  const planetRole = localeKey === "zh" ? `${top1}人` : `${planetLabel(top1, localeKey)} Person`;

  const top1Sign = planets[top1]?.sign ?? "白羊";
  const top1House = planets[top1]?.house ?? 1;
  const sunSign = planets["太阳"]?.sign ?? "白羊";
  const moonSign = planets["月亮"]?.sign ?? "白羊";
  const top1Essence = L.planetEssence[top1] ?? L.defaultEssence;
  const [top1Dig] = getDignity(top1, top1Sign);
  const digNote = L.digNotes[top1Dig] ?? "";

  const fPartnerDesc = L.firdariaPartner[fRuler] ?? L.defaultPartner;
  let futureTxt = "";
  if (firdariaFuture.length > 0) {
    const [ns, , nr] = firdariaFuture[0];
    const careerScene = L.flyScene[careerH] ?? (localeKey === "en" ? "career" : "事业");
    futureTxt = L.futurePeriod(planetLabel(nr, localeKey), ns, careerScene);
  }

  const saturnHouse = planets["土星"]?.house ?? 6;
  const saturnScene = L.flyScene[saturnHouse] ?? (localeKey === "en" ? "daily life" : "日常");
  const weakness = L.weakness(saturnScene);

  const name = chart.birthData.name || L.defaultName;
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const key2Scene = L.flyScene[key2] ?? "";
  const k2desc = isStrong ? L.k2descStrong(key2Scene) : L.k2descWeak(key2Scene);
  const key2Label = isStrong ? L.key2Strong : L.key2Weak;

  const scene = (h: number, fallback: string) => L.flyScene[h] ?? fallback;
  const tpl = L.templates;
  const top1Display = planetLabel(top1, localeKey);
  const sunDisplay = signLabel(sunSign, localeKey);
  const moonDisplay = signLabel(moonSign, localeKey);
  const top1SignDisplay = signLabel(top1Sign, localeKey);

  const lines = [
    tpl.title(planetRole, sunDisplay, moonDisplay, name),
    tpl.tagline(top1Display, L.planetPerson[top1] ?? L.defaultPerson),
    "",
    `## ${L.sections.who}`,
    tpl.who1(top1Essence, digNote),
    tpl.who2(top1SignDisplay),
    tpl.who3(top1House, scene(top1House, localeKey === "en" ? "self-expression" : "")),
    "",
    `## ${L.sections.talent}`,
    tpl.talent1(top1SignDisplay, scene(top1House, localeKey === "en" ? "self-expression" : "")),
    tpl.talent2(comboRole),
    tpl.industry(
      scene(careerH, localeKey === "en" ? "career" : "事业"),
      scene(key1, localeKey === "en" ? "self-realization" : "自我实现"),
      scene(key2, localeKey === "en" ? "value building" : "价值落地"),
    ),
    "",
    `## ${L.sections.keys}`,
    tpl.key1(scene(key1, localeKey === "en" ? "self" : "自我")),
    tpl.key2(key2Label, key1, key2, k2desc),
    "",
    `## ${L.sections.wealth}`,
    tpl.wealth1(
      scene(moneyH, localeKey === "en" ? "value" : "价值"),
      scene(careerH, localeKey === "en" ? "status" : "地位"),
    ),
    tpl.wealth2(scene(sideH, localeKey === "en" ? "resources" : "资源")),
    tpl.wealth3(
      scene(loveH, localeKey === "en" ? "passion" : "心动"),
      scene(marriageH, localeKey === "en" ? "walk together" : "同行"),
    ),
    "",
    `## ${L.sections.action}`,
    tpl.action1(fStart, fEnd, planetLabel(fRuler, localeKey)),
    tpl.action2(fPartnerDesc, futureTxt),
    tpl.action3(weakness),
    tpl.action4(L.planetEssence[top1] ?? L.defaultEssence, scene(key1, localeKey === "en" ? "the right context" : "正确场景")),
    "",
    "---",
    `[${L.footerTime}] ${timeStr} | ${L.reportMarker}`,
    L.footerNote,
  ];

  return lines.join("\n");
}
