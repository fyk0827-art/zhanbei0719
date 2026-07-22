package com.lifeblueprint.web;

import com.lifeblueprint.repository.FacebookConversionsRepository;
import com.lifeblueprint.service.AnalyticsEventRequest;
import com.lifeblueprint.service.FacebookConversionsService;
import com.lifeblueprint.service.UserBehaviorLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private static final Set<String> PROVIDERS = Set.of("facebook", "capi", "behavior");
    private static final Set<String> STATUSES = Set.of("READY", "SDK_CALLED", "EVENT_SENT", "ERROR");
    private final FacebookConversionsService conversions;
    private final FacebookConversionsRepository repository;
    private final UserBehaviorLogService behaviorLogs;

    public AnalyticsController(FacebookConversionsService conversions, FacebookConversionsRepository repository,
                               UserBehaviorLogService behaviorLogs) {
        this.conversions = conversions;
        this.repository = repository;
        this.behaviorLogs = behaviorLogs;
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> event(@RequestBody AnalyticsEventRequest event, HttpServletRequest request) {
        boolean logged = behaviorLogs.recordClient(event);
        boolean capiQueued = conversions.enabled() && conversions.enqueueClient(event, clientIp(request), request.getHeader("User-Agent"));
        return ResponseEntity.accepted().body(Map.of("logged", logged, "capiQueued", capiQueued));
    }

    @PostMapping("/diagnostics")
    public ResponseEntity<Void> diagnostic(@RequestBody Map<String, String> body) {
        String provider = safe(body.get("provider"), 32);
        String status = safe(body.get("status"), 24);
        if (!PROVIDERS.contains(provider) || !STATUSES.contains(status)) throw new IllegalArgumentException("Invalid analytics diagnostic");
        repository.providerDiagnostic(provider, status, safe(body.get("event"), 64), safe(body.get("error"), 512));
        return ResponseEntity.accepted().build();
    }

    public static String clientIp(HttpServletRequest request) {
        String cloudflare = request.getHeader("CF-Connecting-IP");
        if (cloudflare != null && !cloudflare.isBlank()) return safe(cloudflare, 64);
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return safe(forwarded.split(",")[0].trim(), 64);
        return safe(request.getRemoteAddr(), 64);
    }

    private static String safe(String value, int max) {
        if (value == null) return null;
        String clean = value.replaceAll("[\\r\\n]", "").trim();
        return clean.length() <= max ? clean : clean.substring(0, max);
    }
}
