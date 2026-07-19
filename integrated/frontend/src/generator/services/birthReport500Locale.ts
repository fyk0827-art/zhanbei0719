export type ReportLocale = "zh" | "en";

export function resolveReportLocale(lang?: string): ReportLocale {
  if (!lang) return "zh";
  return lang.split("-")[0].toLowerCase() === "zh" ? "zh" : "en";
}

const PLANET_EN: Record<string, string> = {
  太阳: "Sun", 月亮: "Moon", 水星: "Mercury", 金星: "Venus", 火星: "Mars",
  木星: "Jupiter", 土星: "Saturn", 天王星: "Uranus", 海王星: "Neptune", 冥王星: "Pluto",
};

const SIGN_EN: Record<string, string> = {
  白羊: "Aries", 金牛: "Taurus", 双子: "Gemini", 巨蟹: "Cancer",
  狮子: "Leo", 处女: "Virgo", 天秤: "Libra", 天蝎: "Scorpio",
  射手: "Sagittarius", 摩羯: "Capricorn", 水瓶: "Aquarius", 双鱼: "Pisces",
};

export function planetLabel(planet: string, locale: ReportLocale): string {
  return locale === "en" ? (PLANET_EN[planet] ?? planet) : planet;
}

export function signLabel(sign: string, locale: ReportLocale): string {
  return locale === "en" ? (SIGN_EN[sign] ?? sign) : sign;
}

export interface LocalePack {
  reportMarker: string;
  titleSuffix: string;
  sections: { who: string; talent: string; keys: string; wealth: string; action: string };
  defaultName: string;
  defaultRole: string;
  defaultEssence: string;
  defaultPartner: string;
  defaultPerson: string;
  key2Strong: string;
  key2Weak: string;
  k2descStrong: (scene: string) => string;
  k2descWeak: (scene: string) => string;
  futurePeriod: (ruler: string, start: number, scene: string) => string;
  weakness: (scene: string) => string;
  footerTime: string;
  footerNote: string;
  flyScene: Record<number, string>;
  planetEssence: Record<string, string>;
  planetPerson: Record<string, string>;
  comboNames: Record<string, string>;
  comboFallback: (a: string, b: string) => string;
  firdariaPartner: Record<string, string>;
  digNotes: Record<string, string>;
  templates: {
    title: (role: string, sun: string, moon: string, name: string) => string;
    tagline: (top1: string, person: string) => string;
    who1: (essence: string, digNote: string) => string;
    who2: (sign: string) => string;
    who3: (house: number, scene: string) => string;
    talent1: (sign: string, scene: string) => string;
    talent2: (role: string) => string;
    industry: (a: string, b: string, c: string) => string;
    key1: (scene: string) => string;
    key2: (label: string, k1: number, k2: number, desc: string) => string;
    wealth1: (money: string, career: string) => string;
    wealth2: (side: string) => string;
    wealth3: (love: string, marriage: string) => string;
    action1: (start: number, end: number, ruler: string) => string;
    action2: (partner: string, future: string) => string;
    action3: (weakness: string) => string;
    action4: (essence: string, scene: string) => string;
    houseSuffix: (n: number) => string;
    archetypeSuffix: string;
  };
}

const LOCALE_ZH: LocalePack = {
  reportMarker: "500字人生剧本",
  titleSuffix: "的500字人生剧本",
  sections: {
    who: "真正的你",
    talent: "极致天赋",
    keys: "金钥匙",
    wealth: "财运与关系",
    action: "行动指令",
  },
  defaultName: "你",
  defaultRole: "探索者",
  defaultEssence: "核心能力",
  defaultPartner: "支持你的人",
  defaultPerson: "独一无二的存在",
  key2Strong: "落地钥匙",
  key2Weak: "补能钥匙",
  k2descStrong: (scene) => `通过${scene}才能真正落地`,
  k2descWeak: (scene) => `通过${scene}来补充能量`,
  futurePeriod: (ruler, start, scene) => `下个大限${ruler}（${start}岁起），提前准备好你的${scene}阵地。`,
  weakness: (scene) => `容易在${scene}领域过于谨慎或恐惧`,
  footerTime: "生成时间",
  footerNote: "本报告为程序自动生成，基于确定性规则引擎，无需大模型。",
  flyScene: {
    1: "自我展现", 2: "资源变现", 3: "学习沟通", 4: "根基家庭",
    5: "创作表达", 6: "日常工作", 7: "一对一合作", 8: "深度资源",
    9: "远见探索", 10: "事业名声", 11: "社群圈子", 12: "灵性超越",
  },
  planetEssence: {
    太阳: "自我实现与领导力", 月亮: "情绪感知与滋养", 水星: "思维与沟通表达",
    金星: "价值判断与关系联结", 火星: "行动突破与执行力", 木星: "远见扩张与机遇",
    土星: "秩序耐力与积累", 天王星: "创新变革与突破", 海王星: "共情想象与灵性",
    冥王星: "深度转化与洞察",
  },
  planetPerson: {
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
  },
  comboNames: {
    "太阳,月亮": "内心指挥官", "太阳,水星": "思想战略家", "太阳,金星": "价值锻造师", "太阳,火星": "行动指挥官",
    "太阳,木星": "远见领航员", "太阳,土星": "基业建筑师", "月亮,水星": "情绪翻译官", "月亮,金星": "关系调音师",
    "水星,金星": "创意策展人", "金星,火星": "吸引力工程师", "火星,木星": "远征先锋官", "木星,土星": "格局建筑师",
  },
  comboFallback: (a, b) => `${a}型${b}型融合者`,
  firdariaPartner: {
    太阳: "鼓励你放大格局、敢想敢做的人",
    月亮: "帮你落地执行、把感受变成行动的人",
    水星: "帮你从细节跳到全局的人",
    金星: "推你从权衡走向行动的人",
    火星: "帮你从冲撞转向合作的人",
    木星: "帮你从扩张回到聚焦的人",
    土星: "帮你在压力里看到可能性的人",
  },
  digNotes: {
    入庙: "，入庙状态让你的天赋天然就是你的武器",
    入旺: "，入旺状态让你的能力更容易被看见",
    失势: "，你表达这股能量的方式与众不同",
    落陷: "，这是你一生要驯服的能量，但驯服后力量极大",
  },
  templates: {
    title: (role, sun, moon, name) => `${role} · ${sun}${moon} · ${name}的500字人生剧本`,
    tagline: (top1, person) => `**${top1}人** | ${person}`,
    who1: (essence, digNote) => `你是以${essence}为引擎的人${digNote}。`,
    who2: (sign) => `在${sign}座的风格下，你的能力具有独特节奏，`,
    who3: (house, scene) => `最能在第${house}宫的${scene}场景中释放。`,
    talent1: (sign, scene) => `你的核心天赋：用${sign}式风格，在${scene}`,
    talent2: (role) => `里做别人做不到的事。做到极致，你是${role}。`,
    industry: (a, b, c) => `【行业建议：${a} / ${b} / ${c}】`,
    key1: (scene) => `第一把：你必须做${scene}的事，这是人生入口。`,
    key2: (label, k1, k2, desc) => `第二把·${label}：1飞${k1} → ${k1}飞${k2}。${desc}。`,
    wealth1: (money, career) => `正财来自${money}，事业突破在${career}。`,
    wealth2: (side) => `偏财在${side}，注意${side}里的风险边界。`,
    wealth3: (love, marriage) => `感情里你被${love}点燃，适合和能一起${marriage}的人走远。`,
    action1: (start, end, ruler) => `你在${start}-${end}岁的${ruler}大限中。`,
    action2: (partner, future) => `身边需要${partner}。${future}`,
    action3: (w) => `核心提醒：你${w}。`,
    action4: (essence, scene) => `不是缺能力，是缺把${essence}放到${scene}里持续使用。`,
    houseSuffix: (n) => `${n}宫`,
    archetypeSuffix: "人",
  },
};

const LOCALE_EN: LocalePack = {
  reportMarker: "500-Word Life Script",
  titleSuffix: "'s 500-Word Life Script",
  sections: {
    who: "The Real You",
    talent: "Core Talent",
    keys: "Golden Keys",
    wealth: "Wealth & Relationships",
    action: "Action Plan",
  },
  defaultName: "You",
  defaultRole: "Explorer",
  defaultEssence: "core strength",
  defaultPartner: "someone who supports your growth",
  defaultPerson: "a one-of-a-kind presence",
  key2Strong: "Grounding Key",
  key2Weak: "Recharge Key",
  k2descStrong: (scene) => `True progress comes through ${scene}`,
  k2descWeak: (scene) => `Recharge through ${scene}`,
  futurePeriod: (ruler, start, scene) =>
    `Next major period: ${ruler} (from age ${start}). Prepare your ${scene} foundation early.`,
  weakness: (scene) => `You may become overly cautious or fearful in ${scene}`,
  footerTime: "Generated",
  footerNote: "Auto-generated by a deterministic rules engine. No AI model required.",
  flyScene: {
    1: "self-expression", 2: "resource building", 3: "learning & communication", 4: "home & roots",
    5: "creativity & joy", 6: "daily work", 7: "partnerships", 8: "shared resources",
    9: "vision & exploration", 10: "career & reputation", 11: "community", 12: "inner life",
  },
  planetEssence: {
    太阳: "self-realization and leadership", 月亮: "emotional awareness and nurturing",
    水星: "thinking and communication", 金星: "values and relationships",
    火星: "action and breakthrough", 木星: "expansion and opportunity",
    土星: "discipline and long-term building", 天王星: "innovation and disruption",
    海王星: "empathy and imagination", 冥王星: "transformation and depth",
  },
  planetPerson: {
    太阳: "driven by self-realization — born to make an impact",
    月亮: "guided by emotional intelligence — you sense what others miss",
    水星: "powered by clear thinking — you turn complexity into clarity",
    金星: "guided by values and connection — you find what's worth investing in",
    火星: "a pioneer of action — you move while others hesitate",
    木星: "expansion is your instinct — you see the bigger opportunity",
    土星: "built on discipline — you turn uncertainty into results",
    天王星: "here to break patterns — you find new solutions in old rules",
    海王星: "gifted with empathy and imagination — you sense the invisible",
    冥王星: "transformative by nature — you find rebirth in crisis",
  },
  comboNames: {
    "太阳,月亮": "Inner Commander", "太阳,水星": "Strategic Mind", "太阳,金星": "Value Architect",
    "太阳,火星": "Action Leader", "太阳,木星": "Vision Navigator", "太阳,土星": "Legacy Builder",
    "月亮,水星": "Emotional Translator", "月亮,金星": "Relationship Tuner",
    "水星,金星": "Creative Curator", "金星,火星": "Magnetism Engineer",
    "火星,木星": "Expedition Pioneer", "木星,土星": "Grand Architect",
  },
  comboFallback: (a, b) => `${a} × ${b} Archetype`,
  firdariaPartner: {
    太阳: "someone who pushes you to think bigger and act boldly",
    月亮: "someone who helps you ground feelings into action",
    水星: "someone who helps you zoom out from the details",
    金星: "someone who pushes you from weighing options to acting",
    火星: "someone who helps you turn conflict into collaboration",
    木星: "someone who helps you refocus when you spread too wide",
    土星: "someone who helps you see possibility under pressure",
  },
  digNotes: {
    入庙: " — dignified placement makes this talent a natural weapon",
    入旺: " — exalted energy makes your gifts easier to be seen",
    失势: " — you express this energy in a distinctive way",
    落陷: " — energy to master in this lifetime; immense power once tamed",
  },
  templates: {
    title: (role, sun, moon, name) => `${role} · ${sun} ${moon} · ${name}'s 500-Word Life Script`,
    tagline: (top1, person) => `**${top1} Person** | ${person}`,
    who1: (essence, digNote) => `You are driven by ${essence}${digNote}.`,
    who2: (sign) => `With ${sign} style, your abilities have a unique rhythm,`,
    who3: (house, scene) => `best expressed in House ${house} themes of ${scene}.`,
    talent1: (sign, scene) => `Your core gift: a ${sign} approach in ${scene},`,
    talent2: (role) => `doing what others cannot. At your peak, you are a ${role}.`,
    industry: (a, b, c) => `[Career paths: ${a} / ${b} / ${c}]`,
    key1: (scene) => `Key 1: You must engage in ${scene} — this is your life entry point.`,
    key2: (label, k1, k2, desc) => `Key 2 · ${label}: House 1 → ${k1} → ${k2}. ${desc}.`,
    wealth1: (money, career) => `Primary income from ${money}; career breakthrough in ${career}.`,
    wealth2: (side) => `Secondary gains in ${side}; watch risk boundaries there.`,
    wealth3: (love, marriage) => `In love, ${love} sparks you; best with someone who can ${marriage} with you.`,
    action1: (start, end, ruler) => `You are in your ${ruler} period (ages ${start}–${end}).`,
    action2: (partner, future) => `You need ${partner}. ${future}`,
    action3: (w) => `Core reminder: ${w}.`,
    action4: (essence, scene) =>
      `It's not a lack of ability — you need to apply ${essence} consistently in ${scene}.`,
    houseSuffix: (n) => `House ${n}`,
    archetypeSuffix: " Person",
  },
};

export function getLocalePack(locale: ReportLocale): LocalePack {
  return locale === "en" ? LOCALE_EN : LOCALE_ZH;
}
