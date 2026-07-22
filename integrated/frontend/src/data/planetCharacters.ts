export type PlanetKey =
  | "太阳" | "月亮" | "水星" | "金星" | "火星"
  | "木星" | "土星" | "天王星" | "海王星" | "冥王星";

export type UserGender = "male" | "female";

export interface PlanetCharacterCopy {
  personality: string;
  traits: string;
  strengths: string;
}

export interface PlanetCharacterMeta {
  planet: PlanetKey;
  gender: UserGender;
  accent: string;
  /** English display name */
  name: string;
  copy: PlanetCharacterCopy;
}

/** Full roster — same card layout for every archetype (English). */
export const PLANET_CHARACTERS: PlanetCharacterMeta[] = [
  {
    planet: "太阳",
    gender: "male",
    accent: "#e8b951",
    name: "Sun Person",
    copy: {
      personality:
        "You carry a strong backbone. Long stretches of just following someone else's lead rarely suit you. You either set the direction yourself, or you at least need to know why the work is being done.",
      traits:
        "What makes you valuable is not showing off. It is setting goals, setting the pace, and helping a group know where to go next.",
      strengths:
        "You have presence and pull. In critical moments you step forward. You fit leading a team, running a brand, or being the person who can carry the weight.",
    },
  },
  {
    planet: "月亮",
    gender: "male",
    accent: "#b8c4d4",
    name: "Moon Person",
    copy: {
      personality:
        "You read people and rooms with unusual ease. When one sentence feels off, you often notice before the person speaking does. You are not the forceful type, yet people lean on you for emotional steadiness.",
      traits:
        "Your value sits in understanding, soothing, and holding others. Whether a relationship lasts or a team stays steady often depends on someone like you.",
      strengths:
        "Strong empathy, easy warmth, and trust that builds quickly. You fit companionship, service, counseling, and roles that keep relationships healthy.",
    },
  },
  {
    planet: "金星",
    gender: "female",
    accent: "#e8a0bf",
    name: "Venus Person",
    copy: {
      personality:
        "You have a feel for people, relationships, and environments. Comfort, worth, and taste register for you almost at once. You dislike rough edges, and you resist putting yourself into low-quality people or situations.",
      traits:
        "Your value is making relationships smoother, collaboration more dignified, and products or daily life more refined.",
      strengths:
        "Taste that holds, a strong sense of measure, and skill with relationships, image, and matching the right resources to the right people.",
    },
  },
  {
    planet: "水星",
    gender: "male",
    accent: "#7b9acc",
    name: "Mercury Person",
    copy: {
      personality:
        "Your mind moves fast. You like to analyze, sort, and make sure something is actually clear. Many people live by gut feel; you live by understanding how the world works.",
      traits:
        "Your greatest value is turning messy information into order, explaining hard problems simply, and turning vague thoughts into language others can use.",
      strengths:
        "You learn quickly, speak clearly, and communicate with high efficiency. Writing, teaching, planning, consulting, and content work suit you well.",
    },
  },
  {
    planet: "火星",
    gender: "male",
    accent: "#e85d4d",
    name: "Mars Person",
    copy: {
      personality:
        "You dislike dragging things out. If it can be done, you do it; if it can be pushed, you push; if it can be charged, you charge. Others get stuck thinking too much. You more often get stuck moving too fast.",
      traits:
        "Your value is pushing stalled work forward and opening ground no one else wants to touch. You are drive, not atmosphere.",
      strengths:
        "Fast execution, quick reactions, and the nerve to rush and carry. You fit launching projects, hard fights, hitting numbers, and front-line progress.",
    },
  },
  {
    planet: "木星",
    gender: "male",
    accent: "#d4a056",
    name: "Jupiter Person",
    copy: {
      personality:
        "Small games rarely satisfy you. You look at the larger frame and prefer work with long-term growth. There is a quality in you that makes people feel there is still hope.",
      traits:
        "Your value is expanding opportunity, widening the field of play, and taking something from a small plate to a larger one.",
      strengths:
        "Wide vision and the ability to lift others. You are strong at encouraging people, combining resources, and opening markets — education, management, media, and business growth.",
    },
  },
  {
    planet: "土星",
    gender: "male",
    accent: "#8b8bb0",
    name: "Saturn Person",
    copy: {
      personality:
        "You are not a light, floating type. You work with responsibility, results, and clear boundaries. What others call a hassle, you often recognize as the part that actually matters.",
      traits:
        "Your value is holding standards, protecting process, and finishing the work — not stopping at talk.",
      strengths:
        "Steady, pressure-resistant, durable, and reliable. You fit management, execution, building systems, and guarding critical checkpoints.",
    },
  },
  {
    planet: "天王星",
    gender: "male",
    accent: "#5bc0eb",
    name: "Uranus Person",
    copy: {
      personality:
        "Old playbooks do not sit well with you. The more everyone does it one way, the more you ask why. You are not rebelling for show; you simply feel many old methods are due for a change.",
      traits:
        "Your value is breaking inertia, offering new solutions, and giving work a chance to level up.",
      strengths:
        "Fast innovation, fresh ideas, and a willingness to try and fail. You fit new business lines, product invention, model breakthroughs, and non-traditional paths.",
    },
  },
  {
    planet: "海王星",
    gender: "female",
    accent: "#6b8fd4",
    name: "Neptune Person",
    copy: {
      personality:
        "You are highly sensitive to mood, feeling, imagery, and atmosphere. You may not always explain it in words, yet you often know in one impression whether something is right. You do not live in thick outlines; you enter the world through sensing.",
      traits:
        "Your value is inspiration, beauty, imagination, and emotional comfort — making things not only useful, but able to move people.",
      strengths:
        "Strong intuition, a soft contagious presence, and fluent creative expression. Content, film, design, healing work, and shaping a brand's feeling suit you.",
    },
  },
  {
    planet: "冥王星",
    gender: "female",
    accent: "#7c5c9e",
    name: "Pluto Person",
    copy: {
      personality:
        "Shallow talk and surface performance rarely interest you. Many people watch the spectacle; you look for the core. Many people walk around a problem; you stay on the heart of it.",
      traits:
        "Your value is seeing through, facing what is hard, and rebuilding. Messes others cannot close and truths others will not touch often need someone like you.",
      strengths:
        "Piercing insight and high pressure tolerance. You fit deep research, crisis work, psychological clarity, restructuring, and high-stakes decisions.",
    },
  },
];

/** @deprecated Prefer PLANET_CHARACTERS — kept for any leftover imports */
export const PLANET_CHARACTER_GRID = PLANET_CHARACTERS.filter((c) => c.planet !== "太阳");
export const SUN_CHARACTER = PLANET_CHARACTERS.find((c) => c.planet === "太阳")!;

export function getShowcaseAvatarSrc(planet: PlanetKey, gender: UserGender): string {
  return `/images/planet-avatars/${planet}-${gender === "female" ? "女" : "男"}-card.webp`;
}
