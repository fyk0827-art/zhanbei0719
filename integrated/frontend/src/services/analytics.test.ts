import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function throwingStorage(): Storage {
  return {
    get length() { return 0; }, clear: () => undefined,
    getItem: () => { throw new Error("Storage denied"); }, key: () => null,
    removeItem: () => undefined, setItem: () => { throw new Error("Storage denied"); },
  };
}

function installBrowserMocks(options: { facebook?: boolean; eventStatus?: number } = {}) {
  const scripts = new Map<string, EventTarget & Record<string, unknown>>();
  const documentMock = {
    cookie: "",
    getElementById: (id: string) => scripts.get(id) || null,
    createElement: () => Object.assign(new EventTarget(), { dataset: {} as Record<string, string> }),
    head: { appendChild: (script: EventTarget & { id?: string }) => {
      if (script.id) scripts.set(script.id, script as EventTarget & Record<string, unknown>);
      script.dispatchEvent(new Event("load"));
    } },
  };
  const windowMock = Object.assign(globalThis, {
    document: documentMock,
    location: { hostname: "divinlove.com", pathname: "/", search: "", hash: "" },
    history: { replaceState: vi.fn(), state: {} },
    sessionStorage: throwingStorage(), localStorage: throwingStorage(), fbq: undefined, _fbq: undefined,
  });
  vi.stubGlobal("window", windowMock);
  vi.stubGlobal("document", documentMock);
  vi.stubGlobal("sessionStorage", windowMock.sessionStorage);
  vi.stubGlobal("localStorage", windowMock.localStorage);
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/settings/public") return new Response(JSON.stringify({
      success: true,
      data: { reportPrice: 0.01, facebookPixelEnabled: Boolean(options.facebook), facebookPixelId: options.facebook ? "2046058972690279" : "" },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    if (url === "/api/analytics/events") return new Response("", { status: options.eventStatus ?? 202 });
    return new Response("", { status: 202 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function callsFor(fetchMock: ReturnType<typeof vi.fn>, path: string) {
  return fetchMock.mock.calls.filter(([input]) => String(input) === path);
}

describe("analytics delivery", () => {
  beforeEach(() => { vi.resetModules(); vi.useRealTimers(); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("stores every client-side funnel event exactly once", async () => {
    const fetchMock = installBrowserMocks();
    const analytics = await import("./analytics");
    await Promise.all([
      analytics.trackPageView("/"), analytics.trackEmailVerified("contact-all"),
      analytics.trackPersonalDetailsCompleted("flow-all"), analytics.trackQuizCompleted("flow-all", 20),
      analytics.trackPreviewReportViewed("preview-all", "preview"), analytics.trackFullReportViewed("report-all"),
      analytics.trackShareLinkCreated("share-all"), analytics.trackReportShared("share-all", "clipboard"),
      analytics.trackSharedReportViewed("share-all"), analytics.trackSharedReportCtaClicked("share-all"),
    ]);
    await vi.waitFor(() => expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(10));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(10);
  });

  it("finishes without a request loop when storage is unavailable", async () => {
    const fetchMock = installBrowserMocks();
    const { trackReportShared } = await import("./analytics");
    await trackReportShared("share-1", "clipboard");
    await vi.waitFor(() => expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1);
  });

  it("keeps Facebook Pixel reporting alongside the private behavior log", async () => {
    const fetchMock = installBrowserMocks({ facebook: true });
    const { trackPageView, trackSharedReportCtaClicked } = await import("./analytics");
    await trackPageView("/");
    await trackSharedReportCtaClicked("share-3");
    await vi.waitFor(() => expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(2));
    expect(window.fbq?.queue?.[1]?.[1]).toBe("PageView");
    expect(window.fbq?.queue?.[2]?.[1]).toBe("SharedReportCtaClicked");
  });

  it("uses bounded delayed retries when the behavior endpoint fails", async () => {
    vi.useFakeTimers();
    const fetchMock = installBrowserMocks({ eventStatus: 500 });
    const { trackReportShared } = await import("./analytics");
    const handoff = trackReportShared("share-2", "system");
    await vi.advanceTimersByTimeAsync(1_000);
    await handoff;
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(4);
  });
});
