import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { PLANET_CHARACTERS, getShowcaseAvatarSrc, type PlanetCharacterMeta } from "@/data/planetCharacters";
import "@/styles/planet-characters.css";

function PlanetCard({ meta }: { meta: PlanetCharacterMeta }) {
  const { t } = useTranslation();

  return (
    <article className="pc-card" style={{ "--pc-accent": meta.accent } as CSSProperties}>
      <header className="pc-card-head">
        <div className="pc-card-visual">
          <img
            src={getShowcaseAvatarSrc(meta.planet, meta.gender)}
            alt={meta.name}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
        <h3 className="pc-card-name">{meta.name}</h3>
      </header>

      <div className="pc-card-sections">
        <section className="pc-block">
          <h4 className="pc-block-label">{t("planetCharLabelPersonality")}</h4>
          <p className="pc-block-text">{meta.copy.personality}</p>
        </section>
        <section className="pc-block">
          <h4 className="pc-block-label">{t("planetCharLabelTraits")}</h4>
          <p className="pc-block-text">{meta.copy.traits}</p>
        </section>
        <section className="pc-block">
          <h4 className="pc-block-label">{t("planetCharLabelStrengths")}</h4>
          <p className="pc-block-text">{meta.copy.strengths}</p>
        </section>
      </div>
    </article>
  );
}

export default function PlanetCharactersSection() {
  const { t } = useTranslation();

  return (
    <section className="pc-section" aria-labelledby="pc-section-title">
      <header className="pc-header">
        <p className="pc-eyebrow">{t("planetCharsEyebrow")}</p>
        <h2 id="pc-section-title" className="pc-title">
          {t("planetCharsTitle")}
        </h2>
        <p className="pc-subtitle">{t("planetCharsSubtitle")}</p>
      </header>

      <div className="pc-list">
        {PLANET_CHARACTERS.map((meta) => (
          <PlanetCard key={meta.planet} meta={meta} />
        ))}
      </div>
    </section>
  );
}
