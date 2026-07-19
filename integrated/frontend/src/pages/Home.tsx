import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ageGroupApi, settingsApi } from "@/services/api";
import QuizFlow from "@/components/QuizFlow";
import PrismLandingV3 from "@/components/prism/PrismLandingV3";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import "@/styles/prism.css";

export default function Home() {
  const { t } = useTranslation();
  const [showLanding, setShowLanding] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: ageGroups, isLoading: ageGroupsLoading } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupApi.list,
  });

  const { data: publicSettings } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: settingsApi.getPublic,
  });

  const questionCount = publicSettings?.quizQuestionCount ?? 20;

  const handleStartTest = () => {
    setShowLanding(false);
    setShowQuiz(true);
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    sessionStorage.setItem("qaTestTaken", "true");
  };

  if (showLanding) {
    return <PrismLandingV3 onStart={handleStartTest} questionCount={questionCount} />;
  }

  if (showQuiz && ageGroups) {
    return <QuizFlow ageGroups={ageGroups} onClose={handleQuizClose} />;
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
                setShowLanding(false);
                setShowQuiz(true);
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
