import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface BrowserMocks {
  fetchMock: ReturnType<typeof vi.fn>;
  laTrack: ReturnType<typeof vi.fn>;
}

function storageThatThrows(): Storage {
  return {
    get length() { return 0; },
    clear: () => undefined,
    getItem: () => { throw new Error("Storage denied"); },
    key: () => null,
    removeItem: () => undefined,
    setItem: () => { throw new Error("Storage denied"); },
  };
}

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function installBrowserMocks(options: { la51?: boolean; facebook?: boolean; capiStatus?: number } = {}): BrowserMocks {
  const laTrack = vi.fn();
  const scripts = new Map<string, EventTarget & Record<string, unknown>>();
  const documentMock = {
    cookie: "",
    getElementById: (id: string) => scripts.get(id) || null,
    createElement: () => {
      const script = Object.assign(new EventTarget(), { dataset: {} as Record<string, string> });
      return script;
    },
    head: {
      appendChild: (script: EventTarget & { id?: string }) => {
        if (script.id) scripts.set(script.id, script as EventTarget & Record<string, unknown>);
        window.LA = { init: vi.fn(), track: laTrack };
        script.dispatchEvent(new Event("load"));
      },
    },
  };
  const history = { replaceState: vi.fn(), state: {} };
  const location = { hostname: "divinlove.com", pathname: "/", search: "", hash: "" };
  const windowMock = Object.assign(globalThis, {
    document: documentMock,
    location,
    history,
    sessionStorage: storageThatThrows(),
    localStorage: storageThatThrows(),
    LA: undefined,
    fbq: undefined,
    _fbq: undefined,
  });
  vi.stubGlobal("window", windowMock);
  vi.stubGlobal("document", documentMock);
  vi.stubGlobal("sessionStorage", windowMock.sessionStorage);
  vi.stubGlobal("localStorage", windowMock.localStorage);

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/settings/public") {
      return new Response(JSON.stringify({
        success: true,
        data: {
          reportPrice: 0.01,
          la51Enabled: Boolean(options.la51),
          la51SiteId: options.la51 ? "site-id" : "",
          la51Ck: options.la51 ? "site-ck" : "",
          facebookPixelEnabled: Boolean(options.facebook),
          facebookPixelId: options.facebook ? "2046058972690279" : "",
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url === "/api/analytics/events") {
      return new Response("", { status: options.capiStatus ?? 202 });
    }
    return new Response("", { status: 202 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, laTrack };
}

function callsFor(fetchMock: ReturnType<typeof vi.fn>, path: string) {
  return fetchMock.mock.calls.filter(([input]) => String(input) === path);
}

describe("analytics delivery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends a no-storage event once to 51.LA and CAPI", async () => {
    const { fetchMock, laTrack } = installBrowserMocks({ la51: true });
    const { trackReportShared } = await import("./analytics");

    await trackReportShared("share-1", "clipboard");
    await vi.waitFor(() => expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(laTrack).toHaveBeenCalledTimes(1);
    expect(laTrack).toHaveBeenCalledWith("ReportShared");
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1);
  });

  it("finishes when browser storage is unavailable", async () => {
    const { fetchMock, laTrack } = installBrowserMocks({ la51: true });
    const { trackEmailVerified } = await import("./analytics");

    await trackEmailVerified("contact-1");
    await vi.waitFor(() => expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(laTrack).toHaveBeenCalledTimes(1);
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1);
  });

  it("does not let an old persisted marker suppress a 51.LA retry", async () => {
    const { laTrack } = installBrowserMocks({ la51: true });
    const contactId = "contact-retry";
    const marker = `divinlove_analytics_la51_email:${contactId}`;
    const session = memoryStorage({ [marker]: "1" });
    vi.stubGlobal("sessionStorage", session);
    window.sessionStorage = session;
    const { trackEmailVerified } = await import("./analytics");

    await trackEmailVerified(contactId);
    await vi.waitFor(() => expect(laTrack).toHaveBeenCalledTimes(1));

    expect(laTrack).toHaveBeenCalledWith("EmailVerified");
  });

  it("sends PageView and CTA once through Facebook Pixel", async () => {
    const { fetchMock } = installBrowserMocks({ facebook: true });
    const { trackPageView, trackSharedReportCtaClicked } = await import("./analytics");

    await trackPageView("/");
    await trackSharedReportCtaClicked("share-3");
    await vi.waitFor(() => expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(window.fbq?.queue).toHaveLength(3);
    expect(window.fbq?.queue?.[1]?.[0]).toBe("track");
    expect(window.fbq?.queue?.[1]?.[1]).toBe("PageView");
    expect(window.fbq?.queue?.[2]?.[0]).toBe("trackCustom");
    expect(window.fbq?.queue?.[2]?.[1]).toBe("SharedReportCtaClicked");
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(2);
  });

  it("uses bounded delayed retries for CAPI failures", async () => {
    vi.useFakeTimers();
    const { fetchMock } = installBrowserMocks({ capiStatus: 500 });
    const { trackReportShared } = await import("./analytics");

    const handoff = trackReportShared("share-2", "system");
    await vi.advanceTimersByTimeAsync(500);
    await handoff;
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(callsFor(fetchMock, "/api/analytics/events")).toHaveLength(4);
    expect(callsFor(fetchMock, "/api/analytics/diagnostics")).toHaveLength(1);
  });
});
