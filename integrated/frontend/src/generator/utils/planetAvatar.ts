import type { BirthData } from "../services/astrologyEngine";
import { planetLabel, type ReportLocale } from "../services/birthReport500Locale";
import { loadBirthData } from "../services/reportStore";

export type UserGender = "male" | "female";

export const PLANET_KEYS = [
  "太阳", "月亮", "水星", "金星", "火星",
  "木星", "土星", "天王星", "海王星", "冥王星",
] as const;

export type PlanetKey = (typeof PLANET_KEYS)[number];

const PLANET_EN_TO_ZH: Record<string, PlanetKey> = {
  sun: "太阳",
  moon: "月亮",
  mercury: "水星",
  venus: "金星",
  mars: "火星",
  jupiter: "木星",
  saturn: "土星",
  uranus: "天王星",
  neptune: "海王星",
  pluto: "冥王星",
};

export function isPlanetKey(value: string): value is PlanetKey {
  return (PLANET_KEYS as readonly string[]).includes(value);
}

export function normalizePlanetKey(value: string): PlanetKey | null {
  if (isPlanetKey(value)) return value;
  const fromEn = PLANET_EN_TO_ZH[value.toLowerCase()];
  return fromEn ?? null;
}

/** 中文「火星人」/ 英文「Mars Person」 */
export function formatPlanetPerson(planet: PlanetKey, locale: ReportLocale): string {
  if (locale === "zh") return `${planet}人`;
  return `${planetLabel(planet, "en")} Person`;
}

export function resolvePlanetPersonRole(
  dominantPlanet: string,
  locale: ReportLocale,
  coverText?: string,
): string {
  const parsed = coverText ? parsePlanetFromCoverText(coverText, locale) : null;
  const planet = parsed ?? normalizePlanetKey(dominantPlanet) ?? "太阳";
  return formatPlanetPerson(planet, locale);
}

/** 从封面/标题文本解析 AI 输出的行星人类型 */
export function parsePlanetFromCoverText(text: string, locale: ReportLocale): PlanetKey | null {
  if (!text.trim()) return null;

  if (locale === "zh") {
    for (const planet of PLANET_KEYS) {
      if (new RegExp(`${planet}人`).test(text)) return planet;
    }
    return null;
  }

  for (const planet of PLANET_KEYS) {
    const en = planetLabel(planet, "en");
    if (new RegExp(`\\b${en}\\s+Person\\b`, "i").test(text)) return planet;
    if (new RegExp(`\\b${en}\\s+Archetype\\b`, "i").test(text)) return planet;
  }
  return null;
}

/** 用户填写的性别（出生表单），用于选择男/女头像 */
export function resolveUserGender(birthData?: Partial<BirthData> | null): UserGender {
  const raw = birthData?.gender ?? loadBirthData()?.gender;
  if (raw === "male" || raw === "female") return raw;
  return "female";
}

/** 行星类型（AI/计算） + 用户性别（表单） → 头像路径 */
export function getPlanetAvatarSrc(
  planet: string,
  birthData?: Partial<BirthData> | UserGender | null,
): string {
  const key = normalizePlanetKey(planet) ?? "太阳";
  const gender =
    typeof birthData === "string"
      ? birthData
      : resolveUserGender(birthData);
  const genderSuffix = gender === "female" ? "女" : "男";
  return `/images/planet-avatars/${key}-${genderSuffix}.webp`;
}
