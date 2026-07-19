import { Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { generatorPath } from "../utils/generatorNav";

interface Props {
  className?: string;
}

/** 右上角：设置 */
export function GeneratorTopRightActions({ className = "" }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      className={`fixed right-4 top-4 z-[300] flex flex-col items-center gap-2 md:right-6 md:top-6 ${className}`}
    >
      <button
        type="button"
        onClick={() => navigate(generatorPath("settings"))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          border: "1px solid rgba(232,185,81,0.2)",
        }}
        title={t("genSettings")}
      >
        <Settings size={16} className="shrink-0" />
      </button>
    </div>
  );
}
