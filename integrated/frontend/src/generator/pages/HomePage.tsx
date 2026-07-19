import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import type { BirthData } from "../services/astrologyEngine";
import { setGlobalReportType } from "../services/reportSession";
import { fetchPartnerOrder, setPrepaidOrderId } from "../services/partnerApi";
import { type GeoLocation } from "../services/locationApi";
import BirthDatePicker from "../components/BirthDatePicker";
import LocationPicker from "../components/LocationPicker";
import PlanetCharactersSection from "@/components/PlanetCharactersSection";
import "@/styles/prism.css";

interface Props {
  onGenerate: (data: BirthData) => void;
  isLoading: boolean;
  charCount?: number;
}

export default function HomePage({ onGenerate, isLoading, charCount = 0 }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [prepaidBanner, setPrepaidBanner] = useState<string | null>(null);
  const [prepaidError, setPrepaidError] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [gender, setGender] = useState<"female" | "male">("female");
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [customTz, setCustomTz] = useState("8");
  const [useCustomCoords, setUseCustomCoords] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) return;
    setPrepaidOrderId(orderId);
    fetchPartnerOrder(orderId)
      .then((order) => {
        if (order.prepaid && order.reportPending) {
          setPrepaidBanner(t("genPrepaidBanner", { orderId: order.orderId }));
        } else if (order.prepaid) {
          setPrepaidBanner(t("genPrepaidContinue", { orderId: order.orderId }));
        }
      })
      .catch((err) => {
        setPrepaidError(err instanceof Error ? err.message : t("genOrderVerifyFailed"));
      });
  }, [searchParams, t]);

  const selectLocation = useCallback((loc: GeoLocation | null) => {
    setSelectedLocation(loc);
    if (loc) setFieldErrors((p) => ({ ...p, city: false }));
  }, []);

  const handleSubmit = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!birthDate) errors.birthDate = true;
    if (!useCustomCoords && !selectedLocation) errors.city = true;
    if (useCustomCoords && (!customLat || !customLng)) errors.coords = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    let lat: number, lng: number, tz: number;
    if (useCustomCoords) {
      lat = parseFloat(customLat) || 39.9;
      lng = parseFloat(customLng) || 116.4;
      tz = parseFloat(customTz) || 8;
    } else {
      lat = selectedLocation!.latitude;
      lng = selectedLocation!.longitude;
      tz = selectedLocation!.timezone;
    }
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);
    setGlobalReportType("full");
    onGenerate({ year, month, day, hour, minute, latitude: lat, longitude: lng, timezone: tz, gender, name: name || undefined });
  }, [birthDate, birthTime, selectedLocation, gender, name, onGenerate, useCustomCoords, customLat, customLng, customTz]);

  if (isLoading) {
    return (
      <div className="prism-root min-h-screen relative overflow-hidden">
        <PrismBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-10 h-10 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "var(--prism-cream)" }}>{t("genCalculatingChart")}</p>
          <p className="text-xs opacity-70" style={{ color: "var(--prism-cream)" }}>{t("genReportGenerating")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prism-root min-h-screen relative overflow-x-hidden overflow-y-auto">
      <PrismBackground />

      <div className="relative z-10 w-full max-w-[480px] mx-auto px-5 py-10 min-h-screen flex flex-col justify-start">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 prism-fade-in">
            <PrismBrandSymbol size={48} />
          </div>
          <div className="prism-font-display text-sm font-semibold tracking-[8px] uppercase mb-1" style={{ color: "var(--prism-gold)" }}>
            PRISM
          </div>
          <div className="prism-font-serif text-[11px] tracking-[4px] mb-6" style={{ color: "rgba(232,185,81,0.45)" }}>
            {t("lifeScriptBrand").split("").join(" ")}
          </div>
          <h1 className="prism-font-serif text-[22px] font-bold leading-relaxed mb-2" style={{ color: "var(--prism-cream)" }}>
            {t("genSoulRevealed")}{" "}<span style={{ color: "var(--prism-gold)" }}>{t("genSoulOutline")}</span>
          </h1>
          <p className="text-[13px] leading-loose" style={{ color: "rgba(250,246,240,0.4)" }}>
            {t("genBirthMoment")}<br />{t("genBirthMoment2")}
          </p>
        </div>

        {(prepaidBanner || prepaidError) && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm text-center"
            style={{
              background: prepaidError ? "rgba(217,79,79,0.1)" : "rgba(232,185,81,0.08)",
              border: prepaidError ? "1px solid rgba(217,79,79,0.3)" : "1px solid rgba(232,185,81,0.2)",
              color: prepaidError ? "#f87171" : "var(--prism-cream)",
            }}
          >
            {prepaidError || prepaidBanner}
          </div>
        )}

        <div className="prism-birth-form">
          <div className="mb-5 text-left">
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="prism-font-serif text-[13px] font-semibold tracking-wide" style={{ color: "rgba(250,246,240,0.7)" }}>
                {t("genYourName")}
              </span>
              <span className="text-[11px] italic" style={{ color: "rgba(232,185,81,0.35)" }}>{t("genOptional")}</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("genNamePlaceholder")}
              className="prism-input"
            />
          </div>

          <div className="mb-5 text-left">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="prism-font-serif text-[13px] font-semibold tracking-wide" style={{ color: "rgba(250,246,240,0.7)" }}>
                {t("genYouAre")}
              </span>
              <span className="text-[11px] italic" style={{ color: "rgba(232,185,81,0.35)" }}>{t("genGenderHint")}</span>
            </div>
            <div className="flex gap-3">
              {(["female", "male"] as const).map((g) => (
                <div key={g} className="prism-gender-opt flex-1 relative">
                  <input type="radio" name="gender" id={`g-${g}`} value={g} checked={gender === g} onChange={() => setGender(g)} />
                  <label htmlFor={`g-${g}`}>{g === "female" ? t("genFemale") : t("genMale")}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-5 sm:flex-row">
            <div className="flex-1 text-left">
              <div className="mb-2">
                <span className="prism-font-serif text-[13px] font-semibold" style={{ color: "rgba(250,246,240,0.7)" }}>
                  {t("genBirthDate")} <span style={{ color: "var(--prism-gold)" }}>*</span>
                </span>
              </div>
              <BirthDatePicker
                value={birthDate}
                onChange={(v) => { setBirthDate(v); setFieldErrors((p) => ({ ...p, birthDate: false })); }}
                className="prism-input"
                error={fieldErrors.birthDate}
                placeholder={t("genBirthDatePlaceholder")}
              />
            </div>
            <div className="flex-1 text-left">
              <div className="mb-2">
                <span className="prism-font-serif text-[13px] font-semibold" style={{ color: "rgba(250,246,240,0.7)" }}>
                  {t("genBirthTime")} <span style={{ color: "var(--prism-gold)" }}>*</span>
                </span>
              </div>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                disabled={birthTimeUnknown}
                className="prism-input"
              />
              <label className="mt-2 flex min-h-8 cursor-pointer items-center gap-2 text-xs" style={{ color: "rgba(250,246,240,0.55)" }}>
                <input type="checkbox" checked={birthTimeUnknown} onChange={(e) => { setBirthTimeUnknown(e.target.checked); if (e.target.checked) setBirthTime("12:00"); }} className="h-4 w-4" />
                I don't know my exact birth time
              </label>
              <p className="text-[10px] mt-1 italic" style={{ color: "rgba(232,185,81,0.35)" }}>{t("genBirthTimeHint")}</p>
            </div>
          </div>

          <div className="mb-2 text-left">
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="prism-font-serif text-[13px] font-semibold" style={{ color: "rgba(250,246,240,0.7)" }}>
                {t("genBirthPlace")} <span style={{ color: "var(--prism-gold)" }}>*</span>
              </span>
              <span className="text-[11px] italic" style={{ color: "rgba(232,185,81,0.35)" }}>{t("genLocationHint")}</span>
            </div>

            {!useCustomCoords ? (
              <LocationPicker
                value={selectedLocation}
                onChange={selectLocation}
                error={fieldErrors.city}
                placeholder={t("genLocationPlaceholder")}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input type="number" step="0.01" value={customLat} onChange={(e) => setCustomLat(e.target.value)}
                    placeholder={t("genLatitude")} className={`prism-input ${fieldErrors.coords ? "error" : ""}`} />
                  <input type="number" step="0.01" value={customLng} onChange={(e) => setCustomLng(e.target.value)}
                    placeholder={t("genLongitude")} className={`prism-input ${fieldErrors.coords ? "error" : ""}`} />
                </div>
                <input type="number" step="0.5" value={customTz} onChange={(e) => setCustomTz(e.target.value)}
                  placeholder={t("genTimezone")} className="prism-input" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setUseCustomCoords(!useCustomCoords)}
              className="text-[11px] mt-2 hover:underline"
              style={{ color: "var(--prism-gold)" }}
            >
              {useCustomCoords ? t("genUseCityList") : t("genManualCoords")}
            </button>
          </div>

          <button
            type="button"
            className="prism-btn-gold w-full mt-7"
            onClick={handleSubmit}
          >
            {t("genConnectChart")}
          </button>
        </div>

        <p className="text-center text-[10px] tracking-[3px] mt-6" style={{ color: "rgba(250,246,240,0.2)" }}>
          {t("genEphemeris")}
        </p>

        <PlanetCharactersSection />
      </div>
    </div>
  );
}
