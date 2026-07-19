/** 报告产品线（与 reportId 哈希、订单解锁一一对应） */
export type ReportTypeId = "simple" | "full" | "marriage" | "career";

export interface ReportTypeMeta {
  id: ReportTypeId;
  name: string;
  subtitle: string;
  wordCount: string;
  /** 是否可进入生成流程 */
  available: boolean;
  /** 展示用参考价（实际金额由后端订单决定） */
  priceYuan: string;
  /** 匹配 Markdown ## 标题，用于判定付费区块 */
  premiumKeywords: string[];
  paywallTitle: string;
  paywallItems: string[];
}

export const REPORT_TYPES: ReportTypeMeta[] = [
  {
    id: "simple",
    name: "Lite Life Script",
    subtitle: "Core portrait at a glance",
    wordCount: "~1,000 words",
    available: true,
    priceYuan: "19.90",
    // Keep CN keywords so heading match still works on bilingual report content
    premiumKeywords: ["人生各领域", "总结", "Life Domains", "Summary"],
    paywallTitle: "Unlock Full Lite Report",
    paywallItems: [
      "Eight life domains — flying-star highlights (lite)",
      "Summary & this month's action plan",
    ],
  },
  {
    id: "full",
    name: "Complete Life Script",
    subtitle: "Action blueprint · timeline & pitfalls",
    wordCount: "~3,500–4,500 words",
    available: true,
    priceYuan: "29.90",
    premiumKeywords: ["人生脉络", "环境与贵人", "避坑", "总结", "Life Timeline", "Environment", "Pitfall", "Summary"],
    paywallTitle: "Unlock Complete Action Blueprint",
    paywallItems: [
      "Life trajectory suggestions (staged growth paths)",
      "Environment & benefactors (wealth boosters / must avoid)",
      "Pitfall guide (people / events / environment)",
      "Summary & action directives",
    ],
  },
  {
    id: "marriage",
    name: "Marriage Edition",
    subtitle: "Love patterns · true-match navigation · repair",
    wordCount: "~3,000–3,500 words",
    available: true,
    priceYuan: "39.90",
    premiumKeywords: ["正缘", "关系痛点", "关系修复", "行动指令", "True Match", "Relationship", "Action"],
    paywallTitle: "Unlock Full Marriage Report",
    paywallItems: [
      "True-match navigation (places · signs · timing windows)",
      "Relationship pain points (patterns + scripts)",
      "Repair & upkeep (3 hard rules)",
      "Action plan (this-week checklist + timeline)",
    ],
  },
  {
    id: "career",
    name: "Career Edition",
    subtitle: "Career track · wealth rhythm · breakthroughs",
    wordCount: "~3,000–3,500 words",
    available: true,
    priceYuan: "39.90",
    premiumKeywords: ["事业卡点", "突破策略", "创业还是打工", "行动指令", "Career", "Breakthrough", "Action"],
    paywallTitle: "Unlock Full Career Report",
    paywallItems: [
      "Career bottlenecks (patterns + concrete moves)",
      "Breakthrough strategy (accelerators + wealth moat)",
      "Startup vs employment (with conditions)",
      "Action plan (this-week checklist + career timeline)",
    ],
  },
];

export function getReportTypeMeta(id: ReportTypeId): ReportTypeMeta {
  return REPORT_TYPES.find((t) => t.id === id) ?? REPORT_TYPES[1];
}

export function isReportTypeId(v: string | null | undefined): v is ReportTypeId {
  return v === "simple" || v === "full" || v === "marriage" || v === "career";
}

export function parseReportTypeId(v: string | null | undefined): ReportTypeId {
  return isReportTypeId(v) ? v : "full";
}
