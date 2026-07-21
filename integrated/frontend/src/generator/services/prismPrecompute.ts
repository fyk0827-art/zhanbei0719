/**
 * PRISM Life Script precompute engine (EN product layer).
 * Ported from birth_report_precompute.py — scores/labels are programmatic;
 * AI only writes copy from this JSON.
 */
import type { NatalChart } from "./astrologyEngine";
import {
  ABILITY_EN,
  getRoleNameEn,
  HOUSE_SCENE_EN,
  INDUSTRY_EN,
  PLANET_EN,
  PLANET_PERSON_DEF_EN,
  PLANET_PERSON_EN,
  THEME_PLANET,
} from "./prismLabelsEn";

const RULERS: Record<string, string> = {
  白羊: "火星", 金牛: "金星", 双子: "水星", 巨蟹: "月亮",
  狮子: "太阳", 处女: "水星", 天秤: "金星", 天蝎: "冥王星",
  射手: "木星", 摩羯: "土星", 水瓶: "天王星", 双鱼: "海王星",
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

const HOUSE_WEIGHT: Record<number, number> = {
  1: 10, 10: 9, 7: 9, 4: 9, 2: 4, 5: 4, 8: 4, 11: 4, 3: -2, 6: -2, 9: -2, 12: -2,
};

const ALL_SIGNS = ["白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼"];

const SIGN_ELEMENT: Record<string, string> = {
  白羊: "火", 金牛: "土", 双子: "风", 巨蟹: "水", 狮子: "火", 处女: "土",
  天秤: "风", 天蝎: "水", 射手: "火", 摩羯: "土", 水瓶: "风", 双鱼: "水",
};

const FIRDARIA_DAY: [number, number, string][] = [
  [0, 10, "太阳"], [10, 19, "金星"], [19, 31, "水星"], [31, 40, "月亮"],
  [40, 51, "土星"], [51, 63, "木星"], [63, 70, "火星"],
];
const FIRDARIA_NIGHT: [number, number, string][] = [
  [0, 9, "月亮"], [9, 20, "土星"], [20, 31, "木星"], [31, 40, "火星"],
  [40, 51, "太阳"], [51, 62, "金星"], [62, 75, "水星"],
];

const FIRDARIA_PARTNER_EN: Record<string, string> = {
  太阳: "Jupiter-type — people who push you to think bigger and act boldly",
  月亮: "Saturn-type — people who help you land feelings into action",
  水星: "Jupiter-type — people who lift you from details to the big picture",
  金星: "Mars-type — people who push you from weighing options into action",
  火星: "Venus-type — people who shift you from clash toward collaboration",
  木星: "Saturn-type — people who pull you from expansion back to focus",
  土星: "Jupiter-type — people who help you see possibility under pressure",
};

const RISK_8FLY_EN: Record<number, string> = {
  1: "Resource risk from impulsive identity shifts or self-judgment",
  2: "Cashflow, pricing, assets, and spending risk",
  3: "Contracts, communication, short-term information gaps",
  4: "Family, property, long-term safety, intimate trust risk",
  5: "Romance, play, creation, speculation, side projects",
  6: "Work process, health, delivery, subordinate risk",
  7: "Partner, client, one-to-one binding risk",
  8: "Investment, debt, deep binding, crisis-conversion risk",
  9: "Distance, courses, legal, publishing, belief risk",
  10: "Career reputation, title, authority, public risk",
  11: "Community, platform, network, organization risk",
  12: "Hidden resources, behind-the-scenes drain, isolation risk",
};

const ABILITY_NOTE_EN: Record<string, string> = {
  Leadership: "You set direction others follow",
  Empathy: "You sense unspoken needs",
  Expression: "You turn complexity into clear words",
  Aesthetics: "You can price beauty and taste",
  Action: "You move when others still hesitate",
  Expansion: "You spot larger opportunities first",
  Execution: "You turn plans into durable systems",
  Innovation: "You find new solutions inside old rules",
  Inspiration: "You sense layers others miss",
  Insight: "You find rebirth power inside crisis",
};

const LUCK_LEVEL_EN = [
  { min: 85, level: "high", desc: "When direction is right, resources, opportunities, and allies move toward you" },
  { min: 70, level: "rising", desc: "Luck opens when you stay on your main route and ship visible work" },
  { min: 55, level: "building", desc: "Luck builds through structure — stabilize systems before expanding" },
  { min: 0, level: "awakening", desc: "Luck wakes when you stop fighting your nature and start packaging it" },
];

export interface PrismAbilityScore {
  planet: string;
  ability: string;
  score: number;
  percentile: string;
  level: string;
  note: string;
}

export interface PrismCareerMatch {
  profession: string;
  industry: string;
  role: "Super Lead" | "Lead" | "Support" | "Side";
  score: number;
  reason: string;
}

export interface PrismPrecomputed {
  name: string;
  gender: string;
  planet_person: string;
  identity_sub_label: string;
  identity_display: string;
  definition: string;
  tagline: string;
  lucky_score: number;
  lucky_level: string;
  lucky_level_desc: string;
  theme_planet: string;
  top1: string;
  top2: string;
  top3: string;
  top1_score: number;
  top2_score: number;
  scores: Record<string, number>;
  ranked: { planet: string; score: number; ability: string }[];
  ability_scores: PrismAbilityScore[];
  top_abilities: PrismAbilityScore[];
  score_strip: { rank: string; score: number; ability: string; note: string }[];
  career_matches: PrismCareerMatch[];
  industry_map: { industry: string; role: string; score: number }[];
  wealth_modes: { mode: string; score: number; note: string }[];
  partner_profile: { type: string; role: string; score: number; reason: string }[];
  luck_entry: { title: string; detail: string }[];
  energy_leaks: string[];
  block_people: string[];
  boost_people: string[];
  risk_redlines: { area: string; severity: string; detail: string }[];
  ninety_day_plan: { phase: string; focus: string; actions: string[] }[];
  execution_card: {
    identity: string;
    top_abilities: string[];
    do_now: string[];
    avoid: string[];
    luck_entry: string;
  };
  fly: Record<number, number>;
  finance: Record<string, { fly: string; house: number; scene: string; ruler: string }>;
  relations: Record<string, { fly: string; house: number; scene: string }>;
  firdaria: {
    age: number;
    current_ruler: string;
    partner: string;
    house: number;
  } | null;
  score_card: Record<string, number>;
  score_labels: Record<string, string>;
  sect: string;
  is_day: boolean;
  asc_sign: string;
  mc_sign: string;
  planet_positions: Record<string, { sign: string; house: number; en: string }>;
  evidence: {
    golden_key: string;
    top_talents: string[];
    hard_aspect_count: number;
  };
}

function shortSign(sign: string): string {
  return sign.replace(/座$/, "");
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function labelByScore(score: number, high: string, mid: string, low: string): string {
  if (score >= 85) return high;
  if (score >= 70) return mid;
  return low;
}

function scoreToPercentile(score: number): string {
  if (score >= 95) return "Top 1–3%";
  if (score >= 90) return "Top 4–5%";
  if (score >= 85) return "Top 6–10%";
  if (score >= 80) return "Top 11–15%";
  if (score >= 75) return "Top 16–22%";
  if (score >= 70) return "Top 23–30%";
  if (score >= 60) return "Top 31–45%";
  return "Developing range";
}

function abilityLevel(score: number): string {
  if (score >= 80) return "Super core";
  if (score >= 70) return "Core";
  if (score >= 55) return "Support";
  return "To develop";
}

function roleByScore(score: number): PrismCareerMatch["role"] {
  if (score >= 88) return "Super Lead";
  if (score >= 75) return "Lead";
  if (score >= 55) return "Support";
  return "Side";
}

function getDignity(planet: string, sign: string): [string, number] {
  const d = DIGNITY[planet];
  if (!d) return ["中性", 0];
  for (const [label, score] of [["入庙", 7], ["入旺", 6], ["失势", -5], ["落陷", -4]] as const) {
    if (d[label].includes(sign)) return [label, score];
  }
  return ["中性", 0];
}

function computeCusps(ascSign: string, chart: NatalChart): Record<number, string> {
  const cusps: Record<number, string> = {};
  for (const h of chart.houses) {
    cusps[h.house] = shortSign(h.sign);
  }
  for (let h = 1; h <= 12; h++) {
    if (!cusps[h]) {
      const idx = (ALL_SIGNS.indexOf(ascSign) + h - 1) % 12;
      cusps[h] = ALL_SIGNS[idx];
    }
  }
  return cusps;
}

function computeFly(cusps: Record<number, string>, planetHouses: Record<string, number>): Record<number, number> {
  const fly: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) {
    const ruler = RULERS[cusps[h]] ?? "太阳";
    fly[h] = planetHouses[ruler] ?? 1;
  }
  return fly;
}

function sectBonus(planet: string, isDay: boolean): number {
  const dayTeam = ["太阳", "木星", "土星"];
  const nightTeam = ["月亮", "金星", "火星"];
  if (isDay) return dayTeam.includes(planet) ? 5 : nightTeam.includes(planet) ? -3 : 0;
  return nightTeam.includes(planet) ? 5 : dayTeam.includes(planet) ? -3 : 0;
}

function scorePlanets(
  planets: Record<string, { sign: string; house: number; lon?: number }>,
  planetHouses: Record<string, number>,
  ascSign: string,
  isDay: boolean,
  hardAspectCountByPlanet: Record<string, number>,
  softAspectBonusByPlanet: Record<string, number>,
): Record<string, number> {
  const scores: Record<string, number> = {};
  const ruler1 = RULERS[ascSign] ?? "太阳";
  const houseCount: Record<number, number> = {};
  for (const h of Object.values(planetHouses)) houseCount[h] = (houseCount[h] ?? 0) + 1;

  for (const [planet, info] of Object.entries(planets)) {
    let score = PLANET_BASE[planet] ?? 40;
    const house = planetHouses[planet] ?? info.house;
    score += sectBonus(planet, isDay);
    if (planet === ruler1) score += 15;
    if ((houseCount[house] ?? 0) >= 3) score += 4;
    score += HOUSE_WEIGHT[house] ?? 0;
    if (planet === "太阳" || planet === "月亮") score += 3;
    const [, ds] = getDignity(planet, info.sign);
    score += ds;
    score += softAspectBonusByPlanet[planet] ?? 0;
    score -= Math.min(6, (hardAspectCountByPlanet[planet] ?? 0) * 1.5);
    scores[planet] = clampScore(score);
  }
  return scores;
}

function calcAge(bd: { year: number; month: number; day: number }): number {
  const now = new Date();
  let age = now.getFullYear() - bd.year;
  if (now.getMonth() + 1 < bd.month || (now.getMonth() + 1 === bd.month && now.getDate() < bd.day)) {
    age -= 1;
  }
  return Math.max(0, age);
}

function getFirdaria(age: number, isDay: boolean): { ruler: string; start: number; end: number } {
  const seq = isDay ? FIRDARIA_DAY : FIRDARIA_NIGHT;
  for (const [start, end, ruler] of seq) {
    if (age >= start && age < end) return { ruler, start, end };
  }
  const last = seq[seq.length - 1];
  return { ruler: last[2], start: last[0], end: last[1] };
}

function professionFromIndustry(industry: string, top1: string): string {
  const lower = industry.toLowerCase();
  if (lower.includes("content") || lower.includes("writing") || lower.includes("script")) {
    return top1 === "水星" ? "Content Architect" : "Content Strategist";
  }
  if (lower.includes("education") || lower.includes("course") || lower.includes("curriculum") || lower.includes("knowledge")) {
    return "Learning Product Designer";
  }
  if (lower.includes("consult") || lower.includes("research") || lower.includes("insight")) {
    return top1 === "月亮" ? "User Insight Advisor" : "Diagnostic Consultant";
  }
  if (lower.includes("brand") || lower.includes("aesthetic") || lower.includes("lifestyle") || lower.includes("premium")) {
    return "Brand Value Advisor";
  }
  if (lower.includes("sales") || lower.includes("growth") || lower.includes("bd")) {
    return "Growth Lead";
  }
  if (lower.includes("ai") || lower.includes("innovation") || lower.includes("tech")) {
    return "Innovation Product Lead";
  }
  if (lower.includes("art") || lower.includes("healing") || lower.includes("meditation")) {
    return "Creative Healing Guide";
  }
  return `${industry} Specialist`;
}

function luckFromScores(scoreCard: Record<string, number>, top1Score: number): { score: number; level: string; desc: string } {
  const raw =
    (scoreCard.route_score ?? top1Score) * 0.4 +
    (scoreCard.noble_support ?? 60) * 0.25 +
    (scoreCard.talent_visibility ?? 60) * 0.2 +
    (100 - (scoreCard.risk_score ?? 40)) * 0.15;
  const score = clampScore(raw);
  const hit = LUCK_LEVEL_EN.find((l) => score >= l.min) ?? LUCK_LEVEL_EN[LUCK_LEVEL_EN.length - 1];
  return { score, level: hit.level, desc: hit.desc };
}

export interface PrismPrecomputeOptions {
  name?: string;
  gender?: string;
  age?: number;
}

/** Main entry: NatalChart → product JSON for prompts + page. */
export function prismPrecompute(chart: NatalChart, opts: PrismPrecomputeOptions = {}): PrismPrecomputed {
  const name = opts.name?.trim() || chart.birthData?.name?.trim() || "You";
  const gender = opts.gender?.trim() || "";
  const ascSign = shortSign(chart.risingSign);
  const mcSign = shortSign(chart.angles?.mcSign || chart.houses.find((h) => h.house === 10)?.sign || ascSign);
  const cusps = computeCusps(ascSign, chart);

  const planets: Record<string, { sign: string; house: number; lon?: number }> = {};
  const planetHouses: Record<string, number> = {};
  for (const p of chart.planets) {
    const sign = shortSign(p.sign);
    planets[p.name] = { sign, house: p.house, lon: p.longitude };
    planetHouses[p.name] = p.house;
  }

  const hardAspectCountByPlanet: Record<string, number> = {};
  const softAspectBonusByPlanet: Record<string, number> = {};
  for (const a of chart.aspects || []) {
    const asp = a.aspectType || "";
    const hard = /刑|冲|square|opposition/i.test(asp);
    const soft = /拱|六合|合|trine|sextile|conjunction/i.test(asp);
    for (const n of [a.planet1, a.planet2]) {
      if (!n) continue;
      if (hard) hardAspectCountByPlanet[n] = (hardAspectCountByPlanet[n] ?? 0) + 1;
      if (soft) softAspectBonusByPlanet[n] = (softAspectBonusByPlanet[n] ?? 0) + 2;
    }
  }
  const hardAspectCount = Object.values(hardAspectCountByPlanet).reduce((s, n) => s + n, 0) / 2;

  const sunHouse = planetHouses["太阳"] ?? 1;
  const isDay = sunHouse >= 7 && sunHouse <= 12;
  const fly = computeFly(cusps, planetHouses);
  const scores = scorePlanets(planets, planetHouses, ascSign, isDay, hardAspectCountByPlanet, softAspectBonusByPlanet);
  const rankedRaw = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top1 = rankedRaw[0]?.[0] ?? "太阳";
  const top2 = rankedRaw[1]?.[0] ?? "月亮";
  const top3 = rankedRaw[2]?.[0] ?? "水星";
  const top1Score = rankedRaw[0]?.[1] ?? 65;
  const top2Score = rankedRaw[1]?.[1] ?? 60;

  const cuspRulers: Record<number, string> = {};
  for (let h = 1; h <= 12; h++) cuspRulers[h] = RULERS[cusps[h]] ?? "太阳";

  const finance = {
    zhengcai: {
      fly: `2→${fly[2]}`,
      house: fly[2],
      scene: HOUSE_SCENE_EN[fly[2]] ?? "monetizing resources",
      ruler: cuspRulers[2],
    },
    career: {
      fly: `10→${fly[10]}`,
      house: fly[10],
      scene: HOUSE_SCENE_EN[fly[10]] ?? "career & reputation",
      ruler: cuspRulers[10],
    },
    piancai: {
      fly: `8→${fly[8]}`,
      house: fly[8],
      scene: HOUSE_SCENE_EN[fly[8]] ?? "deep resources",
      ruler: cuspRulers[8],
    },
  };

  const relations = {
    love: { fly: `5→${fly[5]}`, house: fly[5], scene: HOUSE_SCENE_EN[fly[5]] ?? "creative expression" },
    marriage: { fly: `7→${fly[7]}`, house: fly[7], scene: HOUSE_SCENE_EN[fly[7]] ?? "one-to-one partnership" },
    family: { fly: `4→${fly[4]}`, house: fly[4], scene: HOUSE_SCENE_EN[fly[4]] ?? "roots & family" },
    health: { fly: `6→${fly[6]}`, house: fly[6], scene: HOUSE_SCENE_EN[fly[6]] ?? "daily work" },
  };

  const goldenKeyHouse = fly[1];
  const goldenKeyRuler = cuspRulers[1];
  const goldenStrong = (scores[goldenKeyRuler] ?? 50) >= 70 || [1, 10, 7, 4].includes(goldenKeyHouse);

  const avgTop3 = (rankedRaw.slice(0, 3).reduce((s, [, v]) => s + v, 0) / 3) || 60;
  const riskScore = clampScore(35 + hardAspectCount * 4 + (RISK_8FLY_EN[fly[8]] ? 8 : 0));
  const monetization =
    (scores[finance.career.ruler] ?? 50) * 0.35 +
    (scores[finance.zhengcai.ruler] ?? 50) * 0.35 +
    (scores[goldenKeyRuler] ?? 50) * 0.3;
  const execution =
    (scores["火星"] ?? 50) * 0.45 + (scores[goldenKeyRuler] ?? 50) * 0.35 + (goldenStrong ? 15 : 0);
  const noble =
    (scores["木星"] ?? 50) * 0.45 + (scores["金星"] ?? 50) * 0.3 + (scores["月亮"] ?? 50) * 0.25;
  const talentVisibility = avgTop3 + (goldenStrong ? 8 : -3);
  const awakening = clampScore((scores[goldenKeyRuler] ?? 50) * 0.6 + (goldenStrong ? 20 : 5) + top1Score * 0.15);
  const realitySupport = clampScore(
    (scores[finance.career.ruler] ?? 50) * 0.5 + Math.max(monetization, scores[finance.zhengcai.ruler] ?? 50) * 0.5,
  );
  const routeScore = clampScore(
    awakening * 0.35 + top1Score * 0.25 + realitySupport * 0.25 + talentVisibility * 0.15 - Math.min(4, hardAspectCount * 0.4),
  );

  const score_card = {
    route_score: routeScore,
    total_score: routeScore,
    talent_visibility: clampScore(talentVisibility),
    monetization_potential: clampScore(monetization),
    relationship_stability: clampScore(100 - riskScore * 0.4 + 20),
    execution_score: clampScore(execution),
    risk_score: riskScore,
    noble_support: clampScore(noble),
    awakening_score: awakening,
    reality_support: realitySupport,
  };

  const score_labels = {
    total_score: labelByScore(score_card.total_score, "Best route clear", "Main line developable", "Main line to awaken"),
    talent_visibility: labelByScore(score_card.talent_visibility, "Instant recognition", "Needs visible work", "Build basic visibility first"),
    monetization_potential: labelByScore(score_card.monetization_potential, "Work-product monetizer", "Skill monetizer", "Stabilize cashflow first"),
    relationship_stability: labelByScore(score_card.relationship_stability, "Stable-bond type", "Needs clear boundaries", "High-drain relationship pattern"),
    execution_score: labelByScore(score_card.execution_score, "Strong lander", "Gifted but needs packaging", "Build action systems first"),
    risk_score: labelByScore(score_card.risk_score, "High reef alert", "Moderate risk reminder", "Low-risk setup"),
    noble_support: labelByScore(score_card.noble_support, "Ally-magnet constitution", "Ideas attract allies", "Proactively link resources first"),
  };

  const ability_scores: PrismAbilityScore[] = rankedRaw.map(([planet, score]) => {
    const ability = ABILITY_EN[planet] ?? PLANET_EN[planet] ?? planet;
    return {
      planet,
      ability,
      score,
      percentile: scoreToPercentile(score),
      level: abilityLevel(score),
      note: ABILITY_NOTE_EN[ability] ?? "Core operating strength",
    };
  });

  const top_abilities = ability_scores.slice(0, 6);
  const score_strip = ability_scores.slice(0, 4).map((a, i) => ({
    rank: `TOP${i + 1}`,
    score: a.score,
    ability: a.ability,
    note: a.note,
  }));

  const industryPrimary = INDUSTRY_EN[top1] ?? ["Consulting"];
  const industryCombo = INDUSTRY_EN[top2]?.slice(0, 2) ?? [];
  const careerSource = [...industryCombo, ...industryPrimary].slice(0, 4);
  const career_matches: PrismCareerMatch[] = careerSource.map((industry, i) => {
    const score = clampScore(top1Score * 0.55 + top2Score * 0.25 + (goldenStrong ? 12 : 0) - i * 4);
    return {
      profession: professionFromIndustry(industry, top1),
      industry,
      role: roleByScore(score),
      score,
      reason: `${PLANET_EN[top1]} lead + ${PLANET_EN[top2]} support + life-key ${goldenKeyRuler}`,
    };
  });
  career_matches.push({
    profession: "Pure admin executor",
    industry: "No-expression admin roles",
    role: "Support",
    score: 52,
    reason: "Your core needs expression and decision room; pure execution suppresses visibility",
  });
  career_matches.push({
    profession: "High-pressure short-cycle seller",
    industry: "Speculative / favor-based deals",
    role: "Side",
    score: 35,
    reason: "Unclear boundaries amplify money and trust reefs",
  });
  if (!career_matches.some((c) => c.role === "Lead" || c.role === "Super Lead")) {
    career_matches[0].role = "Lead";
    career_matches[0].score = Math.max(career_matches[0].score, 76);
  }

  const industry_map = career_matches.map((c) => ({
    industry: c.industry,
    role: c.role,
    score: c.score,
  }));

  const wealth_modes = [
    {
      mode: `Primary income via ${finance.zhengcai.scene}`,
      score: clampScore(scores[finance.zhengcai.ruler] ?? 55),
      note: `House path ${finance.zhengcai.fly}`,
    },
    {
      mode: `Career reputation via ${finance.career.scene}`,
      score: clampScore(scores[finance.career.ruler] ?? 55),
      note: `House path ${finance.career.fly}`,
    },
    {
      mode: `Shared / deep resources via ${finance.piancai.scene}`,
      score: clampScore(scores[finance.piancai.ruler] ?? 50),
      note: RISK_8FLY_EN[fly[8]] ?? `House path ${finance.piancai.fly}`,
    },
  ];

  const lovePenalty = riskScore >= 70 ? 18 : riskScore >= 55 ? 8 : 0;
  const partner_profile = [
    {
      type: "Partners who communicate, co-learn, and negotiate rules",
      role: "Lead",
      score: clampScore(88 - lovePenalty / 2),
      reason: `Marriage path ${relations.marriage.fly}; core scene: ${relations.marriage.scene}`,
    },
    {
      type: "Emotionally steady people with clear boundaries and value respect",
      role: "Lead",
      score: clampScore(84 - lovePenalty / 2),
      reason: "Clear money/relationship boundaries reduce Venus-type pressure",
    },
    {
      type: "People who demand you shrink, over-give, or stay invisible",
      role: "Side",
      score: 38,
      reason: "This pattern drains your lead abilities and luck entry",
    },
  ];

  const age = opts.age ?? calcAge(chart.birthData);
  const fir = getFirdaria(age, isDay);
  const firdaria = {
    age,
    current_ruler: fir.ruler,
    partner: FIRDARIA_PARTNER_EN[fir.ruler] ?? "People who complement your timing",
    house: planetHouses[fir.ruler] ?? 1,
  };

  const luck = luckFromScores(score_card, top1Score);
  const identity_sub_label = getRoleNameEn(top1, top2, PLANET_BASE);
  const planet_person = PLANET_PERSON_EN[top1] ?? `${PLANET_EN[top1]} Person`;
  const definition = PLANET_PERSON_DEF_EN[top1] ?? "You operate from a clear core strength.";
  const tagline = `${definition.split("—")[0]?.trim() || definition} · built as ${identity_sub_label}`;

  const luck_entry = [
    {
      title: `Open via ${HOUSE_SCENE_EN[goldenKeyHouse] ?? "self-expression"}`,
      detail: `Your life key points to house ${goldenKeyHouse} through ${PLANET_EN[goldenKeyRuler] ?? goldenKeyRuler}. Ship visible work there first.`,
    },
    {
      title: `Current timing: ${PLANET_EN[fir.ruler] ?? fir.ruler} period`,
      detail: `Age ${age} — lean on ${firdaria.partner}.`,
    },
    {
      title: "Make talent purchasable",
      detail: `Package your TOP abilities (${top_abilities.slice(0, 3).map((a) => a.ability).join(", ")}) into a named offer within 90 days.`,
    },
  ];

  const energy_leaks = [
    `Draining yourself in roles that ignore ${ABILITY_EN[top1] ?? "your lead ability"}`,
    `Staying in ${HOUSE_SCENE_EN[fly[12]] ?? "hidden"} loops without public packaging`,
    hardAspectCount >= 4
      ? "Replaying hard conflict patterns instead of converting them into boundaries"
      : "Overthinking before shipping a minimum visible product",
  ];

  const block_people = [
    "People who only want your labor, never your judgment",
    "Partners who punish visibility or keep moving the goalposts",
    "Advice-givers who push you into short-cycle speculation",
  ];

  const boost_people = [
    firdaria.partner,
    `People who buy and amplify your ${ABILITY_EN[top1] ?? "core"} strength`,
    `Collaborators strong in ${ABILITY_EN[top2] ?? "support"} who respect your lead`,
  ];

  const risk_redlines = [
    {
      area: "Wealth",
      severity: riskScore >= 70 ? "High" : riskScore >= 55 ? "Medium" : "Low",
      detail: RISK_8FLY_EN[fly[8]] ?? "Keep shared resources and primary income accounts separate.",
    },
    {
      area: "Relationships",
      severity: lovePenalty >= 18 ? "High" : lovePenalty >= 8 ? "Medium" : "Low",
      detail: `One-to-one bonds activate through ${relations.marriage.scene} — clarify rules early.`,
    },
    {
      area: "Career",
      severity: (scores[finance.career.ruler] ?? 50) < 55 ? "Medium" : "Low",
      detail: `Career path ${finance.career.fly} — avoid invisible labor without ownership.`,
    },
    {
      area: "Health / daily systems",
      severity: "Medium",
      detail: `Daily work path ${relations.health.fly} — protect sleep and recovery as infrastructure.`,
    },
  ];

  const ninety_day_plan = [
    {
      phase: "Days 1–30 · Clarify",
      focus: `Name your offer around ${identity_sub_label}`,
      actions: [
        `Write a one-sentence offer using ${top_abilities[0]?.ability ?? "your lead ability"}`,
        "List 10 people who already trust your judgment",
        "Cut one role that only consumes, never converts",
      ],
    },
    {
      phase: "Days 31–60 · Package",
      focus: "Make the offer buyable and visible",
      actions: [
        "Ship a small paid / booked version of the offer",
        `Publish 4 pieces that demonstrate ${top_abilities.slice(0, 2).map((a) => a.ability).join(" + ")}`,
        "Set pricing and boundary rules in writing",
      ],
    },
    {
      phase: "Days 61–90 · Amplify",
      focus: "Open luck through allies and repetition",
      actions: [
        `Ask 3 ${ABILITY_EN[top2] ?? "complementary"} allies for warm intros`,
        "Review what sold vs what drained energy",
        "Lock a weekly cadence for visible output",
      ],
    },
  ];

  const execution_card = {
    identity: `${planet_person} · ${identity_sub_label}`,
    top_abilities: top_abilities.slice(0, 4).map((a) => `${a.ability} ${a.score}`),
    do_now: ninety_day_plan[0].actions.slice(0, 3),
    avoid: [block_people[0], energy_leaks[0], risk_redlines[0].detail],
    luck_entry: luck_entry[0].detail,
  };

  const elements: Record<string, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };
  for (const info of Object.values(planets)) {
    const e = SIGN_ELEMENT[info.sign];
    if (e) elements[e] += 1;
  }

  return {
    name,
    gender,
    planet_person,
    identity_sub_label,
    identity_display: `${planet_person} · ${identity_sub_label}`,
    definition,
    tagline,
    lucky_score: luck.score,
    lucky_level: luck.level,
    lucky_level_desc: luck.desc,
    theme_planet: THEME_PLANET[top1] ?? "sun",
    top1,
    top2,
    top3,
    top1_score: top1Score,
    top2_score: top2Score,
    scores,
    ranked: rankedRaw.map(([planet, score]) => ({
      planet,
      score,
      ability: ABILITY_EN[planet] ?? planet,
    })),
    ability_scores,
    top_abilities,
    score_strip,
    career_matches,
    industry_map,
    wealth_modes,
    partner_profile,
    luck_entry,
    energy_leaks,
    block_people,
    boost_people,
    risk_redlines,
    ninety_day_plan,
    execution_card,
    fly,
    finance,
    relations,
    firdaria,
    score_card,
    score_labels,
    sect: isDay ? "Day chart" : "Night chart",
    is_day: isDay,
    asc_sign: ascSign,
    mc_sign: mcSign,
    planet_positions: Object.fromEntries(
      Object.entries(planets).map(([n, info]) => [
        n,
        { sign: info.sign, house: planetHouses[n] ?? info.house, en: PLANET_EN[n] ?? n },
      ]),
    ),
    evidence: {
      golden_key: `1→${goldenKeyHouse} via ${PLANET_EN[goldenKeyRuler] ?? goldenKeyRuler}`,
      top_talents: rankedRaw.slice(0, 3).map(([p]) => PLANET_EN[p] ?? p),
      hard_aspect_count: Math.round(hardAspectCount),
    },
  };
}

/** Build a deterministic English preview for unpaid / pre-AI view. */
export function buildPrismPreviewCopy(pre: PrismPrecomputed): string {
  const lines = [
    `# ${pre.name} · PRISM Life Script`,
    "",
    `**${pre.identity_display}**`,
    "",
    pre.definition,
    "",
    `Luck index: **${pre.lucky_score}** (${pre.lucky_level_desc})`,
    "",
    "## Top abilities",
    ...pre.score_strip.map((s) => `- ${s.rank} ${s.ability}: ${s.score} — ${s.note}`),
    "",
    "## Who you are",
    `You are built as a ${pre.identity_sub_label}. Your lead strength is ${pre.top_abilities[0]?.ability ?? "Leadership"} (${pre.top1_score}).`,
    `Open luck through: ${pre.luck_entry[0]?.detail ?? ""}`,
    "",
    "_Unlock the full 19-section Life Script for career map, wealth modes, relationship map, risk red lines, and 90-day execution._",
  ];
  return lines.join("\n");
}

export function isPrismReportJson(text: string): boolean {
  const t = text.trim();
  if (!t.startsWith("{")) return false;
  try {
    const j = JSON.parse(t);
    return !!(j && (j.sections || j.banner) && (j.hero || j.score_strip));
  } catch {
    return false;
  }
}

export function parsePrismReportJson(text: string): PrismReportContent | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const j = JSON.parse(text.slice(start, end + 1));
    if (!j?.sections && !j?.banner) return null;
    return j as PrismReportContent;
  } catch {
    return null;
  }
}

export interface PrismReportContent {
  banner?: {
    name?: string;
    identity?: string;
    tagline?: string;
    version_line?: string;
  };
  hero?: {
    identity?: string;
    definition?: string;
  };
  score_strip?: { rank?: string; score?: number; ability?: string; note?: string }[];
  sections?: Record<string, {
    title?: string;
    lead?: string;
    html?: string;
    paragraphs?: string[];
    quote?: string;
    items?: string[];
    cards?: { title: string; body: string }[];
    table?: { headers: string[]; rows: string[][] };
    final?: string;
  }>;
}
