import { useTranslation } from "react-i18next";
import { DEEP_REPORT_MODULE_COUNT, INTERPRETER_QR_IMAGE } from "../config/reportCta";

interface Props {
  moduleCount?: number;
}

export function ReportDeepReadingCTA({ moduleCount = DEEP_REPORT_MODULE_COUNT }: Props) {
  const { t } = useTranslation();

  return (
    <section className="px-6 py-8 max-w-[414px] mx-auto no-print">
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-9 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(27,42,74,0.92) 0%, rgba(13,27,42,0.98) 100%)",
          border: "1px solid rgba(232,185,81,0.14)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(232,185,81,0.5) 0%, transparent 100%)," +
              "radial-gradient(1px 1px at 80% 20%, rgba(232,185,81,0.35) 0%, transparent 100%)," +
              "radial-gradient(1px 1px at 60% 80%, rgba(232,185,81,0.3) 0%, transparent 100%)",
          }}
        />
        <div className="relative">
          <p
            className="prism-font-display text-[10px] font-semibold tracking-[0.4em] uppercase mb-5"
            style={{ color: "var(--prism-gold)" }}
          >
            {t("deepReadingBadge")}
          </p>
          <h3 className="prism-font-serif text-[17px] font-bold leading-relaxed" style={{ color: "var(--prism-cream)" }}>
            {t("deepReadingTitle1")}
          </h3>
          <h3 className="prism-font-serif text-[22px] font-bold mb-4" style={{ color: "var(--prism-gold)" }}>
            {t("deepReadingTitle2")}
          </h3>
          <p className="text-[12px] leading-relaxed mb-1" style={{ color: "rgba(250,246,240,0.42)" }}>
            {t("deepReadingDesc1")}
          </p>
          <p className="text-[12px] leading-relaxed mb-7" style={{ color: "rgba(250,246,240,0.42)" }}>
            {t("deepReadingDesc2")}
          </p>
          <div className="inline-block rounded-2xl bg-white p-3 mb-5 shadow-lg">
            <img
              src={INTERPRETER_QR_IMAGE}
              alt={t("deepReadingQrAlt")}
              className="w-[168px] h-[168px] object-contain"
              loading="lazy"
            />
          </div>
          <p className="text-[14px] font-medium mb-2" style={{ color: "var(--prism-gold)" }}>
            {t("deepReadingQrHint")}
          </p>
          <p className="text-[11px] tracking-wide" style={{ color: "rgba(250,246,240,0.32)" }}>
            {t("deepReadingUnlock", { count: moduleCount })}
          </p>
        </div>
      </div>
    </section>
  );
}
