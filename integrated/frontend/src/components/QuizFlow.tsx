import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Check, ChevronRight, Loader2 } from "lucide-react";
import { contactApi, questionApi, settingsApi } from "@/services/api";
import type { QuestionDTO } from "@/types/api";
import {
  FEELING_SCALE_UI,
  getFinishCopy,
  scaleSideKey,
  scaleSideLabel,
  uiText,
} from "@/data/feelingScaleQuestions";
import { saveQuizReport } from "@/lib/quizReport";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import "@/styles/prism.css";

interface AgeGroup {
  id: number;
  name: string;
  minAge: number;
  maxAge: number;
  price: number;
}

interface QuizFlowProps {
  ageGroups: AgeGroup[];
  onClose: () => void;
}

type QuizStep = "age" | "answering" | "result";

interface ScaleQuestion {
  id: number;
  chapter: string;
  title: string;
  left: string;
  right: string;
}

function toScaleQuestion(q: QuestionDTO): ScaleQuestion | null {
  const left = q.options?.find((o) => o.key === "A")?.text?.trim();
  const right = q.options?.find((o) => o.key === "B")?.text?.trim();
  if (!left || !right) return null;
  return {
    id: q.id,
    chapter: q.description || "",
    title: q.title,
    left,
    right,
  };
}

export default function QuizFlow({ ageGroups, onClose }: QuizFlowProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<QuizStep>("age");
  const [userAge, setUserAge] = useState("");
  const [email, setEmail] = useState("");
  const [ageError, setAgeError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [matchedGroup, setMatchedGroup] = useState<AgeGroup | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [slideKey, setSlideKey] = useState(0);
  const [choosing, setChoosing] = useState(false);

  const lang = i18n.language;
  const isZh = lang.toLowerCase().startsWith("zh");

  const { data: publicSettings } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: settingsApi.getPublic,
  });
  const questionLimit = publicSettings?.quizQuestionCount ?? 20;

  const {
    data: fetchedQuestions,
    isLoading: questionsLoading,
    isError: questionsError,
  } = useQuery({
    queryKey: ["questions", matchedGroup?.id, "en", questionLimit],
    queryFn: () => questionApi.list(matchedGroup!.id, "en"),
    enabled: !!matchedGroup && step === "answering",
  });

  const questions = useMemo(() => {
    const list = (fetchedQuestions || [])
      .map(toScaleQuestion)
      .filter((q): q is ScaleQuestion => q != null);
    return list.slice(0, questionLimit);
  }, [fetchedQuestions, questionLimit]);

  const TOTAL = questions.length;

  useEffect(() => {
    setAnswers((prev) => {
      if (TOTAL === 0) return [];
      if (prev.length === TOTAL) return prev;
      return Array(TOTAL).fill(null);
    });
  }, [TOTAL]);

  const submitAnswerMutation = useMutation({
    mutationFn: questionApi.submitAnswer,
  });

  const determineAgeGroup = (age: number): AgeGroup | null => {
    return ageGroups.find((g) => age >= g.minAge && age <= g.maxAge) || null;
  };

  const handleAgeSubmit = async () => {
    const age = parseInt(userAge);
    if (isNaN(age) || age < 0 || age > 120) {
      setAgeError(t("invalidAge"));
      return;
    }
    setAgeError("");
    const group = determineAgeGroup(age);
    if (!group) {
      setAgeError(t("noAgeGroupMatch"));
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setSavingContact(true);
    try {
      const contact = await contactApi.save(normalizedEmail);
      localStorage.setItem("life_blueprint_contact_id", contact.contactId);
      localStorage.setItem("life_blueprint_email", contact.email);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "We could not save your email. Please try again.");
      setSavingContact(false);
      return;
    }
    setSavingContact(false);
    setEmailError("");
    setMatchedGroup(group);
    setStep("answering");
    setCurrentQIndex(0);
    setAnswers([]);
    setSlideKey((k) => k + 1);
  };

  const choose = (value: number) => {
    if (choosing || !questions[currentQIndex]) return;
    setChoosing(true);
    const next = [...answers];
    next[currentQIndex] = value;
    setAnswers(next);
    setTimeout(() => {
      if (currentQIndex < TOTAL - 1) {
        setCurrentQIndex((p) => p + 1);
        setSlideKey((k) => k + 1);
        setChoosing(false);
      } else {
        void finishQuiz(next);
      }
    }, 300);
  };

  const goBack = () => {
    if (currentQIndex === 0 || choosing) return;
    setCurrentQIndex((p) => p - 1);
    setSlideKey((k) => k + 1);
  };

  const finishQuiz = async (finalAnswers: (number | null)[]) => {
    if (!matchedGroup) return;
    const age = parseInt(userAge);

    const reportAnswers = questions.map((q, i) => {
      const score = finalAnswers[i] ?? 4;
      return {
        questionId: q.id,
        title: q.title,
        description: q.chapter,
        selectedKey: `${scaleSideKey(score)}${score}`,
        selectedText: scaleSideLabel(score, q.left, q.right),
      };
    });

    saveQuizReport({
      userAge,
      ageGroupName: matchedGroup.name,
      ageGroupId: matchedGroup.id,
      language: "en",
      answers: reportAnswers,
      completedAt: new Date().toISOString(),
    });

    // Persist scale scores 1–6 to backend
    try {
      for (let i = 0; i < questions.length; i++) {
        const score = finalAnswers[i];
        if (score == null) continue;
        await submitAnswerMutation.mutateAsync({
          questionId: questions[i].id,
          respondentAge: age,
          selectedOption: String(score),
        });
      }
    } catch {
      // Keep local report even if save fails
    }

    setAnswers(finalAnswers);
    setStep("result");
    setChoosing(false);
  };

  const handleContinueToGenerator = () => {
    sessionStorage.setItem("qaTestTaken", "true");
    window.location.href = "/generator";
  };

  const currentQ = questions[currentQIndex];
  const progressPct = TOTAL > 0 ? ((currentQIndex + 1) / TOTAL) * 100 : 0;
  const answeredScores = answers.filter((v): v is number => v != null);
  const leftLean = answeredScores.filter((v) => v <= 3).length;
  const rightLean = answeredScores.filter((v) => v >= 4).length;
  const finishCopy = getFinishCopy(lang, leftLean, rightLean);
  const qNum = String(currentQIndex + 1).padStart(2, "0");
  const finishHint = FEELING_SCALE_UI.finishHint[isZh ? "zh" : "en"](
    TOTAL,
    matchedGroup?.name ?? "",
  );

  return (
    <div className="prism-root fixed inset-0 z-[100] overflow-y-auto">
      <PrismBackground />
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          onClick={onClose}
          className="rounded-full p-2 transition-all hover:rotate-90"
          style={{ color: "rgba(250,246,240,0.5)" }}
          aria-label={t("close", "Close")}
        >
          <X size={20} />
        </button>
      </div>

      {step === "answering" && currentQIndex > 0 && (
        <button
          type="button"
          className="prism-scale-back-fixed"
          onClick={goBack}
          disabled={choosing}
          aria-label={uiText(lang, FEELING_SCALE_UI.backAria)}
        >
          {uiText(lang, FEELING_SCALE_UI.back)}
        </button>
      )}

      {step === "age" && (
        <div className="prism-page min-h-screen">
          <div className="w-full max-w-[400px] text-center">
            <div className="mb-6">
              <PrismBrandSymbol size={56} />
            </div>
            <h2 className="prism-font-serif text-xl font-bold mb-2" style={{ color: "var(--prism-cream)" }}>
              {t("howOldAreYou")}
            </h2>
            <p className="text-sm mb-8" style={{ color: "rgba(250,246,240,0.68)" }}>
              {t("ageHelpText")}
            </p>
            <input
              type="text"
              value={userAge}
              onChange={(e) => {
                setUserAge(e.target.value.replace(/\D/g, "").slice(0, 3));
                setAgeError("");
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t("enterAge")}
              autoFocus
              autoComplete="off"
              className="prism-input text-center text-2xl prism-font-serif mb-4"
            />
            <div className="mb-4 text-left">
              <label className="mb-2 block text-sm" style={{ color: "rgba(250,246,240,0.7)" }} htmlFor="report-email">
                Email address
              </label>
              <input
                id="report-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onKeyDown={(e) => e.key === "Enter" && void handleAgeSubmit()}
                placeholder="you@example.com"
                className="prism-input"
              />
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(250,246,240,0.66)" }}>
                We'll save your email and send your complete paid report when it is ready. No verification code required.
              </p>
            </div>
            {ageError && (
              <p className="mb-4 text-sm" style={{ color: "var(--prism-danger)" }}>
                {ageError}
              </p>
            )}
            {emailError && <p className="mb-4 text-sm" style={{ color: "var(--prism-danger)" }}>{emailError}</p>}
            <button className="prism-btn-gold w-full" onClick={() => void handleAgeSubmit()} disabled={!userAge.trim() || !email.trim() || savingContact}>
              {savingContact ? <Loader2 size={18} className="mx-auto animate-spin" /> : t("continue")}
            </button>
          </div>
        </div>
      )}

      {step === "answering" && matchedGroup && (
        <div className="prism-page min-h-screen !justify-start pt-14 pb-10">
          <div className="w-full max-w-[720px] flex flex-col relative">
            {questionsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={36} className="animate-spin" style={{ color: "var(--prism-gold)" }} />
              </div>
            ) : questionsError || TOTAL === 0 ? (
              <div className="text-center py-16" style={{ color: "rgba(250,246,240,0.55)" }}>
                <p className="mb-4">No bipolar questions found for this age group.</p>
                <p className="mb-6 text-sm" style={{ color: "rgba(250,246,240,0.35)" }}>
                  Add questions with A/B poles in the admin dashboard, then try again.
                </p>
                <button className="prism-btn-gold" onClick={() => setStep("age")}>
                  {t("goBack")}
                </button>
              </div>
            ) : currentQ ? (
              <>
                <div className="prism-scale-progress">
                  <div className="prism-scale-progress-top">
                    <span>
                      {isZh
                        ? FEELING_SCALE_UI.questionLabel.zh(qNum)
                        : FEELING_SCALE_UI.questionLabel.en(qNum)}
                    </span>
                    <strong>
                      {qNum} / {String(TOTAL).padStart(2, "0")}
                    </strong>
                  </div>
                  <div className="prism-scale-progress-line">
                    <i style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div key={`${slideKey}-${currentQ.id}`} className="prism-question-enter">
                  {currentQ.chapter && <div className="prism-scale-chapter">{currentQ.chapter}</div>}
                  <h3 className="prism-scale-question">{currentQ.title}</h3>
                  <p className="prism-scale-prompt">{uiText(lang, FEELING_SCALE_UI.prompt)}</p>
                  {currentQIndex === 0 && (
                    <p className="prism-scale-guide">
                      Choose 1–3 if you are closer to A, or 4–6 if you are closer to B. A number nearer either end means a stronger preference.
                    </p>
                  )}

                  <div className="prism-scale-zone">
                    <div className="prism-scale-poles">
                      <div className="prism-scale-pole">
                        <span className="prism-scale-pole-key">A</span>
                        <span>{currentQ.left}</span>
                      </div>
                      <div className="prism-scale-pole right">
                        <span className="prism-scale-pole-key">B</span>
                        <span>{currentQ.right}</span>
                      </div>
                    </div>

                    <div className="prism-scale-dots" role="group" aria-label={uiText(lang, FEELING_SCALE_UI.scaleAria)}>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`prism-scale-choice${answers[currentQIndex] === n ? " selected" : ""}`}
                          onClick={() => choose(n)}
                          disabled={choosing}
                          aria-label={
                            isZh
                              ? FEELING_SCALE_UI.choiceAria.zh(n, n <= 3)
                              : FEELING_SCALE_UI.choiceAria.en(n, n <= 3)
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="prism-scale-caption">
                      <span>{uiText(lang, FEELING_SCALE_UI.moreLeft)}</span>
                      <span>{uiText(lang, FEELING_SCALE_UI.moreRight)}</span>
                    </div>
                    <p className="prism-scale-honesty">
                      {uiText(lang, FEELING_SCALE_UI.honestyHint)}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {step === "result" && matchedGroup && (
        <div className="prism-page min-h-screen">
          <div className="w-full max-w-[440px] text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(232,185,81,0.12)" }}
            >
              <Check size={28} style={{ color: "var(--prism-gold)" }} />
            </div>
            <h2 className="prism-font-serif text-xl font-bold mb-2 leading-relaxed" style={{ color: "var(--prism-cream)" }}>
              {uiText(lang, FEELING_SCALE_UI.finishTitle1)}
              <br />
              {uiText(lang, FEELING_SCALE_UI.finishTitle2)}
              {" "}
              <span style={{ color: "var(--prism-gold)" }}>{uiText(lang, FEELING_SCALE_UI.finishTitleEm)}</span>
            </h2>
            <div className="prism-finish-card text-left mb-6">
              <p
                className="text-sm leading-loose"
                style={{ color: "rgba(250,246,240,0.7)" }}
                dangerouslySetInnerHTML={{ __html: finishCopy }}
              />
            </div>
            <p
              className="text-sm mb-6 leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(250,246,240,0.45)" }}
            >
              {finishHint}
            </p>
            <button
              className="prism-btn-gold w-full inline-flex items-center justify-center gap-2"
              onClick={handleContinueToGenerator}
            >
              {uiText(lang, FEELING_SCALE_UI.continueBtn)}
              <ChevronRight size={18} />
            </button>
            <p className="mt-4 text-xs" style={{ color: "rgba(250,246,240,0.25)" }}>
              {uiText(lang, FEELING_SCALE_UI.payNote)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
