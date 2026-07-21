import type { PublicSettings } from "@/types/api";

type EventProperties = Record<string, string | number | boolean | undefined>;
type FacebookEvent = "Lead" | "CompleteRegistration" | "ViewContent" | "InitiateCheckout" | "Purchase";

interface QueuedEvent {
  la51Name: string;
  facebookName?: FacebookEvent | string;
  facebookCustom?: boolean;
  properties: EventProperties;
  eventId?: string;
}

type FbqFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    LA?: {
      init?: (config: Record<string, unknown>) => void;
      track?: (name: string, properties?: EventProperties) => void;
    };
  }
}

const pending: QueuedEvent[] = [];
let settings: PublicSettings | null = null;
let initializePromise: Promise<void> | null = null;
let ready = false;
let lastPagePath = "";

function isProductionUserPage() {
  return ["divinlove.com", "www.divinlove.com"].includes(window.location.hostname)
    && !window.location.pathname.startsWith("/admin");
}

function hasSensitiveQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.has("accessToken") || params.has("token") || params.has("PayerID");
}

async function waitForSafeUrl() {
  for (let attempt = 0; attempt < 120 && hasSensitiveQuery(); attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }
}

function loadScript(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = existing || document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

function installFacebookQueue() {
  if (window.fbq) return;
  const fbq: FbqFunction = (...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
}

async function initializeFacebook(config: PublicSettings) {
  if (!config.facebookPixelEnabled || !/^\d{5,32}$/.test(config.facebookPixelId || "")) return;
  installFacebookQueue();
  window.fbq?.("init", config.facebookPixelId);
  await loadScript("facebook-pixel-sdk", "https://connect.facebook.net/en_US/fbevents.js");
}

async function initializeLa51(config: PublicSettings) {
  if (!config.la51Enabled || !config.la51SiteId || !config.la51Ck) return;
  await loadScript("la51-analytics-sdk", "https://sdk.51.la/js-sdk-pro.min.js");
  window.LA?.init?.({
    id: config.la51SiteId,
    ck: config.la51Ck,
    autoTrack: true,
    hashMode: true,
    screenRecord: false,
  });
}

export function initializeAnalytics() {
  if (initializePromise) return initializePromise;
  initializePromise = (async () => {
    if (!isProductionUserPage()) return;
    await waitForSafeUrl();
    if (hasSensitiveQuery()) return;
    const response = await fetch("/api/settings/public");
    if (!response.ok) throw new Error(`Analytics settings failed (${response.status})`);
    const payload = await response.json() as { success: boolean; data: PublicSettings };
    settings = payload.data;
    await Promise.allSettled([initializeFacebook(settings), initializeLa51(settings)]);
    ready = true;
    pending.splice(0).forEach(dispatch);
  })().catch((error) => {
    console.warn("Analytics initialization failed", error);
  });
  return initializePromise;
}

function dispatch(event: QueuedEvent) {
  if (!settings) return;
  const properties = { ...event.properties };
  if (
    properties.value === undefined
    && (event.facebookName === "InitiateCheckout" || event.facebookName === "Purchase")
  ) {
    properties.value = settings.reportPrice;
  }
  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  );
  if (settings.la51Enabled) {
    try { window.LA?.track?.(event.la51Name, cleanProperties); } catch (error) { console.warn("51.LA event failed", error); }
  }
  if (settings.facebookPixelEnabled && event.facebookName) {
    try {
      const method = event.facebookCustom ? "trackCustom" : "track";
      const options = event.eventId ? { eventID: event.eventId } : undefined;
      window.fbq?.(method, event.facebookName, cleanProperties, options);
    } catch (error) {
      console.warn("Facebook Pixel event failed", error);
    }
  }
}

function emit(event: QueuedEvent) {
  if (ready) dispatch(event);
  else pending.push(event);
  void initializeAnalytics();
}

function once(storage: Storage, key: string, callback: () => void) {
  const storageKey = `divinlove_analytics_${key}`;
  try {
    if (storage.getItem(storageKey)) return;
    storage.setItem(storageKey, "1");
  } catch {
    // Storage can be unavailable in private browsing; analytics should still proceed.
  }
  callback();
}

export function trackPageView(pathname: string) {
  if (pathname.startsWith("/admin") || pathname === lastPagePath) return;
  lastPagePath = pathname;
  emit({ la51Name: "PageView", facebookName: "PageView", properties: { path: pathname } });
}

export function trackEmailVerified(contactId: string) {
  once(sessionStorage, `email_${contactId}`, () => emit({
    la51Name: "EmailVerified", facebookName: "Lead", properties: { source: "email_verification" },
  }));
}

export function trackPersonalDetailsCompleted(flowId: string) {
  once(sessionStorage, `details_${flowId}`, () => emit({
    la51Name: "PersonalDetailsCompleted", facebookName: "CompleteRegistration", properties: { status: "completed" },
  }));
}

export function trackQuizCompleted(flowId: string, questionCount: number) {
  once(sessionStorage, `quiz_${flowId}`, () => emit({
    la51Name: "QuizCompleted", facebookName: "QuizCompleted", facebookCustom: true, properties: { question_count: questionCount },
  }));
}

export function trackPreviewReportViewed(reportId: string, reportType: string) {
  once(sessionStorage, `preview_${reportId}`, () => emit({
    la51Name: "PreviewReportViewed", facebookName: "ViewContent", properties: { content_type: "preview_report", report_type: reportType },
  }));
}

export function trackCheckoutStarted(paypalOrderId: string, reportType = "full") {
  once(sessionStorage, `checkout_${paypalOrderId}`, () => emit({
    la51Name: "CheckoutStarted", facebookName: "InitiateCheckout", properties: {
      value: settings?.reportPrice,
      currency: "USD",
      report_type: reportType,
    },
  }));
}

export function trackPurchaseCompleted(paypalOrderId: string, captureId?: string) {
  once(localStorage, `purchase_${captureId || paypalOrderId}`, () => emit({
    la51Name: "PurchaseCompleted", facebookName: "Purchase", eventId: captureId || paypalOrderId, properties: {
      value: settings?.reportPrice,
      currency: "USD",
    },
  }));
}

export function trackFullReportViewed(reportId: string) {
  once(localStorage, `full_report_${reportId}`, () => emit({
    la51Name: "FullReportViewed", facebookName: "FullReportViewed", facebookCustom: true, properties: { content_type: "full_report" },
  }));
}
