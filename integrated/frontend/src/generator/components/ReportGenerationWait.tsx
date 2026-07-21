import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface ReportGenerationWaitProps {
  startedAt?: number | null;
  error?: string | null;
  errorTitle?: string;
  onRetry?: () => void;
}

export default function ReportGenerationWait({
  startedAt = null,
  error,
  errorTitle = "We couldn't confirm your payment",
  onRetry,
}: ReportGenerationWaitProps) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (error) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [error]);

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const remaining = Math.max(0, 180 - elapsed);
  const label = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0D1B2A] px-6 text-[#FAF6F0]">
      <div className="w-full max-w-md text-center">
        {error ? (
          <AlertCircle className="mx-auto mb-7 text-red-300" size={48} aria-hidden="true" />
        ) : (
          <Loader2 className="mx-auto mb-7 animate-spin text-[#E8C87A]" size={48} aria-hidden="true" />
        )}
        <h1 className="prism-font-serif mb-3 text-2xl font-semibold">
          {error ? errorTitle : "Your complete report is being prepared"}
        </h1>
        {error ? (
          <p className="mb-6 text-sm leading-relaxed text-white/70">{error}</p>
        ) : remaining > 0 ? (
          <p className="mb-4 text-lg text-[#E8C87A]">Estimated time remaining: {label}</p>
        ) : (
          <p className="mb-4 text-lg text-[#E8C87A]">Your report is still being prepared</p>
        )}
        {!error && (
          <p className="text-sm leading-relaxed text-white/60">
            You can safely leave this page. We'll email your report when it's ready.
          </p>
        )}
        {error && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-12 rounded-md bg-[#E8C87A] px-5 font-semibold text-[#17131c] transition-colors hover:bg-[#f3d991] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8C87A]"
          >
            Check payment again
          </button>
        )}
      </div>
    </main>
  );
}
