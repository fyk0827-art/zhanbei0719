package com.lifeblueprint.web;

import com.lifeblueprint.repository.FacebookConversionsRepository;
import com.lifeblueprint.service.FacebookConversionsService;
import com.qacollector.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {
    private final FacebookConversionsRepository repository;
    private final FacebookConversionsService conversions;

    public AdminAnalyticsController(FacebookConversionsRepository repository, FacebookConversionsService conversions) {
        this.repository = repository;
        this.conversions = conversions;
    }

    @GetMapping("/diagnostics")
    public ApiResponse<Map<String, Object>> diagnostics() {
        Map<String, Object> result = repository.diagnostics();
        result.put("capiEnabled", conversions.enabled());
        return ApiResponse.ok(result);
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> test(HttpServletRequest request) {
        if (!conversions.enabled()) return ResponseEntity.badRequest().body(ApiResponse.error("Configure and enable CAPI first"));
        boolean queued = conversions.enqueueTest(AnalyticsController.clientIp(request), request.getHeader("User-Agent"));
        return ResponseEntity.accepted().body(ApiResponse.ok(Map.of("queued", queued)));
    }

    @PostMapping("/retry")
    public ApiResponse<Map<String, Object>> retry() {
        return ApiResponse.ok(Map.of("retried", repository.retryFailed()));
    }
}
