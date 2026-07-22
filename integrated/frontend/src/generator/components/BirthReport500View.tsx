import { useMemo, type ElementType } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Star, Heart, KeyRound, Wallet, Compass,
  Sparkles, Zap, Moon,
} from "lucide-react";
import { useNavigate } from "react-router";
import type { NatalChart } from "../services/astrologyEngine";
import type { ReportTypeId, ReportTypeMeta } from "../types/reportTypes";
import { getPaymentLabels, type PaymentMode } from "../services/paymentApi";
import { ReportIdentitySection } from "./ReportIdentitySection";
import { runV2Calculations } from "../services/v2ScoringEngine";
import { generatorPath } from "../utils/generatorNav";
import { planetLabel, resolveReportLocale, signLabel } from "../services/birthReport500Locale";
import {
  getPlanetAvatarSrc,
  parsePlanetFromCoverText,
  resolvePlanetPersonRole,
} from "../utils/planetAvatar";

const PRIMARY = "#5B3A8C";
const SECONDARY = "#E8C87A";
const DARK = "#2D1B4E";
const LIGHT = "#EDE9FE";
const CARD_BORDER = "#f0e6d3";

const PLANET_ICONS: Record<string, ElementType> = {
  太阳: Star, 月亮: Moon, 水星: Sparkles, 金星: Star, 火星: Zap,
  木星: Sparkles, 土星: Compass, 天王星: Zap, 海王星: Moon, 冥王星: Star,
};

type SectionKind = "who" | "talent" | "keys" | "wealth" | "action" | "other";

function sectionKind(heading: string): SectionKind {
  if (/真正的你|The Real You/i.test(heading)) return "who";
  if (/极致天赋|Core Talent/i.test(heading)) return "talent";
  if (/金钥匙|Golden Keys/i.test(heading)) return "keys";
  if (/财运与关系|Wealth & Relationships/i.test(heading)) return "wealth";
  if (/行动指令|Action Plan/i.test(heading)) return "action";
  return "other";
}

interface Props {
  chart: NatalChart;
  reportText: string;
  reportType: ReportTypeId;
  reportMeta: ReportTypeMeta;
  isUnlocked: boolean;
  paying: boolean;
  payError: string | null;
  wechatHint: string | null;
  isWeChatInApp: boolean;
  paymentMode: PaymentMode | null;
  onPay: () => void;
}

interface ParsedReport {
  roleLabel: string;
  tagline: string;
  whoText: string;
  sections: { heading: string; content: string }[];
  footer: string;
}

function cleanMd(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function parseReport500(text: string, defaultRole: string): ParsedReport {
  const lines = text.split("\n");
  let roleLabel = defaultRole;
  let tagline = "";
  const sections: { heading: string; content: string }[] = [];
  let footer = "";
  let current: { heading: string; content: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      const raw = cleanMd(line.slice(2));
      roleLabel = raw.split("·")[0]?.trim() || roleLabel;
      continue;
    }
    if (line.startsWith("**") && line.includes("|")) {
      tagline = cleanMd(line);
      continue;
    }
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.slice(3).trim(), content: "" };
      continue;
    }
    if (line.startsWith("---")) {
      if (current) sections.push(current);
      current = null;
      continue;
    }
    if (line.startsWith("[") || line.includes("500字极简报告") || line.includes("500-Word Life Script")) {
      footer += (footer ? "\n" : "") + line.trim();
      continue;
    }
    if (!current) continue;
    current.content += (current.content ? "\n" : "") + line;
  }
  if (current) sections.push(current);

  const whoSection = sections.find((s) => sectionKind(s.heading) === "who");
  const whoText = whoSection?.content.trim() ?? "";

  return { roleLabel, tagline, whoText, sections, footer };
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${PRIMARY}15` }}>
        <Icon size={20} style={{ color: PRIMARY }} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-orange-400">{subtitle}</p>
      </div>
    </div>
  );
}

function ReportBody({ text }: { text: string }) {
  if (!text.trim()) return null;
  const paragraphs = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => {
        const isIndustry = p.startsWith("【行业建议") || p.startsWith("[Career paths");
        return (
          <p
            key={i}
            className={`text-sm leading-relaxed ${isIndustry ? "font-semibold px-3 py-2 rounded-lg" : "text-gray-700"}`}
            style={isIndustry ? { background: LIGHT, color: PRIMARY } : undefined}
          >
            {cleanMd(p)}
          </p>
        );
      })}
    </div>
  );
}

export default function BirthReport500View({
  chart,
  reportText,
  reportMeta,
  isUnlocked,
  paying,
  payError,
  wechatHint,
  isWeChatInApp,
  paymentMode,
  onPay,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const paymentLabels = getPaymentLabels(paymentMode);
  const locale = resolveReportLocale(i18n.language);
  const name = chart.birthData.name || t("reportYou");

  const planetLabels: Record<string, string> = {
    太阳: t("reportPlanetPioneer"), 月亮: t("reportPlanetEmpath"), 水星: t("reportPlanetThinker"),
    金星: t("reportPlanetHarmonizer"), 火星: t("reportPlanetActor"), 木星: t("reportPlanetVisionary"),
    土星: t("reportPlanetBuilder"), 天王星: t("reportPlanetDisruptor"), 海王星: t("reportPlanetDreamer"),
    冥王星: t("reportPlanetTransformer"),
  };

  const sectionMeta: Record<SectionKind, { icon: ElementType; title: string; subtitle: string }> = {
    who: { icon: Heart, title: t("reportSectionWho"), subtitle: t("reportSectionWhoSub") },
    talent: { icon: Star, title: t("reportSectionTalent"), subtitle: t("reportSectionTalentSub") },
    keys: { icon: KeyRound, title: t("reportSectionKeys"), subtitle: t("reportSectionKeysSub") },
    wealth: { icon: Wallet, title: t("reportSectionWealth"), subtitle: t("reportSectionWealthSub") },
    action: { icon: Compass, title: t("reportSectionAction"), subtitle: t("reportSectionActionSub") },
    other: { icon: Compass, title: "", subtitle: "" },
  };

  const parsed = useMemo(
    () => parseReport500(reportText, t("reportExplorer")),
    [reportText, t],
  );

  const calc = useMemo(() => {
    try {
      return runV2Calculations(chart, locale);
    } catch (err) {
      console.error("[BirthReport500View] calc failed:", err);
      return null;
    }
  }, [chart]);

  const profiles = useMemo(() => {
    if (!calc) return [];
    return calc.sortedPlanets.slice(0, 3).map((p, i) => {
      const pd = chart.planets.find((pl) => pl.name === p.name);
      const colors = [PRIMARY, "#7C4FB8", "#A78BDB"];
      const displayName = planetLabel(p.name, locale);
      const houseLabel = locale === "en"
        ? `House ${pd?.house ?? 0}`
        : `${pd?.house ?? 0}宫`;
      return {
        Icon: PLANET_ICONS[p.name] || Star,
        name: displayName,
        score: p.score,
        label: planetLabels[p.name] || t("reportExplorer"),
        color: colors[i] || PRIMARY,
        value: pd ? `${signLabel(pd.sign.replace(/座$/, ""), locale)} ${houseLabel}` : "",
      };
    });
  }, [calc, chart, locale, planetLabels, t]);

  if (!calc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "#0D1B2A", color: "#9CA3AF" }}>
        <p>{t("genCalculatingChart")}</p>
      </div>
    );
  }

  const scoreSuffix = t("reportScoreSuffix");
  const taglineDisplay = parsed.tagline
    || profiles.map((p) => `${p.name} ${p.score}${scoreSuffix}`).join(" · ");

  const dp = calc.dominantPlanet;
  const coverPlanet = parsePlanetFromCoverText(reportText, locale);
  const identityPlanet = coverPlanet ?? dp;
  const avatarSrc = getPlanetAvatarSrc(identityPlanet, chart.birthData);

  const roleFromPlanet = resolvePlanetPersonRole(identityPlanet, locale);
  const roleDisplay = locale === "zh" && parsed.roleLabel.endsWith("人")
    ? parsed.roleLabel
    : parsed.roleLabel.match(/人$|Person$/i)
      ? parsed.roleLabel
      : roleFromPlanet;

  return (
    <div className="min-h-screen pb-28" style={{ background: "#0D1B2A" }}>
      <div className="relative w-full overflow-hidden" style={{ background: DARK }}>
        <img src="/images/cover_ping.jpg" alt="" className="w-full h-56 object-cover opacity-90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-white/70 mb-2">500-Word Life Script</p>
          <h1 className="text-2xl font-bold text-center mb-2 text-white leading-snug">
            {name} · {roleDisplay}
          </h1>
          <p className="text-xs text-white/60 mb-3">{t("report500Preview")}</p>
          <div className="w-16 h-0.5 mb-3" style={{ background: SECONDARY }} />
          <div className="flex flex-wrap justify-center gap-3 text-sm text-white/80">
            {profiles.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                <p.Icon size={14} /> {p.name} {p.score}{scoreSuffix}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(generatorPath())}
          className="absolute top-4 left-4 p-2 rounded-full flex items-center gap-1"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 20 }}
        >
          <ArrowLeft size={16} /><span className="text-xs">{t("reportBack")}</span>
        </button>
      </div>

      <ReportIdentitySection
        roleLabel={roleDisplay}
        tagline={taglineDisplay}
        description={parsed.whoText}
        avatarSrc={avatarSrc}
        badges={profiles.map((p) => ({
          icon: p.Icon,
          label: `${p.name}${t("reportPlanetStar")}`,
          value: p.value || p.label,
          score: `${p.score}${scoreSuffix}`,
          color: p.color,
        }))}
      />

      {parsed.sections.map((section) => {
        const kind = sectionKind(section.heading);
        if (kind === "who") return null;
        const meta = sectionMeta[kind];
        const displayTitle = meta.title || section.heading;
        const isAction = kind === "action";
        return (
          <section key={section.heading} className="py-5 px-6 max-w-[414px] mx-auto">
            <SectionTitle icon={meta.icon} title={displayTitle} subtitle={meta.subtitle} />
            {isAction ? (
              <div
                className="rounded-2xl p-5 shadow-xl overflow-hidden relative border"
                style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)`, borderColor: `${SECONDARY}40` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/3 translate-x-1/3" style={{ background: PRIMARY, opacity: 0.08 }} />
                <div className="relative text-sm text-white/85 leading-relaxed space-y-2">
                  {section.content.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i}>{cleanMd(line)}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4 border shadow-sm bg-white" style={{ borderColor: CARD_BORDER }}>
                <ReportBody text={section.content} />
              </div>
            )}
          </section>
        );
      })}

      {!isUnlocked && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <div
            className="rounded-2xl p-5 border-2 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)`, borderColor: SECONDARY }}
          >
            <div className="absolute top-0 right-0 w-36 h-36 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ background: SECONDARY }} />
            <div className="relative">
              <h3 className="text-base font-bold text-white mb-2">{t("reportUnlockTitle")}</h3>
              <p className="text-sm text-white/75 mb-3 leading-relaxed">{t("reportUnlockDesc")}</p>
              <ul className="space-y-1.5 mb-4">
                {[t("reportUnlockFeature1"), t("reportUnlockFeature2"), t("reportUnlockFeature3")].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/85">
                    <Star size={12} className="text-amber-300 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {isWeChatInApp && paymentMode === "alipay" && (
                <p className="text-xs text-amber-200 mb-2">{t("reportWechatPayHint")}</p>
              )}
              {wechatHint && <p className="text-xs text-amber-200 mb-2">{wechatHint}</p>}
              {payError && <p className="text-xs text-red-300 mb-2">{payError}</p>}
            </div>
          </div>
        </section>
      )}

      {parsed.footer && (
        <p className="text-center text-[10px] text-white/40 px-6 pb-4 max-w-[414px] mx-auto">
          {cleanMd(parsed.footer)}
        </p>
      )}

      {!isUnlocked && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 max-w-[414px] mx-auto"
          style={{ background: "linear-gradient(transparent, #0D1B2A 40%)" }}
        >
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            className="w-full py-3.5 rounded-full font-bold text-white shadow-lg disabled:opacity-60"
            style={{ background: paymentLabels.buttonColor }}
          >
            {paying
              ? paymentLabels.paying
              : reportMeta.priceYuan
                ? `${paymentLabels.button} · $${reportMeta.priceYuan}`
                : paymentLabels.button}
          </button>
          <p className="text-[10px] text-white/45 text-center mt-2">{t("reportPreviewFree")}</p>
        </div>
      )}
    </div>
  );
}
