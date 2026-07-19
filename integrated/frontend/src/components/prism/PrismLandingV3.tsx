import { useTranslation } from "react-i18next";
import PlanetCharactersSection from "@/components/PlanetCharactersSection";
import "@/styles/prism-landing-v3.css";

interface PrismLandingV3Props {
  onStart: () => void;
  questionCount?: number;
}

export default function PrismLandingV3({ onStart, questionCount = 20 }: PrismLandingV3Props) {
  const { t } = useTranslation();

  return (
    <div className="prism-landing-v3-wrap">
      <div className="prism-landing-v3">
        <section className="v3-hero">
          <div className="v3-brand">
            <span className="v3-brand-en">{t("landingBrandEn")}</span>
            <span className="v3-brand-zh">{t("lifeScriptBrand")}</span>
          </div>

          <div className="v3-hero-watermark" aria-hidden>
            LIFE
            <br />
            SCRIPT
          </div>

          <div className="v3-hero-inner">
            <div className="v3-hero-visual">
              <div className="v3-texture" aria-hidden />
              <div className="v3-portrait">
                <img src="/images/luodao-halfbody-v2.png" alt={t("landingExpertName")} />
              </div>
            </div>

            <div className="v3-hero-info">
              <h1 className="v3-name">{t("landingExpertName")}</h1>
              <p className="v3-title">{t("landingExpertTitle")}</p>
              <div className="v3-credentials">
                <span>{t("landingCred1")}</span>
                <span className="v3-sep" aria-hidden />
                <span>{t("landingCred2")}</span>
              </div>
            </div>
          </div>

          <div className="v3-diagonal" aria-hidden />
        </section>

        <div className="v3-main">
          <section className="v3-content">
            <p className="v3-line">
              {t("landingLine1Prefix")}
              <span className="v3-gold">{t("landingLine1Highlight")}</span>
              {t("landingLine1Suffix")}
            </p>
            <p className="v3-line">{t("landingLine2")}</p>
            <p className="v3-sage">
              <span className="v3-gold">{t("landingSageName")}</span>
              <span className="v3-sage-era">{t("landingSageEra")}</span>
            </p>
            <p className="v3-line">{t("landingLine3", { count: questionCount })}</p>
            <p className="v3-line">{t("landingLine4")}</p>
            <h2 className="v3-script-title">&ldquo;{t("landingScriptTitle")}&rdquo;</h2>
            <p className="v3-footnote">{t("landingFootnote")}</p>
          </section>

          <section className="v3-cta">
            <button type="button" className="v3-start-btn" onClick={onStart}>
              <svg className="v3-orbit" viewBox="0 0 200 200" fill="none" aria-hidden>
                <circle cx="100" cy="100" r="92" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
                <circle cx="100" cy="100" r="78" stroke="rgba(232,194,126,0.18)" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="64" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
                <circle cx="100" cy="8" r="2.5" fill="rgba(232,194,126,0.7)" />
                <circle cx="178" cy="100" r="2" fill="rgba(255,255,255,0.5)" />
                <circle cx="22" cy="100" r="1.8" fill="rgba(232,194,126,0.45)" />
                <circle cx="100" cy="192" r="1.5" fill="rgba(255,255,255,0.35)" />
                <circle cx="155" cy="36" r="1.5" fill="rgba(255,255,255,0.4)" />
                <circle cx="45" cy="164" r="1.5" fill="rgba(232,194,126,0.35)" />
              </svg>
              <span className="v3-start-label">{t("landingStartTest")}</span>
            </button>
            <p className="v3-hint">{t("landingHint")}</p>
          </section>
        </div>

        <div className="v3-planets">
          <PlanetCharactersSection />
        </div>
      </div>
    </div>
  );
}
