package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.repository.FacebookConversionsRepository;
import com.qacollector.service.SettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class FacebookConversionsService {
    private static final Set<String> CLIENT_EVENTS = Set.of(
        "PageView", "EmailVerified", "PersonalDetailsCompleted", "QuizCompleted",
        "PreviewReportViewed", "FullReportViewed", "ShareLinkCreated", "ReportShared",
        "SharedReportViewed", "SharedReportCtaClicked"
    );
    private static final Map<String, String> META_NAMES = Map.ofEntries(
        Map.entry("PageView", "PageView"),
        Map.entry("EmailVerified", "Lead"),
        Map.entry("PersonalDetailsCompleted", "CompleteRegistration"),
        Map.entry("QuizCompleted", "QuizCompleted"),
        Map.entry("PreviewReportViewed", "ViewContent"),
        Map.entry("CheckoutStarted", "InitiateCheckout"),
        Map.entry("PurchaseCompleted", "Purchase"),
        Map.entry("FullReportViewed", "FullReportViewed"),
        Map.entry("ShareLinkCreated", "ShareLinkCreated"),
        Map.entry("ReportShared", "ReportShared"),
        Map.entry("SharedReportViewed", "SharedReportViewed"),
        Map.entry("SharedReportCtaClicked", "SharedReportCtaClicked"),
        Map.entry("AnalyticsTest", "AnalyticsTest")
    );

    private final FacebookConversionsRepository repository;
    private final SettingsService settings;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public FacebookConversionsService(FacebookConversionsRepository repository, SettingsService settings, ObjectMapper json) {
        this.repository = repository;
        this.settings = settings;
        this.json = json;
    }

    public boolean enqueueClient(AnalyticsEventRequest event, String clientIp, String userAgent) {
        if (event == null || !CLIENT_EVENTS.contains(event.eventName())) throw new IllegalArgumentException("Unsupported analytics event");
        if (!enabled()) return false;
        return enqueue(event.eventName(), event.eventId(), event.occurredAt(), event.path(), event.contactId(),
            event.reportId(), clientIp, userAgent, event.fbp(), event.fbc(), sanitizeCustom(event.properties()));
    }

    public boolean enqueueServer(String sourceEvent, String eventId, long occurredAt, String path,
                                 String reportId, String clientIp, String userAgent, String fbp,
                                 String fbc, Map<String, Object> customData) {
        try {
            if (!enabled()) return false;
            return enqueue(sourceEvent, eventId, occurredAt, path, null, reportId, clientIp, userAgent,
                fbp, fbc, sanitizeCustom(customData));
        } catch (Exception e) {
            log.warn("Unable to queue Meta CAPI event {}: {}", sourceEvent, e.getMessage());
            return false;
        }
    }

    public boolean enqueueTest(String clientIp, String userAgent) {
        try {
            if (!enabled()) return false;
            return enqueue("AnalyticsTest", "test:" + java.util.UUID.randomUUID(), System.currentTimeMillis(),
                "/admin/analytics-test", null, null, clientIp, userAgent, null, null,
                Map.of("test_event", true));
        } catch (Exception e) {
            log.warn("Unable to queue Meta CAPI test event: {}", e.getMessage());
            return false;
        }
    }

    private boolean enqueue(String sourceEvent, String eventId, Long occurredAt, String path,
                            String contactId, String reportId, String clientIp, String userAgent,
                            String fbp, String fbc, Map<String, Object> customData) {
        if (!META_NAMES.containsKey(sourceEvent)) throw new IllegalArgumentException("Unsupported analytics event");
        String safeId = require(eventId, 128, "eventId");
        long safeTime = occurredAt == null ? System.currentTimeMillis() : occurredAt;
        long now = System.currentTimeMillis();
        if (safeTime < now - 7 * 24 * 60 * 60_000L || safeTime > now + 5 * 60_000L) safeTime = now;
        String sourceUrl = "https://divinlove.com" + sanitizePath(path);
        try {
            return repository.enqueue(sourceEvent, META_NAMES.get(sourceEvent), safeId, safeTime, sourceUrl,
                trim(contactId, 36), trim(reportId, 32), trim(clientIp, 64), trim(userAgent, 512),
                trim(fbp, 255), trim(fbc, 255), json.writeValueAsString(customData));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to queue analytics event", e);
        }
    }

    public void send(long id) throws Exception {
        Map<String, Object> row = repository.event(id).orElseThrow();
        Map<String, Object> userData = new LinkedHashMap<>();
        addHashed(userData, "em", row.get("normalized_email"));
        addHashed(userData, "external_id", row.get("resolved_contact_id"));
        put(userData, "client_ip_address", row.get("client_ip"));
        put(userData, "client_user_agent", row.get("client_user_agent"));
        put(userData, "fbp", row.get("fbp"));
        put(userData, "fbc", row.get("fbc"));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("event_name", row.get("event_name"));
        data.put("event_time", ((Number) row.get("event_time")).longValue() / 1000L);
        data.put("event_id", row.get("event_id"));
        data.put("action_source", "website");
        data.put("event_source_url", row.get("event_source_url"));
        data.put("user_data", userData);
        Object custom = row.get("custom_data");
        if (custom != null) data.put("custom_data", custom instanceof String ? json.readTree(String.valueOf(custom)) : custom);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("data", java.util.List.of(data));
        if (!settings.getFacebookCapiTestCode().isBlank()) payload.put("test_event_code", settings.getFacebookCapiTestCode());
        String endpoint = "https://graph.facebook.com/" + settings.getFacebookCapiApiVersion() + "/"
            + settings.getFacebookPixelId() + "/events";
        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(20))
            .header("Authorization", "Bearer " + settings.getFacebookCapiAccessToken())
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload))).build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            String error = response.body() == null ? "" : response.body().replaceAll("[\\r\\n]", " ").trim();
            if (error.length() > 1000) error = error.substring(0, 1000);
            throw new IllegalStateException("Meta CAPI returned HTTP " + response.statusCode()
                + (error.isBlank() ? "" : ": " + error));
        }
        JsonNode body = json.readTree(response.body());
        if (body.path("events_received").asInt(0) < 1) throw new IllegalStateException("Meta CAPI did not accept the event");
        repository.sent(id, body.path("fbtrace_id").asText(""));
    }

    public boolean enabled() {
        return settings.isFacebookCapiEnabled() && !settings.getFacebookCapiAccessToken().isBlank()
            && !settings.getFacebookPixelId().isBlank();
    }

    private static Map<String, Object> sanitizeCustom(Map<String, Object> input) {
        if (input == null || input.isEmpty()) return Map.of();
        Map<String, Object> result = new LinkedHashMap<>();
        Set<String> allowed = Set.of("value", "currency", "content_type", "report_type", "question_count",
            "status", "source", "method", "test_event");
        input.forEach((key, value) -> {
            if (allowed.contains(key) && value != null && String.valueOf(value).length() <= 64) result.put(key, value);
        });
        return result;
    }

    private static String sanitizePath(String value) {
        String path = value == null || value.isBlank() ? "/" : value.trim();
        int query = path.indexOf('?');
        if (query >= 0) path = path.substring(0, query);
        if (!path.startsWith("/") || path.startsWith("//")) return "/";
        return trim(path, 400);
    }

    private static String require(String value, int max, String label) {
        String safe = trim(value, max);
        if (safe == null || safe.isBlank() || !safe.matches("[A-Za-z0-9:_-]{4,128}")) {
            throw new IllegalArgumentException(label + " is invalid");
        }
        return safe;
    }

    private static void addHashed(Map<String, Object> target, String key, Object value) {
        if (value != null && !String.valueOf(value).isBlank()) target.put(key, java.util.List.of(sha256(String.valueOf(value).trim().toLowerCase())));
    }

    private static void put(Map<String, Object> target, String key, Object value) {
        if (value != null && !String.valueOf(value).isBlank()) target.put(key, value);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    private static String trim(Object value, int max) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.length() <= max ? text : text.substring(0, max);
    }
}
