import type { PublicSettings } from "@/types/api";

type EventProperties = Record<string, string | number | boolean | undefined>;
type FacebookEvent = "PageView" | "Lead" | "CompleteRegistration" | "ViewContent" | "InitiateCheckout" | "Purchase";

interface AnalyticsEvent {
  sourceName: string;
  facebookName: FacebookEvent | string;
  facebookCustom?: boolean;
  properties: EventProperties;
  eventId: string;
  contactId?: string;
  reportId?: string;
  storage?: Storage;
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

const pending = new Map<string, AnalyticsEvent>();
const capiInFlight = new Set<string>();
const completedProviders = new Set<string>();
const capiRetryAttempts = new Map<string, number>();
const capiRetryTimers = new Map<string, number>();
const diagnosticMarkers = new Set<string>();
let settings: PublicSettings | null = null;
let initializePromise: Promise<void> | null = null;
let facebookReady = false;
let la51Ready = false;
let la51InitStarted = false;
let la51Initializing = false;
let la51RetryTimer: number | null = null;
let lastPagePath = "";

const CAPI_RETRY_DELAYS = [2_000, 5_000, 15_000];

function isProductionUserPage() {
  return ["divinlove.com", "www.divinlove.com"].includes(window.location.hostname)
    && !window.location.pathname.startsWith("/admin");
}

function safePath() {
  return window.location.pathname.startsWith("/") ? window.location.pathname : "/";
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
    script.charset = "UTF-8";
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

async function diagnostic(provider: "la51" | "facebook" | "capi", status: "READY" | "SDK_CALLED" | "EVENT_SENT" | "ERROR", event?: string, error?: unknown) {
  const diagnosticKey = `${provider}:${status}:${event || "provider"}`;
  if (diagnosticMarkers.has(diagnosticKey)) return;
  diagnosticMarkers.add(diagnosticKey);
  if (import.meta.env.DEV) console.debug(`[analytics] ${provider} ${status}`, event || "", error || "");
  try {
    await fetch("/api/analytics/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, status, event, error: error instanceof Error ? error.message : error ? String(error) : undefined }),
      keepalive: true,
    });
  } catch {
    // Diagnostics must never affect the user flow.
  }
}

async function initializeFacebook(config: PublicSettings) {
  if (!config.facebookPixelEnabled || !/^\d{5,32}$/.test(config.facebookPixelId || "")) return;
  try {
    installFacebookQueue();
    window.fbq?.("init", config.facebookPixelId);
    await loadScript("facebook-pixel-sdk", "https://connect.facebook.net/en_US/fbevents.js");
    facebookReady = true;
    void diagnostic("facebook", "READY");
    flush();
  } catch (error) {
    void diagnostic("facebook", "ERROR", undefined, error);
  }
}

async function waitForLaTrack(timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (typeof window.LA?.track === "function") return;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  throw new Error("51.LA event SDK did not become ready");
}

async function initializeLa51(config: PublicSettings) {
  if (!config.la51Enabled || !config.la51SiteId || !config.la51Ck || la51Ready || la51Initializing) return;
  la51Initializing = true;
  try {
    await loadScript("LA_COLLECT", "https://sdk.51.la/js-sdk-pro.min.js");
    if (!la51InitStarted) {
      window.LA?.init?.({
        id: config.la51SiteId,
        ck: config.la51Ck,
        autoTrack: true,
        hashMode: true,
        screenRecord: false,
      });
      la51InitStarted = true;
    }
    await waitForLaTrack();
    la51Ready = true;
    void diagnostic("la51", "READY");
    flush();
  } catch (error) {
    void diagnostic("la51", "ERROR", undefined, error);
    if (la51RetryTimer === null) {
      la51RetryTimer = window.setTimeout(() => {
        la51RetryTimer = null;
        void initializeLa51(config);
      }, 5_000);
    }
  } finally {
    la51Initializing = false;
  }
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
    flush();
  })().catch((error) => {
    if (import.meta.env.DEV) console.warn("Analytics initialization failed", error);
  });
  return initializePromise;
}

function marker(event: AnalyticsEvent, provider: string) {
  return `divinlove_analytics_${provider}_${event.eventId}`;
}

function wasSent(event: AnalyticsEvent, provider: string) {
  const providerKey = marker(event, provider);
  if (completedProviders.has(providerKey)) return true;
  // 51.LA's track API hands the event to sendBeacon but exposes no delivery
  // acknowledgement. Persisting that handoff would silently suppress a later
  // retry after navigation, an aborted beacon, or an older broken deployment.
  if (provider === "la51") return false;
  try {
    const stored = event.storage?.getItem(providerKey) === "1";
    if (stored) completedProviders.add(providerKey);
    return stored;
  } catch {
    return false;
  }
}

function markSent(event: AnalyticsEvent, provider: string) {
  const providerKey = marker(event, provider);
  completedProviders.add(providerKey);
  if (provider === "la51") return;
  try { event.storage?.setItem(providerKey, "1"); } catch { /* Private browsing can deny storage. */ }
}

function markTerminal(event: AnalyticsEvent, provider: string) {
  completedProviders.add(marker(event, provider));
}

function cleanProperties(event: AnalyticsEvent) {
  const properties = { ...event.properties };
  if (properties.value === undefined && (event.facebookName === "InitiateCheckout" || event.facebookName === "Purchase")) {
    properties.value = settings?.reportPrice;
  }
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}

function sendLa51(event: AnalyticsEvent) {
  if (event.sourceName === "PageView" || !settings?.la51Enabled || wasSent(event, "la51")) return true;
  if (!la51Ready || typeof window.LA?.track !== "function") return false;
  try {
    window.LA.track(event.sourceName);
    markSent(event, "la51");
    void diagnostic("la51", "SDK_CALLED", event.sourceName);
    return true;
  } catch (error) {
    void diagnostic("la51", "ERROR", event.sourceName, error);
    return false;
  }
}

function sendFacebook(event: AnalyticsEvent, properties: EventProperties) {
  if (!settings?.facebookPixelEnabled || wasSent(event, "facebook")) return true;
  if (!facebookReady || !window.fbq) return false;
  try {
    window.fbq(event.facebookCustom ? "trackCustom" : "track", event.facebookName, properties, { eventID: event.eventId });
    markSent(event, "facebook");
    void diagnostic("facebook", "EVENT_SENT", event.sourceName);
    return true;
  } catch (error) {
    void diagnostic("facebook", "ERROR", event.sourceName, error);
    return false;
  }
}

function sendCapi(event: AnalyticsEvent, properties: EventProperties) {
  if (["CheckoutStarted", "PurchaseCompleted"].includes(event.sourceName) || wasSent(event, "capi")) return true;
  if (capiInFlight.has(event.eventId)) return false;
  capiInFlight.add(event.eventId);
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName: event.sourceName,
      eventId: event.eventId,
      occurredAt: Date.now(),
      contactId: event.contactId,
      reportId: event.reportId,
      ...getAnalyticsContext(),
      properties,
    }),
    keepalive: true,
  }).then((response) => {
    if (!response.ok) throw new Error(`CAPI queue returned ${response.status}`);
    markSent(event, "capi");
    capiRetryAttempts.delete(event.eventId);
    void diagnostic("capi", "EVENT_SENT", event.sourceName);
    capiInFlight.delete(event.eventId);
    flush();
  }).catch((error) => {
    void diagnostic("capi", "ERROR", event.sourceName, error);
    capiInFlight.delete(event.eventId);
    const failedAttempts = (capiRetryAttempts.get(event.eventId) || 0) + 1;
    capiRetryAttempts.set(event.eventId, failedAttempts);
    const delay = CAPI_RETRY_DELAYS[failedAttempts - 1];
    if (delay === undefined) {
      markTerminal(event, "capi");
      capiRetryAttempts.delete(event.eventId);
      flush();
      return;
    }
    if (!capiRetryTimers.has(event.eventId)) {
      const timer = window.setTimeout(() => {
        capiRetryTimers.delete(event.eventId);
        flush();
      }, delay);
      capiRetryTimers.set(event.eventId, timer);
    }
  });
  return false;
}

function flush() {
  if (!settings) return;
  pending.forEach((event, key) => {
    const properties = cleanProperties(event);
    const laDone = sendLa51(event);
    const fbDone = sendFacebook(event, properties);
    const capiDone = sendCapi(event, properties);
    if (laDone && fbDone && capiDone) pending.delete(key);
  });
}

function browserProvidersComplete(event: AnalyticsEvent) {
  if (!settings) return false;
  const laDone = event.sourceName === "PageView" || !settings.la51Enabled || wasSent(event, "la51");
  const facebookDone = !settings.facebookPixelEnabled || wasSent(event, "facebook");
  return laDone && facebookDone;
}

async function waitForBrowserHandoff(event: AnalyticsEvent, timeoutMs = 300) {
  const started = Date.now();
  while (!browserProvidersComplete(event) && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, 20));
  }
}

function emit(event: AnalyticsEvent) {
  const key = `${event.sourceName}:${event.eventId}`;
  if (!pending.has(key)) pending.set(key, event);
  flush();
  void initializeAnalytics();
  return waitForBrowserHandoff(event);
}

function eventId(prefix: string, id: string) {
  const safe = id.replace(/[^A-Za-z0-9:_-]/g, "_").slice(0, 96);
  return `${prefix}:${safe}`;
}

function cookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length);
}

export function getAnalyticsContext() {
  return { fbp: cookie("_fbp"), fbc: cookie("_fbc"), path: safePath() };
}

export function trackPageView(pathname: string) {
  if (pathname.startsWith("/admin") || pathname === lastPagePath) return;
  lastPagePath = pathname;
  return emit({ sourceName: "PageView", facebookName: "PageView", properties: { path: pathname }, eventId: eventId("page", crypto.randomUUID()) });
}

export function trackEmailVerified(contactId: string) {
  return emit({ sourceName: "EmailVerified", facebookName: "Lead", properties: { source: "email_verification" }, eventId: eventId("email", contactId), contactId, storage: sessionStorage });
}

export function trackPersonalDetailsCompleted(flowId: string) {
  return emit({ sourceName: "PersonalDetailsCompleted", facebookName: "CompleteRegistration", properties: { status: "completed" }, eventId: eventId("details", flowId), storage: sessionStorage });
}

export function trackQuizCompleted(flowId: string, questionCount: number) {
  return emit({ sourceName: "QuizCompleted", facebookName: "QuizCompleted", facebookCustom: true, properties: { question_count: questionCount }, eventId: eventId("quiz", flowId), storage: sessionStorage });
}

export function trackPreviewReportViewed(reportId: string, reportType: string) {
  return emit({ sourceName: "PreviewReportViewed", facebookName: "ViewContent", properties: { content_type: "preview_report", report_type: reportType }, eventId: eventId("preview", reportId), reportId, storage: sessionStorage });
}

export function trackCheckoutStarted(paypalOrderId: string, reportType = "full") {
  return emit({ sourceName: "CheckoutStarted", facebookName: "InitiateCheckout", properties: { value: settings?.reportPrice, currency: "USD", report_type: reportType }, eventId: paypalOrderId, storage: sessionStorage });
}

export function trackPurchaseCompleted(paypalOrderId: string, captureId?: string) {
  return emit({ sourceName: "PurchaseCompleted", facebookName: "Purchase", properties: { value: settings?.reportPrice, currency: "USD" }, eventId: captureId || paypalOrderId, storage: localStorage });
}

export function trackFullReportViewed(reportId: string) {
  return emit({ sourceName: "FullReportViewed", facebookName: "FullReportViewed", facebookCustom: true, properties: { content_type: "full_report" }, eventId: eventId("full", reportId), reportId, storage: localStorage });
}

export function trackShareLinkCreated(shareId: string) {
  return emit({ sourceName: "ShareLinkCreated", facebookName: "ShareLinkCreated", facebookCustom: true, properties: { report_type: "full" }, eventId: eventId("share_created", shareId), storage: sessionStorage });
}

export function trackReportShared(shareId: string, method: "system" | "clipboard") {
  return emit({ sourceName: "ReportShared", facebookName: "ReportShared", facebookCustom: true, properties: { report_type: "full", method }, eventId: eventId("shared", `${shareId}:${crypto.randomUUID()}`) });
}

export function trackSharedReportViewed(shareId: string) {
  return emit({ sourceName: "SharedReportViewed", facebookName: "SharedReportViewed", facebookCustom: true, properties: { report_type: "full" }, eventId: eventId("shared_view", shareId), storage: sessionStorage });
}

export function trackSharedReportCtaClicked(shareId: string) {
  return emit({ sourceName: "SharedReportCtaClicked", facebookName: "SharedReportCtaClicked", facebookCustom: true, properties: { report_type: "full" }, eventId: eventId("shared_cta", `${shareId}:${crypto.randomUUID()}`) });
}
