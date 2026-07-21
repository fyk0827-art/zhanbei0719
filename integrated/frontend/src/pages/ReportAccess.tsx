import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Lock, MailCheck } from "lucide-react";
import { fetchReportByAccessToken, type FetchReportResponse } from "@/generator/services/reportApi";
import PrismReportPage from "@/generator/components/prismReport/PrismReportPage";
import { prismPrecompute } from "@/generator/services/prismPrecompute";
import { capturePaypalOrder, createPaypalOrder } from "@/generator/services/paymentApi";
import { settingsApi } from "@/services/api";

function parseReportLink(search: string) {
  const params = new URLSearchParams(search);
  const tokenValues = params.getAll("token");
  return {
    accessToken: params.get("accessToken") || tokenValues[0] || "",
    paypalOrderId: params.get("paypal") === "return"
      ? (params.get("accessToken") ? (params.get("token") || "") : (tokenValues[1] || ""))
      : "",
  };
}

export default function ReportAccess() {
  const [link] = useState(() => parseReportLink(window.location.search));
  const token = link.accessToken;
  const [report, setReport] = useState<FetchReportResponse | null>(null);
  const [error, setError] = useState(() => token ? "" : "This report link is incomplete.");
  const [paying, setPaying] = useState(() => Boolean(link.paypalOrderId));
  const [payError, setPayError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [price, setPrice] = useState("29.90");

  useEffect(() => {
    if (!token) return;
    fetchReportByAccessToken(token).then(setReport)
      .catch(() => setError("This private report link is invalid or the report is not available."));
  }, [token]);

  useEffect(() => {
    settingsApi.getPublic().then((settings) => setPrice(Number(settings.reportPrice).toFixed(2))).catch(() => undefined);
  }, []);

  useEffect(() => {
    const paypalOrderId = link.paypalOrderId;
    if (!paypalOrderId) return;
    capturePaypalOrder(paypalOrderId)
      .then((result) => {
        if (!result.paid) throw new Error("PayPal has not confirmed this payment.");
        setPaymentSuccess(true);
      })
      .catch((reason) => setPayError(reason instanceof Error ? reason.message : "Unable to confirm your payment."))
      .finally(() => setPaying(false));
  }, [link.paypalOrderId]);

  const startPay = async () => {
    if (!report?.reportId || !token) return;
    setPaying(true);
    setPayError("");
    try {
      const order = await createPaypalOrder(report.reportId, token);
      if (!order.approvalUrl) throw new Error("PayPal did not provide an approval link.");
      window.location.assign(order.approvalUrl);
    } catch (reason) {
      setPayError(reason instanceof Error ? reason.message : "Unable to start PayPal checkout.");
      setPaying(false);
    }
  };

  const blocks = useMemo(() => (report?.reportText || "").split(/\n{2,}/).filter(Boolean), [report]);
  const prismPre = useMemo(() => report?.chartJson ? prismPrecompute(report.chartJson, {
    name: report.displayName || report.chartJson.birthData?.name,
    gender: report.chartJson.birthData?.gender,
  }) : null, [report]);

  if (error) return <Status message={error} />;
  if (!report) return <Status loading message="Opening your private report…" />;

  if (paymentSuccess || (report.paid && !report.unlocked)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#15101e] px-6 text-center text-white">
        <MailCheck size={52} className="mb-5 text-[#E8C87A]" />
        <h1 className="mb-3 font-serif text-3xl">Payment successful</h1>
        <p className="max-w-md leading-relaxed text-white/70">Your complete report is now being prepared. You can safely close this page. We'll email your private report link as soon as it is ready.</p>
      </div>
    );
  }

  const paywall = !report.unlocked ? (
    <div className="mx-auto my-8 max-w-[390px] rounded-lg border border-[#E8C87A]/40 bg-[#20162d] p-5 text-center text-white shadow-xl">
      <Lock size={22} className="mx-auto mb-3 text-[#E8C87A]" />
      <h2 className="mb-2 font-serif text-xl">Unlock your complete Life Script</h2>
      <p className="mb-4 text-sm leading-relaxed text-white/65">Get your complete timeline, relationships, career, wealth insights and practical action plan.</p>
      {payError && <p className="mb-3 text-xs text-red-300">{payError}</p>}
      <button type="button" onClick={() => void startPay()} disabled={paying} className="min-h-12 w-full rounded-md bg-[#0070ba] px-4 font-semibold text-white disabled:opacity-60">
        {paying ? "Redirecting to PayPal…" : `Unlock securely with PayPal · $${price}`}
      </button>
    </div>
  ) : null;

  if (report.chartJson && prismPre && report.reportText) {
    return (
      <>
        <button
          type="button"
          onClick={() => window.print()}
          title="Download or print"
          aria-label="Download or print"
          className="report-access-print fixed right-4 top-4 z-[130] flex h-11 w-11 items-center justify-center rounded-md border border-white/25 bg-black/45 text-white shadow-lg backdrop-blur"
        >
          <Download size={18} />
        </button>
        <PrismReportPage chart={report.chartJson} pre={prismPre} reportText={report.reportText} previewOnly={!report.unlocked} isUnlocked={report.unlocked} paywallSlot={paywall} />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#261f30] print:bg-white">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f7f4ee]/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-[#7b6691]">PRISM</p><p className="text-sm font-medium">Complete Life Blueprint</p></div>
          <button type="button" onClick={() => window.print()} title="Download or print" className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-white"><Download size={18} /></button>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="mb-3 text-sm uppercase tracking-[0.18em] text-[#7b6691]">Your personalized report</p>
        <h1 className="mb-10 font-serif text-4xl leading-tight sm:text-5xl">{report.displayName ? `${report.displayName}'s Life Blueprint` : "Your Life Blueprint"}</h1>
        <div className="space-y-6 text-[17px] leading-8 text-[#3f3747]">
          {blocks.map((block, index) => {
            const clean = block.replace(/^#{1,4}\s*/, "").replace(/\*\*/g, "").trim();
            const heading = /^#{1,4}\s/.test(block) || /^【.+】$/.test(clean);
            return heading
              ? <h2 key={index} className="pt-6 font-serif text-2xl leading-snug text-[#261f30]">{clean.replace(/[【】]/g, "")}</h2>
              : <p key={index} className="whitespace-pre-line">{clean}</p>;
          })}
        </div>
        {paywall}
      </article>
    </main>
  );
}

function Status({ message, loading = false }: { message: string; loading?: boolean }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#15101e] px-6 text-center text-white">{loading && <Loader2 className="animate-spin text-[#E8C87A]" />}<p className="max-w-md text-white/70">{message}</p></div>;
}
