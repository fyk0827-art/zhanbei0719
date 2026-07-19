// Persistent report storage using localStorage (按报告类型分桶)
import type { ReportTypeId } from "../types/reportTypes";
import type { BirthData } from "./astrologyEngine";

const PREVIEW_PREFIX = "taiji_preview_report_";
const AI_DONE_PREFIX = "taiji_ai_report_done_";
const STORAGE_PREFIX = "taiji_report_text_";
const REPORT_ID_PREFIX = "taiji_report_id_";
const BIRTH_DATA_KEY = "taiji_birth_data";
const LEGACY_KEY = "taiji_report_text";

function storageKey(reportType: ReportTypeId): string {
  return `${STORAGE_PREFIX}${reportType}`;
}

export function savePreviewReportText(text: string, reportType: ReportTypeId = "full"): void {
  try {
    localStorage.setItem(`${PREVIEW_PREFIX}${reportType}`, text);
  } catch {
    // ignore
  }
}

export function loadPreviewReportText(reportType: ReportTypeId = "full"): string {
  try {
    return localStorage.getItem(`${PREVIEW_PREFIX}${reportType}`) || "";
  } catch {
    return "";
  }
}

export function markAiReportDone(reportType: ReportTypeId = "full"): void {
  try {
    localStorage.setItem(`${AI_DONE_PREFIX}${reportType}`, "1");
  } catch {
    // ignore
  }
}

export function isAiReportDone(reportType: ReportTypeId = "full"): boolean {
  try {
    return localStorage.getItem(`${AI_DONE_PREFIX}${reportType}`) === "1";
  } catch {
    return false;
  }
}

export function clearAiReportDone(reportType?: ReportTypeId): void {
  try {
    if (reportType) {
      localStorage.removeItem(`${AI_DONE_PREFIX}${reportType}`);
      localStorage.removeItem(`${PREVIEW_PREFIX}${reportType}`);
      return;
    }
    for (const t of ["simple", "full", "marriage", "career"] as ReportTypeId[]) {
      localStorage.removeItem(`${AI_DONE_PREFIX}${t}`);
      localStorage.removeItem(`${PREVIEW_PREFIX}${t}`);
    }
  } catch {
    // ignore
  }
}

export function saveReportText(text: string, reportType: ReportTypeId = "full"): void {
  try {
    localStorage.setItem(storageKey(reportType), text);
  } catch {
    // localStorage might be unavailable
  }
}

export function loadInitialReportText(reportType: ReportTypeId = "full"): string {
  const preview = loadPreviewReportText(reportType);
  if (preview) return preview;
  if (!isAiReportDone(reportType)) return "";
  return loadReportText(reportType) || "";
}

export function loadReportText(reportType: ReportTypeId = "full"): string {
  try {
    const keyed = localStorage.getItem(storageKey(reportType));
    if (keyed) return keyed;
    if (reportType === "full") return localStorage.getItem(LEGACY_KEY) || "";
    return "";
  } catch {
    return "";
  }
}

export function clearReportText(reportType?: ReportTypeId): void {
  try {
    if (reportType) {
      localStorage.removeItem(storageKey(reportType));
      localStorage.removeItem(`${PREVIEW_PREFIX}${reportType}`);
      sessionStorage.removeItem(`${REPORT_ID_PREFIX}${reportType}`);
      if (reportType === "full") localStorage.removeItem(LEGACY_KEY);
      return;
    }
    for (const t of ["simple", "full", "marriage", "career"] as ReportTypeId[]) {
      localStorage.removeItem(storageKey(t));
      localStorage.removeItem(`${PREVIEW_PREFIX}${t}`);
      localStorage.removeItem(`${AI_DONE_PREFIX}${t}`);
      sessionStorage.removeItem(`${REPORT_ID_PREFIX}${t}`);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

/** 报告 ID 与出生信息绑定，存 sessionStorage（刷新后仍可支付） */
export function saveReportId(reportId: string, reportType: ReportTypeId = "full"): void {
  try {
    sessionStorage.setItem(`${REPORT_ID_PREFIX}${reportType}`, reportId);
  } catch {
    // ignore
  }
}

export function loadReportId(reportType: ReportTypeId = "full"): string | null {
  try {
    return sessionStorage.getItem(`${REPORT_ID_PREFIX}${reportType}`);
  } catch {
    return null;
  }
}

export function saveBirthData(birth: BirthData): void {
  try {
    sessionStorage.setItem(BIRTH_DATA_KEY, JSON.stringify(birth));
  } catch {
    // ignore
  }
}

export function loadBirthData(): BirthData | null {
  try {
    const raw = sessionStorage.getItem(BIRTH_DATA_KEY);
    return raw ? (JSON.parse(raw) as BirthData) : null;
  } catch {
    return null;
  }
}
