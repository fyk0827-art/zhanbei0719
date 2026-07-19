/** Feeling-scale quiz (20 core items) — 6-point bipolar A/B scale */

export interface FeelingScaleQuestion {
  id: number;
  chapter: string;
  title: string;
  left: string;
  right: string;
}

type LocaleText = { zh: string; en: string };

interface FeelingScaleQuestionSource {
  id: number;
  chapter: LocaleText;
  title: LocaleText;
  left: LocaleText;
  right: LocaleText;
}

const CHAPTERS: LocaleText[] = [
  { zh: "Ⅰ · 和世界打交道", en: "I · How you meet the world" },
  { zh: "Ⅱ · 能力被看见", en: "II · Being seen for what you can do" },
  { zh: "Ⅲ · 事业与价值", en: "III · Work and worth" },
  { zh: "Ⅳ · 关系与自己", en: "IV · Relationships and yourself" },
];

const SOURCES: FeelingScaleQuestionSource[] = [
  {
    id: 1,
    chapter: CHAPTERS[0],
    title: { zh: "进入一个陌生环境时，你通常更像：", en: "When you walk into a new environment, you are usually more like:" },
    left: { zh: "先观察气氛，等感觉对了再靠近", en: "Watch the room first, then move closer when it feels right" },
    right: { zh: "先抛出话题，让气氛动起来", en: "Start a conversation and get the energy moving" },
  },
  {
    id: 2,
    chapter: CHAPTERS[0],
    title: { zh: "别人讲一件复杂的事时，你更容易先抓住：", en: "When someone tells you something complicated, you first catch:" },
    left: { zh: "他到底是什么感受", en: "What they are actually feeling" },
    right: { zh: "这件事背后的逻辑和重点", en: "The logic and key points behind it" },
  },
  {
    id: 3,
    chapter: CHAPTERS[0],
    title: { zh: "遇到一件拿不准的事，你通常：", en: "When you are unsure about something, you usually:" },
    left: { zh: "先在心里转很久，等确定了再动", en: "Turn it over in your mind until you feel sure, then act" },
    right: { zh: "先做一点，在行动里慢慢找答案", en: "Do a little first and find the answer while moving" },
  },
  {
    id: 4,
    chapter: CHAPTERS[0],
    title: { zh: "你更习惯让别人看到你：", en: "You are more used to letting people see you as:" },
    left: { zh: "可靠、稳得住、不会出错的一面", en: "Reliable, steady, someone who doesn't slip up" },
    right: { zh: "有趣、有想法、不太一样的一面", en: "Interesting, full of ideas, a little different" },
  },
  {
    id: 5,
    chapter: CHAPTERS[0],
    title: { zh: "你更相信一件事的价值来自：", en: "You believe something's value comes more from:" },
    left: { zh: "它经得起时间、现实和结果的检验", en: "Whether it holds up under time, reality, and results" },
    right: { zh: "它能不能让我真正兴奋、感觉活着", en: "Whether it makes you truly excited and feel alive" },
  },
  {
    id: 6,
    chapter: CHAPTERS[1],
    title: { zh: "别人来找你时，你更常做的是：", en: "When someone comes to you, you more often:" },
    left: { zh: "听他说，帮他把情绪接住", en: "Listen and hold their feelings with them" },
    right: { zh: "替他理顺，帮他找到下一步", en: "Help them sort it out and find the next step" },
  },
  {
    id: 7,
    chapter: CHAPTERS[1],
    title: { zh: "面对一个乱糟糟的局面，你第一反应更像：", en: "Facing a messy situation, your first move is more like:" },
    left: { zh: "先把人和关系安顿好", en: "Settle the people and relationships first" },
    right: { zh: "先把规则、顺序和重点理出来", en: "Sort out the rules, order, and priorities first" },
  },
  {
    id: 8,
    chapter: CHAPTERS[1],
    title: { zh: "当你做了很多却没有被看见时，你更像：", en: "When you've done a lot but no one notices, you are more like:" },
    left: { zh: "继续把事情做好，希望总有一天有人懂", en: "Keep doing it well, hoping someone will get it someday" },
    right: { zh: "会想办法让自己的价值被看见、被说清", en: "Find a way to make your value visible and clear" },
  },
  {
    id: 9,
    chapter: CHAPTERS[1],
    title: { zh: "当别人不同意你时，你更像：", en: "When someone disagrees with you, you are more like:" },
    left: { zh: "先想想是不是自己哪里没说清楚", en: "Wonder first whether you didn't explain it clearly" },
    right: { zh: "先确认对方到底有没有认真听懂我的意思", en: "Check first whether they actually listened and understood" },
  },
  {
    id: 10,
    chapter: CHAPTERS[1],
    title: { zh: "当你已经很累时，你更像：", en: "When you are already exhausted, you are more like:" },
    left: { zh: "先把事情做完，自己的情绪以后再说", en: "Finish the work first; your feelings can wait" },
    right: { zh: "会承认自己撑不住，给自己留一点空间", en: "Admit you can't hold it and leave yourself some space" },
  },
  {
    id: 11,
    chapter: CHAPTERS[2],
    title: { zh: "对你来说，一份好工作更像：", en: "For you, a good job feels more like:" },
    left: { zh: "有稳定规则和可预期的安全感", en: "Stable rules and predictable security" },
    right: { zh: "有足够空间，能做出属于自己的东西", en: "Enough room to make something that is yours" },
  },
  {
    id: 12,
    chapter: CHAPTERS[2],
    title: { zh: "当你想给自己定一个价格时，你更容易：", en: "When you set a price for yourself, you more easily:" },
    left: { zh: "先想别人会不会觉得贵、不愿意付", en: "Worry others will find it expensive and refuse to pay" },
    right: { zh: "先想我的价值和交付到底值多少", en: "Ask what your value and delivery are actually worth" },
  },
  {
    id: 13,
    chapter: CHAPTERS[2],
    title: { zh: "面对一个不再适合自己的环境时，你更像：", en: "In an environment that no longer fits you, you are more like:" },
    left: { zh: "先撑着，至少现在还算安全", en: "Hold on for now, at least it still feels safe" },
    right: { zh: "宁愿重新开始，也不想一直消耗自己", en: "Rather start over than keep draining yourself" },
  },
  {
    id: 14,
    chapter: CHAPTERS[2],
    title: { zh: "当你想争取一个机会时，你更像：", en: "When you want an opportunity, you are more like:" },
    left: { zh: "希望别人先看见我，再来选择我", en: "Hoping others notice you first, then choose you" },
    right: { zh: "会主动表达：这个机会，我想要", en: "Saying it out loud: I want this chance" },
  },
  {
    id: 15,
    chapter: CHAPTERS[2],
    title: { zh: "当钱和关系碰在一起时，你更像：", en: "When money and relationships collide, you are more like:" },
    left: { zh: "宁可自己吃一点亏，也不想把关系弄得难看", en: "Take a small loss yourself rather than make the relationship ugly" },
    right: { zh: "觉得越是亲近，越要把规则和钱讲清楚", en: "Believe the closer you are, the clearer rules and money should be" },
  },
  {
    id: 16,
    chapter: CHAPTERS[3],
    title: { zh: "当你有一个真实需求时，你更像：", en: "When you have a real need, you are more like:" },
    left: { zh: "先想想说出来会不会给别人添麻烦", en: "Wondering if saying it will trouble someone else" },
    right: { zh: "觉得需要被说出来，别人才可能真正理解我", en: "Believing it has to be spoken for anyone to truly understand you" },
  },
  {
    id: 17,
    chapter: CHAPTERS[3],
    title: { zh: "当一段关系开始让你不舒服时，你更像：", en: "When a relationship starts to feel off, you are more like:" },
    left: { zh: "先调整自己，希望关系还能好一点", en: "Adjust yourself first, hoping things can still improve" },
    right: { zh: "先确认这段关系有没有在尊重我", en: "Check first whether this relationship is respecting you" },
  },
  {
    id: 18,
    chapter: CHAPTERS[3],
    title: { zh: "当你委屈时，你更像：", en: "When you feel wronged, you are more like:" },
    left: { zh: "先忍住，怕说出来气氛就变了", en: "Hold it in, afraid saying it will change the mood" },
    right: { zh: "会想说清楚，哪怕过程有一点难受", en: "Want to say it clearly, even if it feels a bit hard" },
  },
  {
    id: 19,
    chapter: CHAPTERS[3],
    title: { zh: "当你想做一件真正属于自己的事时，你更像：", en: "When you want to do something truly yours, you are more like:" },
    left: { zh: "先把所有人的需要安顿好，再轮到自己", en: "Settle everyone else's needs first, then yourself" },
    right: { zh: "会先给自己留一个位置，不想再一直往后排", en: "Save yourself a place first, and stop always going last" },
  },
  {
    id: 20,
    chapter: CHAPTERS[3],
    title: { zh: "当你出现负面情绪时，你更像：", en: "When negative feelings show up, you are more like:" },
    left: { zh: "先压住，怕自己一表达就会失控", en: "Push them down, afraid expressing them means losing control" },
    right: { zh: "愿意让情绪出来，我相信它有自己的原因", en: "Let them out, trusting they have a reason of their own" },
  },
];

function pickLang(lang?: string): "zh" | "en" {
  const code = (lang || "en").toLowerCase();
  return code.startsWith("zh") ? "zh" : "en";
}

export function getFeelingScaleQuestions(lang?: string): FeelingScaleQuestion[] {
  const l = pickLang(lang);
  return SOURCES.map((q) => ({
    id: q.id,
    chapter: q.chapter[l],
    title: q.title[l],
    left: q.left[l],
    right: q.right[l],
  }));
}

/** @deprecated Prefer getFeelingScaleQuestions(lang) */
export const FEELING_SCALE_QUESTIONS = getFeelingScaleQuestions("zh");

export const FEELING_SCALE_UI = {
  prompt: {
    zh: "别选你希望自己成为的，选你最近更像哪一边。",
    en: "Don't pick who you wish you were. Pick the side you've been more like lately.",
  },
  moreLeft: { zh: "1 = 明显更像 A", en: "1 = Strongly A" },
  moreRight: { zh: "6 = 明显更像 B", en: "6 = Strongly B" },
  // 答题区底部诚实作答提示，风格对齐上方 prompt
  honestyHint: {
    zh: "请诚实地作答，想象自己处于放松、不受外界压力影响的状态。不确定时，跟随第一直觉。",
    en: "Answer honestly as you imagine a relaxed state free from external pressure. Go with your first instinct whenever you're unsure about anything.",
  },
  back: { zh: "← 上一题", en: "← Back" },
  backAria: { zh: "返回上一题", en: "Previous question" },
  questionLabel: {
    zh: (n: string) => `第 ${n} 题`,
    en: (n: string) => `Q ${n}`,
  },
  scaleAria: { zh: "六级倾向选择", en: "Six-point preference scale" },
  choiceAria: {
    zh: (n: number, left: boolean) => `选择 ${n}，${left ? "更偏向左边" : "更偏向右边"}`,
    en: (n: number, left: boolean) => `Choose ${n}, ${left ? "lean left" : "lean right"}`,
  },
  finishTitle1: { zh: "你不是矛盾", en: "You are not a contradiction" },
  finishTitle2: { zh: "你只是有两种力量一直在", en: "You just have two forces that keep" },
  finishTitleEm: { zh: "拉扯", en: "pulling" },
  finishLeft:
    "Your answers lean toward <strong>putting relationships first, staying steady, and keeping feelings to yourself</strong>. That isn't weakness. You learned early how to keep things from falling apart. Your life script will help you find security without giving yourself away.",
  finishLeftZh:
    "你的选择更常偏向<strong>先照顾关系、先维持稳定、把情绪留给自己</strong>。这不是软弱，而是你很早就学会了怎样让局面不要失控。接下来的人生剧本，会替你找到：不牺牲自己，也能获得安全感的方式。",
  finishRight:
    "Your answers lean toward <strong>speaking up, reaching for things, and pushing forward</strong>. You don't lack ignition. What you need is clarity on what deserves your energy, and a structure that can hold your ambition.",
  finishRightZh:
    "你的选择更常偏向<strong>表达自己、主动争取、把路走出去</strong>。你不缺启动的力量，真正要找到的是：什么值得你持续投入，以及怎样让你的野心有一套稳得住的结构。",
  finishMixed:
    "Your answers don't sit on one side only. You need <strong>stability and being understood</strong>, and you also refuse to live as only the safe, agreeable one. You've been balancing two forces. Your birth chart will show which one is your true main engine.",
  finishMixedZh:
    "你的选择没有落在单独的一端。你既需要<strong>稳定和被理解</strong>，又不甘心只活成一个安全、懂事的人。你一直在两种力量之间找平衡，而你的出生星图会告诉你：哪一种才是你真正该优先使用的主引擎。",
  finishHint: {
    zh: (total: number, group: string) =>
      `已完成 ${total} 题感觉校准 · ${group}\n接下来填写出生信息，把选择与星图放在一起。`,
    en: (total: number, group: string) =>
      `Completed ${total} feeling calibrations · ${group}\nNext, enter your birth details and place your answers beside your chart.`,
  },
  continueBtn: { zh: "生成人生剧本", en: "Generate your life script" },
  payNote: {
    zh: "完整报告需要支付后生成",
    en: "Payment is only required to generate the complete report",
  },
} as const;

export function uiText(lang: string | undefined, pair: LocaleText): string {
  return pair[pickLang(lang)];
}

/** 1–3 lean left (A), 4–6 lean right (B) */
export function scaleSideLabel(value: number, left: string, right: string): string {
  return value <= 3 ? left : right;
}

export function scaleSideKey(value: number): "A" | "B" {
  return value <= 3 ? "A" : "B";
}

export function getFinishCopy(lang: string | undefined, leftLean: number, rightLean: number): string {
  const l = pickLang(lang);
  if (leftLean >= 14) return l === "zh" ? FEELING_SCALE_UI.finishLeftZh : FEELING_SCALE_UI.finishLeft;
  if (rightLean >= 14) return l === "zh" ? FEELING_SCALE_UI.finishRightZh : FEELING_SCALE_UI.finishRight;
  return l === "zh" ? FEELING_SCALE_UI.finishMixedZh : FEELING_SCALE_UI.finishMixed;
}
