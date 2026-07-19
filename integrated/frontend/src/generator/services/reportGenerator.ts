import { getSettings, streamChat } from "./volcEngineApi";
import type { NatalChart } from "./astrologyEngine";
import type { ReportTypeId } from "../types/reportTypes";
import { buildPromptsForReportType, resolveSystemPrompt } from "./reportPrompt";
import { fetchReportPrompts } from "./reportPromptApi";
import { runV2Calculations } from "./v2ScoringEngine";
import { generateBirthReport500 } from "./birthReport500";
import type { ReportLocale } from "./birthReport500Locale";
import { prismPrecompute } from "./prismPrecompute";

/** Overseas build: AI deep reports always use English prompts and output. */
const AI_REPORT_LOCALE: ReportLocale = "en";

export async function generateReportText(
  chart: NatalChart,
  reportType: ReportTypeId,
  onChunk?: (text: string) => void,
  previewReport?: string,
  _lang?: string
): Promise<string> {
  const s = getSettings();
  if (!s.apiKey) throw new Error("未配置 API Key，请先去设置页面配置");

  const pre = prismPrecompute(chart, {
    name: chart.birthData.name,
    gender: chart.birthData.gender,
  });
  console.log("[PRISM] Precompute top1:", pre.top1, pre.identity_display, "luck:", pre.lucky_score);

  // Keep V2 calc for admin/debug parity; English Fangyi prompts use precompute JSON.
  const calcResult = runV2Calculations(chart, AI_REPORT_LOCALE);
  const previewEn = previewReport?.trim()
    ? generateBirthReport500(chart, AI_REPORT_LOCALE)
    : undefined;
  const prompts = buildPromptsForReportType(
    reportType,
    chart,
    calcResult,
    previewEn,
    AI_REPORT_LOCALE,
    pre,
  );
  const dbPrompts = await fetchReportPrompts();
  const sp = resolveSystemPrompt(reportType, dbPrompts.prompts, AI_REPORT_LOCALE);
  const up = prompts.user;
  let received = "";

  for await (const chunk of streamChat(s.apiKey, {
    model: s.model || "deepseek-v4-pro-260425",
    messages: [
      { role: "system" as const, content: sp },
      { role: "user" as const, content: up },
    ],
    max_tokens: s.maxTokens || 8192,
    temperature: s.temperature ?? 0.1,
  })) {
    received += chunk;
    onChunk?.(received);
  }
  return received;
}
