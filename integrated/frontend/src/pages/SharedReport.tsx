import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router";
import PrismReportPage from "@/generator/components/prismReport/PrismReportPage";
import { fetchSharedReport, type SharedReportResponse } from "@/generator/services/reportApi";
import { prismPrecompute } from "@/generator/services/prismPrecompute";
import type { NatalChart } from "@/generator/services/astrologyEngine";
import { trackSharedReportCtaClicked, trackSharedReportViewed } from "@/services/analytics";

export default function SharedReport() {
  const { shareId = "" } = useParams();
  const [report, setReport] = useState<SharedReportResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSharedReport(shareId)
      .then((value) => {
        if (!cancelled) {
          setReport(value);
          trackSharedReportViewed(shareId);
        }
      })
      .catch(() => {
        if (!cancelled) setError("This shared report is unavailable.");
      });
    return () => { cancelled = true; };
  }, [shareId]);

  const chart = report?.chartJson as NatalChart | undefined;
  const pre = useMemo(() => chart && report ? prismPrecompute(chart, {
    name: report.displayName,
    gender: report.gender,
    age: report.age,
  }) : null, [chart, report]);

  if (error) {
    return <Status message={error} />;
  }
  if (!report || !chart || !pre) {
    return <Status loading message="Opening this shared Life Script…" />;
  }

  return (
    <main className="min-h-screen bg-[#17131c]">
      <PrismReportPage chart={chart} pre={pre} reportText={report.reportText} isUnlocked />
      <section className="bg-[#17131c] px-5 py-14 text-center text-white sm:py-20">
        <p className="text-xs font-semibold uppercase text-[#E8C87A]">Your story is different</p>
        <h2 className="mx-auto mt-3 max-w-xl font-serif text-3xl leading-tight sm:text-4xl">Decode your own Life Script</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/65">Start with your details and discover the patterns shaping your relationships, direction and next chapter.</p>
        <Link to="/generator" onClick={() => trackSharedReportCtaClicked(shareId)} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#E8C87A] px-6 font-semibold text-[#251f2c]">
          Start your reading <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

function Status({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#17131c] px-6 text-center text-white">
      {loading && <Loader2 className="animate-spin text-[#E8C87A]" />}
      <p className="max-w-md text-white/70">{message}</p>
      {!loading && <Link to="/generator" className="rounded-md bg-[#E8C87A] px-5 py-3 font-semibold text-[#251f2c]">Start your reading</Link>}
    </div>
  );
}
