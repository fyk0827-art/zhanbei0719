import { useLocation } from "react-router";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function GlobalLanguageSwitcher() {
  const { pathname } = useLocation();
  const isLightPage = pathname.startsWith("/admin") || pathname === "/report";
  const isGeneratorPage = pathname.startsWith("/generator");

  if (isGeneratorPage) return null;

  return (
    <div
      className={`fixed z-[300] ${isLightPage ? "right-4 top-4 md:right-6 md:top-6" : "left-4 top-4 md:left-6 md:top-6"}`}
    >
      <LanguageSwitcher variant="compact" theme={isLightPage ? "light" : "prism"} dropdownAlign={isLightPage ? "right" : "left"} />
    </div>
  );
}
