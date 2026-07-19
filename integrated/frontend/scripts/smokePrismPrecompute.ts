/**
 * Smoke fixture for prismPrecompute — run with:
 *   npx tsx scripts/smokePrismPrecompute.ts
 */
import type { NatalChart } from "../src/generator/services/astrologyEngine";
import { prismPrecompute } from "../src/generator/services/prismPrecompute";
import { SECTION_NAV_EN } from "../src/generator/services/prismLabelsEn";

const SIGNS = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];
const PLANETS = ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星", "天王星", "海王星", "冥王星"];

function fixtureChart(): NatalChart {
  return {
    birthData: {
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      latitude: 31.2,
      longitude: 121.5,
      timezone: 8,
      gender: "female",
      name: "Ava",
    },
    julianDay: 2448030,
    planets: PLANETS.map((name, i) => ({
      name,
      body: i as 0,
      longitude: (i * 37) % 360,
      latitude: 0,
      speed: 1,
      sign: SIGNS[i % 12],
      signDegree: 12,
      house: ((i * 3) % 12) + 1,
      isRetrograde: false,
    })),
    houses: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      longitude: (i * 30 + 10) % 360,
      sign: SIGNS[(i + 6) % 12],
      signDegree: 10,
    })),
    angles: {
      ascendant: 190,
      mc: 100,
      descendant: 10,
      ic: 280,
      ascendantSign: "天秤座",
      mcSign: "巨蟹座",
    },
    aspects: [
      { planet1: "太阳", planet2: "月亮", aspectType: "拱", angle: 120, orb: 2 },
      { planet1: "金星", planet2: "火星", aspectType: "刑", angle: 90, orb: 3 },
    ],
    sunSign: "金牛座",
    moonSign: "双子座",
    risingSign: "天秤座",
  };
}

const pre = prismPrecompute(fixtureChart());
const checks = [
  ["name", pre.name === "Ava"],
  ["planet_person", !!pre.planet_person && pre.planet_person.endsWith("Person")],
  ["identity_sub_label", !!pre.identity_sub_label],
  ["identity_display", pre.identity_display === `${pre.planet_person} · ${pre.identity_sub_label}`],
  ["ability_scores=10", pre.ability_scores.length === 10],
  ["score_strip=4", pre.score_strip.length === 4],
  ["theme_planet", !!pre.theme_planet],
  ["lucky_score", pre.lucky_score >= 0 && pre.lucky_score <= 100],
  ["nav=19", SECTION_NAV_EN.length === 19],
  ["career_matches", pre.career_matches.length >= 3],
  ["ninety_day_plan=3", pre.ninety_day_plan.length === 3],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(ok ? "PASS" : "FAIL", label);
  if (!ok) failed += 1;
}
console.log("---");
console.log("identity:", pre.identity_display);
console.log("top1/2:", pre.top1, pre.top2, "luck:", pre.lucky_score);
console.log("TOP abilities:", pre.score_strip.map((s) => `${s.ability}:${s.score}`).join(", "));
if (failed) {
  process.exit(1);
}
console.log("smoke OK");
