import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ageGroupApi, settingsApi } from "@/services/api";
import PrismLandingV3 from "@/components/prism/PrismLandingV3";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import { loadBirthData } from "@/generator/services/reportStore";

const QuizFlow = lazy(() => import("@/components/QuizFlow"));

function ageFromBirthDate(year: number, month: number, day: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
}

export default function Home() {
  const { t } = useTranslation();
  const quizRequested = new URLSearchParams(window.location.search).get("quiz") === "1";
  const birthData = loadBirthData();
  const derivedAge = birthData ? ageFromBirthDate(birthData.year, birthData.month, birthData.day) : null;
  const showLanding = !quizRequested;
  const showQuiz = quizRequested;

  useEffect(() => {
    if (quizRequested && !birthData) window.location.replace("/generator");
  }, [quizRequested, birthData]);

  const { data: ageGroups, isLoading: ageGroupsLoading } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupApi.list,
    enabled: showQuiz,
  });

  const { data: publicSettings } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: settingsApi.getPublic,
  });

  const questionCount = publicSettings?.quizQuestionCount ?? 20;

  const handleStartTest = () => {
    ["life_blueprint_email", "life_blueprint_email_verified", "life_blueprint_contact_id"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    sessionStorage.removeItem("life_blueprint_flow_id");
    window.location.href = "/generator";
  };

  const handleQuizClose = () => {
    window.location.href = "/generator";
  };

  if (showLanding) {
    return <PrismLandingV3 onStart={handleStartTest} questionCount={questionCount} />;
  }

  if (showQuiz && ageGroups && derivedAge != null) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#090611]" aria-label="Loading questions" />}>
        <QuizFlow ageGroups={ageGroups} onClose={handleQuizClose} initialAge={derivedAge} />
      </Suspense>
    );
  }

  return (
    <div className="prism-root min-h-screen relative overflow-hidden">
      <PrismBackground />
      <div className="prism-page min-h-screen">
        {ageGroupsLoading ? (
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--prism-gold)" }} />
        ) : (
          <div className="text-center max-w-[440px]">
            <div className="mx-auto mb-6 prism-fade-in prism-fade-d1">
              <PrismBrandSymbol size={72} />
            </div>
            <div
              className="prism-font-display text-sm font-semibold tracking-[10px] uppercase mb-1 prism-fade-in prism-fade-d1"
              style={{ color: "var(--prism-gold)" }}
            >
              PRISM
            </div>
            <div
              className="prism-font-serif text-[11px] tracking-[5px] mb-10 prism-fade-in prism-fade-d2"
              style={{ color: "rgba(232,185,81,0.45)" }}
            >
              {t("lifeScriptBrand").split("").join(" ")}
            </div>
            <h1
              className="prism-font-serif text-[26px] font-bold leading-relaxed mb-4 prism-fade-in prism-fade-d2"
              style={{ color: "var(--prism-cream)" }}
            >
              {t("prismSoulBlueprintTitle")}
              <br />
              {t("prismSoulBlueprintSuffix")}
              {" "}
              <span style={{ color: "var(--prism-gold)", textShadow: "0 0 30px rgba(232,185,81,0.25)" }}>
                {t("prismSoulBlueprintHighlight")}
              </span>
            </h1>
            <p
              className="text-sm leading-loose mb-12 prism-fade-in prism-fade-d3"
              style={{ color: "rgba(250,246,240,0.5)" }}
            >
              {t("prismHomeSubtitle", { count: questionCount })}
              <br />
              {t("prismHomeSubtitle2")}
            </p>
            <button
              className="prism-btn-gold prism-fade-in prism-fade-d4"
              onClick={() => {
                handleStartTest();
              }}
              disabled={!ageGroups?.length}
            >
              {t("prismStartReading")}
            </button>
            <p className="mt-6 text-xs prism-fade-in prism-fade-d4" style={{ color: "rgba(250,246,240,0.2)" }}>
              {t("quizQuestionCountHint", { count: questionCount })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
