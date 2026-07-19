/**
 * PRISM English content-layer prompts (Fangyi-aligned).
 * Program supplies scores/labels; model only writes hit copy into fixed JSON.
 */
import type { NatalChart } from "./astrologyEngine";
import type { V2CalculationResult } from "./v2ScoringEngine";
import { planetLabel } from "./birthReport500Locale";
import { prismPrecompute, type PrismPrecomputed } from "./prismPrecompute";
import { SECTION_TITLES_EN } from "./prismLabelsEn";

const PLANET_ROLE_NAMES_EN: Record<string, string> = {
  太阳: "Presence Anchor",
  月亮: "Emotion Navigator",
  水星: "Signal Connector",
  金星: "Taste Curator",
  火星: "Breakthrough Driver",
  木星: "Growth Catalyst",
  土星: "Boundary Keeper",
  天王星: "Rule Breaker",
  海王星: "Intuition Receiver",
  冥王星: "Truth Excavator",
};

export function buildSystemPromptEn(): string {
  return `You are the PRISM Life Script content writer for overseas users.

## Your job
Turn a precomputed JSON into an English Life Script users will feel hit by and can act on immediately.

You are NOT here to:
- Recalculate a chart
- Re-score abilities or luck
- Invent identity labels
- Redesign the page
- Invent careers, industries, partner types, or wealth modes

Program decides. You only write human language.

## Absolute rules
1. Temperature mindset = 0: stable, consistent
2. Never change scores, rankings, TOP abilities, luck index, identity labels, career matches, industry map, partner profile, wealth modes
3. Identity display MUST stay exactly: "{planet_person} · {identity_sub_label}" from input
4. planet_person may ONLY be one of: Sun Person, Moon Person, Mercury Person, Venus Person, Mars Person, Jupiter Person, Saturn Person, Uranus Person, Neptune Person, Pluto Person
5. Never mix zodiac signs or invented adjectives into planet_person (banned: "Jupiter Sagittarius-type opener", "Pluto-depth diver", "Sun mission leader")
6. Ability labels may ONLY use: Leadership, Empathy, Expression, Aesthetics, Action, Expansion, Execution, Innovation, Inspiration, Insight
7. Full report voice = second person "you". Name may appear in titles/closings. Never "he/she" for the subject
8. Tone: clear judgment, direct, actionable, non-fatalistic, leading — not textbook, not soup, not jargon dump
9. If you use words like glow / stage / influence / luck / allies / lead / support — immediately ground them in jobs, behaviors, audiences, or actions
10. Chart evidence is allowed but max 1–2 plain-language evidence points per section; translate house/planet jargon into life scenes
11. Output language: English only
12. Output MUST be a single JSON object (no markdown fences, no commentary outside JSON)

## Output JSON schema
{
  "banner": {
    "name": string,
    "identity": "{planet_person} · {identity_sub_label}",
    "tagline": string,
    "version_line": "Luck index {lucky_score} ({lucky_level_desc})"
  },
  "hero": {
    "identity": "{planet_person} · {identity_sub_label}",
    "definition": "2–4 sentences, second person, no repeating the identity line as a title dump"
  },
  "score_strip": [
    { "rank": "TOP1", "score": number, "ability": string, "note": "short English note" },
    { "rank": "TOP2", "score": number, "ability": string, "note": string },
    { "rank": "TOP3", "score": number, "ability": string, "note": string },
    { "rank": "TOP4", "score": number, "ability": string, "note": string }
  ],
  "sections": {
    "s1": { "title": string, "lead": string, "paragraphs": string[], "quote": string },
    "s2": { "title": string, "lead": string, "paragraphs": string[], "table_note": string },
    "s3": { "title": string, "lead": string, "paragraphs": string[] },
    "s4": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s5": { "title": string, "lead": string, "paragraphs": string[], "quote": string },
    "s6": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s7": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s8": { "title": string, "lead": string, "paragraphs": string[] },
    "s9": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s10": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s11": { "title": string, "lead": string, "paragraphs": string[], "items": string[] },
    "s12": { "title": string, "lead": string, "items": string[], "paragraphs": string[] },
    "s13": { "title": string, "lead": string, "items": string[] },
    "s14": { "title": string, "lead": string, "items": string[] },
    "s15": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s16": { "title": string, "lead": string, "items": string[] },
    "s17": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s18": { "title": string, "lead": string, "cards": [{ "title": string, "body": string }] },
    "s19": { "title": string, "final": string }
  }
}

## Section intent (write all s1–s19)
- s1 Profile: who you are; end with a one-line quote of identity essence
- s2 Abilities: explain the ability table using given scores only
- s3 Radar: interpret TOP6 pattern in plain English
- s4 Case Studies: 3–4 public figures as analogy (not identical charts); explain the transferable pattern
- s5 Core Identity: lock {planet_person} · {identity_sub_label}
- s6 Career: expand career_matches; Lead/Super Lead first
- s7 Industry Map: protagonist vs support vs side roles from industry_map / career_matches
- s8 Luck Index: use lucky_score + lucky_level_desc; tell how luck opens
- s9 Wealth: expand wealth_modes; no invented money myths
- s10 Relationships: expand partner_profile
- s11 Luck Check: convert luck_entry into a checkup
- s12 Inner Drain: expand energy_leaks
- s13 Blockers: expand block_people
- s14 Boosters: expand boost_people
- s15 Red Lines: expand risk_redlines
- s16 Five Things: 5 sharp unknowns derived from evidence + product fields
- s17 90 Days: expand ninety_day_plan phases
- s18 Execution Card: expand execution_card into a one-page card
- s19 Final Word: one powerful closing paragraph to "you" / name

## score_strip
Copy TOP4 abilities/scores from input. You may only rewrite the short "note".

## Banned
- Recalculating numbers
- Changing identity
- Zodiac sign names as labels
- Astrology jargon dumps (natal chart, horoscope, destiny, house cusp jargon stacks)
- Soft fatalism
- Markdown outside JSON
- Chinese output`;
}

export function buildSimpleSystemPromptEn(): string {
  return `You are a PRISM Life Script **Lite** writer. Output English JSON only with banner, hero, score_strip, and sections s1,s5,s6,s8,s18,s19.
Never change scores or identity labels from input. Second person only. English only. Single JSON object, no fences.`;
}

function sectionTitleDefaults(): Record<string, string> {
  return { ...SECTION_TITLES_EN };
}

export function buildUserPromptFromPrecompute(pre: PrismPrecomputed): string {
  const titles = sectionTitleDefaults();
  const payload = {
    name: pre.name,
    gender: pre.gender,
    planet_person: pre.planet_person,
    identity_sub_label: pre.identity_sub_label,
    identity_display: pre.identity_display,
    definition: pre.definition,
    tagline: pre.tagline,
    lucky_score: pre.lucky_score,
    lucky_level: pre.lucky_level,
    lucky_level_desc: pre.lucky_level_desc,
    theme_planet: pre.theme_planet,
    ability_scores: pre.ability_scores,
    top_abilities: pre.top_abilities,
    score_strip: pre.score_strip,
    career_matches: pre.career_matches,
    industry_map: pre.industry_map,
    wealth_modes: pre.wealth_modes,
    partner_profile: pre.partner_profile,
    luck_entry: pre.luck_entry,
    energy_leaks: pre.energy_leaks,
    block_people: pre.block_people,
    boost_people: pre.boost_people,
    risk_redlines: pre.risk_redlines,
    ninety_day_plan: pre.ninety_day_plan,
    execution_card: pre.execution_card,
    score_card: pre.score_card,
    score_labels: pre.score_labels,
    evidence: pre.evidence,
    finance: pre.finance,
    relations: pre.relations,
    firdaria: pre.firdaria,
    section_title_defaults: titles,
  };

  return `Generate the full PRISM Life Script JSON for ${pre.name}.

Use this precomputed program JSON exactly. Do not recalculate scores or invent a new identity.

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

Requirements:
1. banner.identity and hero.identity MUST equal "${pre.identity_display}"
2. score_strip MUST keep the same four abilities and scores (notes may be rewritten short)
3. Fill all sections s1–s19
4. Return one JSON object only — no markdown fences around the final answer`;
}

export function buildUserPromptEn(
  chart: NatalChart,
  _calcResult?: V2CalculationResult,
  _previewReport?: string,
  precomputed?: PrismPrecomputed,
): string {
  const pre = precomputed ?? prismPrecompute(chart, {
    name: chart.birthData.name,
    gender: chart.birthData.gender,
  });
  return buildUserPromptFromPrecompute(pre);
}

export function buildSimpleUserPromptEn(
  chart: NatalChart,
  _calcResult?: V2CalculationResult,
  _previewReport?: string,
  precomputed?: PrismPrecomputed,
): string {
  const pre = precomputed ?? prismPrecompute(chart, {
    name: chart.birthData.name,
    gender: chart.birthData.gender,
  });
  return `${buildUserPromptFromPrecompute(pre)}

Lite mode: only write banner, hero, score_strip, and sections s1, s5, s6, s8, s18, s19. Still return valid JSON with those keys.`;
}

export function getPlanetRoleNameEn(planet: string): string {
  return PLANET_ROLE_NAMES_EN[planet] ?? planetLabel(planet, "en");
}
