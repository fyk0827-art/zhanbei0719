package com.lifeblueprint.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.repository.UserBehaviorEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
public class UserBehaviorLogService {
    private static final Logger log = LoggerFactory.getLogger(UserBehaviorLogService.class);
    private static final Set<String> EVENTS = Set.of(
        "PageView", "EmailVerified", "PersonalDetailsCompleted", "QuizCompleted", "PreviewReportViewed",
        "CheckoutStarted", "PurchaseCompleted", "FullReportViewed", "ShareLinkCreated", "ReportShared",
        "SharedReportViewed", "SharedReportCtaClicked"
    );
    private static final Set<String> SAFE_PROPERTIES = Set.of(
        "value", "currency", "content_type", "report_type", "question_count", "status", "source", "method"
    );

    private final UserBehaviorEventRepository repository;
    private final ObjectMapper json;

    public UserBehaviorLogService(UserBehaviorEventRepository repository, ObjectMapper json) {
        this.repository = repository;
        this.json = json;
    }

    public boolean recordClient(AnalyticsEventRequest event) {
        if (event == null) throw new IllegalArgumentException("Behavior event is required");
        return record(event.eventName(), event.eventId(), event.occurredAt(), "CLIENT", event.path(),
            event.sessionId(), event.contactId(), event.reportId(), event.properties());
    }

    public boolean recordServer(String eventName, String eventId, long occurredAt, String path,
                                String reportId, Map<String, Object> properties) {
        try {
            return record(eventName, eventId, occurredAt, "SERVER", path, null, null, reportId, properties);
        } catch (RuntimeException error) {
            log.error("USER_BEHAVIOR_FAILED event={} eventId={} source=SERVER report={} error={}",
                safe(eventName, 64), safe(eventId, 128), safe(reportId, 32), safe(error.getMessage(), 256));
            return false;
        }
    }

    private boolean record(String eventName, String eventId, Long occurredAt, String source, String path,
                           String sessionId, String contactId, String reportId, Map<String, Object> properties) {
        String safeEvent = required(eventName, 64, "eventName");
        if (!EVENTS.contains(safeEvent)) throw new IllegalArgumentException("Unsupported behavior event");
        String safeEventId = required(eventId, 128, "eventId");
        long now = System.currentTimeMillis();
        long safeOccurredAt = occurredAt == null || occurredAt <= 0 || occurredAt > now + 300_000 ? now : occurredAt;
        String safePath = cleanPath(path);
        String safeProperties = toJson(properties);
        boolean inserted = repository.insert(safeEvent, safeEventId, safeOccurredAt, source, safePath,
            safe(sessionId, 64), safe(contactId, 36), safe(reportId, 32), safeProperties, now);
        log.info("USER_BEHAVIOR event={} eventId={} source={} session={} contact={} report={} path={} recorded={}",
            safeEvent, safeEventId, source, safe(sessionId, 64), safe(contactId, 36), safe(reportId, 32), safePath, inserted);
        return inserted;
    }

    private String toJson(Map<String, Object> properties) {
        Map<String, Object> clean = new LinkedHashMap<>();
        if (properties != null) {
            properties.forEach((key, value) -> {
                if (SAFE_PROPERTIES.contains(key) && (value instanceof String || value instanceof Number || value instanceof Boolean)) {
                    clean.put(key, value instanceof String ? safe((String) value, 128) : value);
                }
            });
        }
        try {
            return json.writeValueAsString(clean);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private static String cleanPath(String value) {
        String path = safe(value, 400);
        if (path == null || path.isBlank() || !path.startsWith("/")) return "/";
        int query = path.indexOf('?');
        int hash = path.indexOf('#');
        int end = query < 0 ? path.length() : query;
        if (hash >= 0) end = Math.min(end, hash);
        return path.substring(0, end);
    }

    private static String required(String value, int max, String field) {
        String clean = safe(value, max);
        if (clean == null || clean.isBlank()) throw new IllegalArgumentException(field + " is required");
        return clean;
    }

    private static String safe(String value, int max) {
        if (value == null) return null;
        String clean = value.replaceAll("[\\r\\n\\t]", " ").trim();
        return clean.length() <= max ? clean : clean.substring(0, max);
    }
}
