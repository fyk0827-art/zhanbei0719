import type { NatalChart } from "./astrologyEngine";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface ReportOrderInfo {
  orderId: string;
  reportId: string;
  status: "pending" | "paid" | "closed";
  amount?: number;
  amountYuan?: string;
  title?: string;
  tradeNo?: string;
  payerContact?: string;
  createdAt?: number;
  paidAt?: number;
}

export interface FetchReportResponse {
  reportId: string;
  hasReport: boolean;
  unlocked: boolean;
  paid?: boolean;
  displayName?: string;
  reportText?: string;
  chartJson?: NatalChart;
  orderId?: string;
  paidAt?: number;
  orders?: ReportOrderInfo[];
  paidOrders?: ReportOrderInfo[];
  accessScope?: "PREVIEW" | "FULL";
  generationStatus?: ReportGenerationStatus;
  startedAt?: number;
  completedAt?: number;
}

export type ReportGenerationStatus = "PREVIEW" | "QUEUED" | "GENERATING" | "COMPLETE" | "FAILED";
export interface ReportStatusResponse {
  reportId: string;
  status: ReportGenerationStatus;
  startedAt?: number;
  completedAt?: number;
  attempts?: number;
  error?: string;
  reportText?: string;
  chartJson?: NatalChart;
  displayName?: string;
}

const statusTokenKey = (reportId: string) => `life_blueprint_status_token_${reportId}`;
export function loadReportStatusToken(reportId: string): string {
  try { return localStorage.getItem(statusTokenKey(reportId)) || ""; } catch { return ""; }
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const problem = data as { error?: string; message?: string };
    throw new Error(problem.message || problem.error || `Request failed (${res.status})`);
  }
  return data as T;
}

/** 将报告正文同步到服务器（生成确认后调用） */
export async function saveReportToServer(params: {
  reportId: string;
  reportText: string;
  chartJson?: NatalChart | null;
  displayName?: string;
  /** 后端接入多报告类型后写入 reports.report_type */
  reportType?: string;
}): Promise<{ statusToken: string }> {
  const contactId = sessionStorage.getItem("life_blueprint_contact_id") || "";
  if (!contactId) throw new Error("Please return to your personal details and verify your email first.");
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(params.reportId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportText: params.reportText,
      chartJson: params.chartJson ?? undefined,
      displayName: params.displayName,
      reportType: params.reportType,
      contactId,
      language: "en",
    }),
  });
  const data = await parseJson<{ statusToken: string }>(res);
  localStorage.setItem(statusTokenKey(params.reportId), data.statusToken);
  return data;
}

export async function fetchReportStatus(reportId: string): Promise<ReportStatusResponse> {
  const token = loadReportStatusToken(reportId);
  if (!token) throw new Error("The report status link is missing. Your completed report will still be emailed to you.");
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}/status?statusToken=${encodeURIComponent(token)}`);
  return parseJson(res);
}

export async function fetchReportByAccessToken(token: string): Promise<FetchReportResponse> {
  const res = await fetch(`${API_BASE}/api/report-access/${encodeURIComponent(token)}`);
  return parseJson(res);
}

/** 从服务器拉取报告（已付费时返回全文，可换设备恢复） */
export async function fetchReportFromServer(reportId: string): Promise<FetchReportResponse | null> {
  const token = loadReportStatusToken(reportId);
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}?statusToken=${encodeURIComponent(token)}`);
  if (res.status === 404) {
    return { reportId, hasReport: false, unlocked: false };
  }
  return parseJson(res);
}
