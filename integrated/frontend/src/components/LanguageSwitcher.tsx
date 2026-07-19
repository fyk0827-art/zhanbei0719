import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { languages } from "@/i18n";

type LanguageSwitcherProps = {
  className?: string;
  buttonClassName?: string;
  /** compact: icon + flag only; default: same as header; large: bigger pill for report pages */
  variant?: "default" | "compact" | "large";
  /** light: cream admin pages; prism: dark star-chart pages */
  theme?: "light" | "prism";
  dropdownAlign?: "left" | "right";
};

const themeStyles = {
  light: {
    button:
      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#2D2A26] transition-colors hover:bg-[#E8C547]/10",
    dropdown: "border-[#E8E4DC] bg-white",
    itemActive: "bg-[#E8C547]/10 font-medium text-[#2D2A26]",
    itemIdle: "text-[#6B6560] hover:bg-[#FFFDF5]",
    check: "text-[#E8C547]",
  },
  prism: {
    button:
      "inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
    dropdown: "border-[rgba(232,185,81,0.25)] bg-[rgba(13,27,42,0.95)] backdrop-blur-md",
    itemActive: "bg-[rgba(232,185,81,0.15)] font-medium text-[var(--prism-cream,#FAF6F0)]",
    itemIdle: "text-[rgba(250,246,240,0.65)] hover:bg-[rgba(232,185,81,0.08)]",
    check: "text-[var(--prism-gold,#E8B951)]",
  },
};

export default function LanguageSwitcher({
  className = "",
  buttonClassName = "",
  variant = "default",
  theme = "light",
  dropdownAlign = "right",
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];
  const styles = themeStyles[theme];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t("language")}
        aria-expanded={open}
        className={buttonClassName || styles.button}
        style={
          theme === "prism" && !buttonClassName
            ? {
                border: "1px solid rgba(232,185,81,0.2)",
                background: "rgba(13,27,42,0.6)",
                color: "var(--prism-gold, #E8B951)",
                ...(variant === "large"
                  ? { minWidth: "2.25rem", height: "2.25rem", padding: "0 0.625rem", gap: "0.375rem" }
                  : {}),
              }
            : undefined
        }
      >
        <Globe
          size={variant === "large" ? 16 : 16}
          className="shrink-0"
          strokeWidth={variant === "large" ? 2.25 : 2}
        />
        {variant === "large" ? (
          <span className="text-sm font-bold leading-none">{currentLang.flag}</span>
        ) : variant === "compact" ? (
          <span className="text-xs font-semibold leading-none">{currentLang.flag}</span>
        ) : (
          <span className="leading-none">{currentLang.flag}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[210]" onClick={() => setOpen(false)} />
          <div
            className={`absolute ${dropdownAlign === "left" ? "left-0" : "right-0"} top-full z-[220] mt-2 w-52 overflow-hidden rounded-xl border py-1 shadow-lg ${styles.dropdown}`}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                  i18n.language === lang.code ? styles.itemActive : styles.itemIdle
                }`}
              >
                <span className="text-xs">{lang.flag}</span>
                <span>{lang.native}</span>
                {i18n.language === lang.code && (
                  <span className={`ml-auto ${styles.check}`}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
