/** English labels for PRISM Life Script (overseas). */

export const PLANET_EN: Record<string, string> = {
  太阳: "Sun",
  月亮: "Moon",
  水星: "Mercury",
  金星: "Venus",
  火星: "Mars",
  木星: "Jupiter",
  土星: "Saturn",
  天王星: "Uranus",
  海王星: "Neptune",
  冥王星: "Pluto",
};

export const PLANET_PERSON_EN: Record<string, string> = {
  太阳: "Sun Person",
  月亮: "Moon Person",
  水星: "Mercury Person",
  金星: "Venus Person",
  火星: "Mars Person",
  木星: "Jupiter Person",
  土星: "Saturn Person",
  天王星: "Uranus Person",
  海王星: "Neptune Person",
  冥王星: "Pluto Person",
};

export const PLANET_PERSON_DEF_EN: Record<string, string> = {
  太阳: "Driven by self-realization — you are built to live your own direction and influence",
  月亮: "Navigated by emotional sensing — you catch needs others never say out loud",
  水星: "Powered by thinking and expression — you turn complexity into clear plans",
  金星: "Guided by value and relationships — you find what is worth investing in amid chaos",
  火星: "Led by action — you move when others still hesitate",
  木星: "Wired for vision and expansion — you see larger opportunities first",
  土星: "Rooted in order and endurance — you turn uncertainty into durable results",
  天王星: "Missioned to innovate — you find new solutions inside old rules",
  海王星: "Gifted in empathy and imagination — you sense layers others miss",
  冥王星: "Gifted in depth and transformation — you find rebirth power inside crisis",
};

/** Sub-identity role names (TOP1+TOP2) — English. */
export const ROLE_MAP_EN: Record<string, string> = {
  "太阳|月亮": "Inner Commander",
  "太阳|水星": "Thought Strategist",
  "太阳|金星": "Value Forger",
  "太阳|火星": "Action Commander",
  "太阳|木星": "Vision Navigator",
  "太阳|土星": "Foundation Architect",
  "太阳|天王星": "Future Architect",
  "太阳|海王星": "Ideal Evangelist",
  "太阳|冥王星": "Power Forger",
  "月亮|水星": "Emotion Translator",
  "月亮|金星": "Relationship Tuner",
  "月亮|火星": "Emotional First Responder",
  "月亮|木星": "Soul Mentor",
  "月亮|土星": "Safety Architect",
  "月亮|天王星": "Emotion Wall-Breaker",
  "月亮|海王星": "Soul Healer",
  "月亮|冥王星": "Abyss Explorer",
  "水星|金星": "Creative Curator",
  "水星|火星": "Strike Planner",
  "水星|木星": "Global Strategist",
  "水星|土星": "Systems Architect",
  "水星|天王星": "Cognitive Wall-Breaker",
  "水星|海王星": "Inspiration Translator",
  "水星|冥王星": "Truth Investigator",
  "金星|火星": "Attraction Engineer",
  "金星|木星": "Wealth Curator",
  "金星|土星": "Classic Caster",
  "金星|天王星": "Aesthetic Revolutionary",
  "金星|海王星": "Dream Designer",
  "金星|冥王星": "Relationship Alchemist",
  "火星|木星": "Expedition Pioneer",
  "火星|土星": "Iron Builder",
  "火星|天王星": "Breakthrough Striker",
  "火星|海王星": "Faith Warrior",
  "火星|冥王星": "Rebirth Forger",
  "木星|土星": "Pattern Architect",
  "木星|天王星": "Future Prophet",
  "木星|海王星": "Belief Navigator",
  "木星|冥王星": "Resource Alchemist",
  "土星|天王星": "Order Revolutionary",
  "土星|海王星": "Ideal Architect",
  "土星|冥王星": "Power Architect",
  "天王星|海王星": "Future Dream-Maker",
  "天王星|冥王星": "System Rebuilder",
  "海王星|冥王星": "Soul Alchemist",
};

/** Planet → ability label (English, aligned to PRISM ability set). */
export const ABILITY_EN: Record<string, string> = {
  太阳: "Leadership",
  月亮: "Empathy",
  水星: "Expression",
  金星: "Aesthetics",
  火星: "Action",
  木星: "Expansion",
  土星: "Execution",
  天王星: "Innovation",
  海王星: "Inspiration",
  冥王星: "Insight",
};

export const INDUSTRY_EN: Record<string, string[]> = {
  太阳: ["Personal branding", "Team leadership", "Education & training", "Startup incubation", "Event strategy", "Public speaking"],
  月亮: ["User research", "Client relationships", "Emotional support", "Community ops", "Care services", "Relationship coordination"],
  水星: ["Content strategy", "Curriculum design", "Knowledge products", "Writing & editing", "Script writing", "Consulting"],
  金星: ["Brand aesthetics", "Spatial design", "Lifestyle products", "Relationship services", "Premium experience", "LTV customer management"],
  火星: ["Sales & BD", "Project delivery", "Startup execution", "Fitness & performance", "Crisis response", "Growth ops"],
  木星: ["Strategy consulting", "Course systems", "Publishing & media", "Cross-border resources", "Education platforms"],
  土星: ["Enterprise consulting", "Management systems", "Finance & legal", "Long-cycle projects", "Org building", "Traditional industry upgrade"],
  天王星: ["AI applications", "Product innovation", "Tech content", "Independent brands", "System redesign", "Process automation"],
  海王星: ["Art & creation", "Film & music", "Healing content", "Meditation guidance", "Nonprofit projects", "Inspiration-led creation"],
  冥王星: ["Deep consulting", "Crisis intervention", "Investigation research", "Investment research", "Transformation coaching", "Psychological insight"],
};

export const HOUSE_SCENE_EN: Record<number, string> = {
  1: "self-expression",
  2: "monetizing resources",
  3: "learning & communication",
  4: "roots & family",
  5: "creative expression",
  6: "daily work",
  7: "one-to-one partnership",
  8: "deep resources",
  9: "vision & exploration",
  10: "career & reputation",
  11: "community circles",
  12: "inner retreat",
};

export const THEME_PLANET: Record<string, "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto"> = {
  太阳: "sun",
  月亮: "moon",
  水星: "mercury",
  金星: "venus",
  火星: "mars",
  木星: "jupiter",
  土星: "saturn",
  天王星: "uranus",
  海王星: "neptune",
  冥王星: "pluto",
};

export const SECTION_NAV_EN = [
  { id: "s1", label: "Profile" },
  { id: "s2", label: "Abilities" },
  { id: "s3", label: "Radar" },
  { id: "s4", label: "Cases" },
  { id: "s5", label: "Identity" },
  { id: "s6", label: "Career" },
  { id: "s7", label: "Industry" },
  { id: "s8", label: "Luck" },
  { id: "s9", label: "Wealth" },
  { id: "s10", label: "Relations" },
  { id: "s11", label: "Luck Check" },
  { id: "s12", label: "Drain" },
  { id: "s13", label: "Blockers" },
  { id: "s14", label: "Boosters" },
  { id: "s15", label: "Red Lines" },
  { id: "s16", label: "5 Things" },
  { id: "s17", label: "90 Days" },
  { id: "s18", label: "Exec Card" },
  { id: "s19", label: "Final" },
] as const;

export const SECTION_TITLES_EN: Record<string, string> = {
  s1: "Section 1 · Who You Are",
  s2: "Section 2 · Core Abilities",
  s3: "Section 3 · Ability Radar",
  s4: "Section 4 · Classic Figures",
  s5: "Section 5 · Core Identity",
  s6: "Section 6 · Career Direction",
  s7: "Section 7 · Industry Protagonist Map",
  s8: "Section 8 · Luck Index",
  s9: "Section 9 · Wealth Modes",
  s10: "Section 10 · Relationship Map",
  s11: "Section 11 · Luck Checkup",
  s12: "Section 12 · Inner Drain Index",
  s13: "Section 13 · People Who Block Luck",
  s14: "Section 14 · People Who Open Luck",
  s15: "Section 15 · Risk Red Lines",
  s16: "Section 16 · Five Things You May Not Know",
  s17: "Section 17 · 90-Day Action Plan",
  s18: "Section 18 · One-Page Execution Card",
  s19: "Section 19 · Final Word",
};

export function roleKey(top1: string, top2: string, base: Record<string, number>): string {
  const [a, b] = [top1, top2].sort((x, y) => (base[y] ?? 0) - (base[x] ?? 0));
  return `${a}|${b}`;
}

export function getRoleNameEn(top1: string, top2: string, base: Record<string, number>): string {
  return ROLE_MAP_EN[roleKey(top1, top2, base)] ?? `${PLANET_EN[top1] ?? top1}–${PLANET_EN[top2] ?? top2} Fusion`;
}
