package com.lifeblueprint.web;

import com.lifeblueprint.repository.DeliveryRepository;
import com.lifeblueprint.service.DeliveryConfigService;
import com.qacollector.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminDeliveryController {
    private final DeliveryRepository repository;
    private final DeliveryConfigService config;
    public AdminDeliveryController(DeliveryRepository repository, DeliveryConfigService config) {
        this.repository = repository;
        this.config = config;
    }

    @GetMapping("/orders")
    public ApiResponse<Map<String, Object>> orders(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "") String status
    ) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, pageSize));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", repository.adminOrders(search, status, (safePage - 1) * safeSize, safeSize));
        body.put("total", repository.adminOrderCount(search, status));
        body.put("page", safePage);
        body.put("pageSize", safeSize);
        return ApiResponse.ok(body);
    }

    @PostMapping("/reports/{reportId}/retry")
    public ResponseEntity<ApiResponse<Void>> retryReport(@PathVariable String reportId) {
        if (!repository.retryReport(reportId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                "Only a paid report that is not already running can be regenerated"));
        }
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/reports/{reportId}/resend")
    public ResponseEntity<ApiResponse<Void>> resend(@PathVariable String reportId) {
        if (!repository.retryEmail(reportId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(
                "Email can only be resent for a completed paid report"));
        }
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/delivery-settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> settings() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.ok(config.adminSettings()));
    }

    @PutMapping("/delivery-settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestBody Map<String, Object> body) {
        config.update(body);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.ok(config.adminSettings()));
    }
}
