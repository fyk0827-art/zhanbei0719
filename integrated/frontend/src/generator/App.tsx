import "./polyfills";
import "./index.css";
import "@/styles/prism.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useNavigate } from "react-router";
import PrismBackground from "@/components/prism/PrismBackground";
import HomePage from "./pages/HomePage";
import BlueprintReport from "./pages/BlueprintReport";
import { saveReportText, clearReportText, saveReportId, saveBirthData, savePreviewReportText, clearAiReportDone } from "./services/reportStore";
import { computeReportId } from "./services/reportId";
import { getGlobalReportType, setGlobalReportType } from "./services/reportSession";
import type { ReportTypeId } from "./types/reportTypes";
import { saveReportToServer } from "./services/reportApi";
import { bindPrepaidReport, getPrepaidOrderId } from "./services/partnerApi";
import { calculateNatalChart } from "./services/astrologyEngine";
import type { BirthData, NatalChart } from "./services/astrologyEngine";
import { generatorPath } from "./utils/generatorNav";
import { generateBirthReport500 } from "./services/birthReport500";
import { trackPreviewReportViewed } from "@/services/analytics";

let globalChart: NatalChart | null = null;
let globalReportText: string = "";

export function getGlobalChart(): NatalChart | null { return globalChart; }
export function getGlobalReportText(): string { return globalReportText; }
export { getGlobalReportType, setGlobalReportType };
export function setGlobalReportText(text: string, reportType?: ReportTypeId) {
  globalReportText = text;
  saveReportText(text, reportType ?? getGlobalReportType());
}

export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [chart, setChart] = useState<NatalChart | null>(globalChart);
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (chart) globalChart = chart;
  }, [chart]);

  const persistReport = useCallback(async (text: string, activeChart: NatalChart, preview = true) => {
    const reportType = getGlobalReportType();
    globalReportText = text;
    if (preview) {
      savePreviewReportText(text, reportType);
    } else {
      saveReportText(text, reportType);
    }
    const flowId = sessionStorage.getItem("life_blueprint_flow_id") || undefined;
    const reportId = await computeReportId(activeChart.birthData, reportType, flowId);
    saveReportId(reportId, reportType);
    try {
      await saveReportToServer({
        reportId,
        reportText: text,
        chartJson: activeChart,
        displayName: activeChart.birthData.name || undefined,
        reportType,
      });
      const prepaidOrderId = getPrepaidOrderId();
      if (prepaidOrderId) {
        await bindPrepaidReport(prepaidOrderId, reportId);
      }
    } catch (e) {
      console.error("[report] Failed to save the preview for email delivery", e);
      throw new Error("We couldn't save your preview for email delivery. Please try again.");
    }
    return { reportId, reportType };
  }, []);

  const handleGenerate = useCallback(async (birthData: BirthData) => {
    setIsLoading(true);
    setCharCount(0);
    hasNavigated.current = false;
    try {
      const natalChart = await calculateNatalChart(birthData);
      saveBirthData(birthData);
      globalChart = natalChart;
      globalReportText = "";
      clearReportText(getGlobalReportType());
      clearAiReportDone(getGlobalReportType());
      setChart(natalChart);

      const reportType = getGlobalReportType();
      const text = generateBirthReport500(natalChart, i18n.language);
      globalReportText = text;
      savePreviewReportText(text, reportType);
      setCharCount(text.length);
      if (!text.trim()) throw new Error(t("genReportFailed"));

      const { reportId } = await persistReport(text, natalChart);
      trackPreviewReportViewed(reportId, reportType);
      setIsLoading(false);
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate(`${generatorPath("final-report")}?reportType=${encodeURIComponent(reportType)}&reportId=${encodeURIComponent(reportId)}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Error generating report:", error);
      setIsLoading(false);
      alert(t("genReportError", { message: errMsg }));
    }
  }, [navigate, persistReport, t, i18n.language]);

  return (
    <div className="prism-root relative min-h-screen">
      <PrismBackground />
      <div className="relative z-10">
        <Routes>
          <Route index element={<HomePage onGenerate={handleGenerate} isLoading={isLoading} charCount={charCount} />} />
          <Route path="final-report" element={<BlueprintReport chart={chart} />} />
        </Routes>
      </div>
    </div>
  );
}
