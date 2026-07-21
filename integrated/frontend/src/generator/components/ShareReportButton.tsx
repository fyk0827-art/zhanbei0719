import { useState } from "react";
import { Check, Copy, Loader2, Share2, X } from "lucide-react";
import { createReportShare } from "../services/reportApi";
import { trackReportShared, trackShareLinkCreated } from "@/services/analytics";

interface ShareReportButtonProps {
  reportId: string;
  accessToken?: string;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function ShareReportButton({ reportId, accessToken }: ShareReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareId, setShareId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const shareOrCopy = async (id: string, url: string) => {
    const preferSystemShare = typeof navigator.share === "function"
      && window.matchMedia("(pointer: coarse)").matches;
    if (preferSystemShare) {
      try {
        await navigator.share({ title: "PRISM Life Script", text: "See this Life Script reading", url });
        trackReportShared(id, "system");
        return;
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
      }
    }
    await copyText(url);
    setCopied(true);
    trackReportShared(id, "clipboard");
  };

  const create = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await createReportShare(reportId, accessToken);
      setShareId(result.shareId);
      setShareUrl(result.shareUrl);
      trackShareLinkCreated(result.shareId);
      await shareOrCopy(result.shareId, result.shareUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create this public link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setCopied(false); setError(""); }}
        aria-label="Share report"
        title="Share report"
        className="flex h-11 w-11 items-center justify-center rounded-md border border-white/25 bg-black/45 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C87A] print:hidden"
      >
        <Share2 size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/60 p-4 sm:items-center" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="share-report-title" className="w-full max-w-md rounded-lg bg-[#17131c] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#E8C87A]">Public sharing</p>
                <h2 id="share-report-title" className="mt-1 font-serif text-2xl">Share this Life Script</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close share dialog" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"><X size={20} /></button>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">
              This creates a permanent public link. It shows your first name and complete reading, while hiding your email, exact birth details and location.
            </p>
            {error && <p className="mt-4 rounded-md bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}

            {shareUrl ? (
              <div className="mt-5">
                <div className="break-all rounded-md border border-white/15 bg-black/25 p-3 text-xs text-white/65">{shareUrl}</div>
                <button type="button" onClick={() => void shareOrCopy(shareId, shareUrl)} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#E8C87A] px-4 font-semibold text-[#251f2c]">
                  {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Link copied" : "Share or copy link"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => void create()} disabled={loading} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#E8C87A] px-4 font-semibold text-[#251f2c] disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                Create permanent public link
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}
