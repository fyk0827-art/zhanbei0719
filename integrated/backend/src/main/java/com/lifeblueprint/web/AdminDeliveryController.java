package com.lifeblueprint.web;

import com.lifeblueprint.repository.DeliveryRepository;
import com.lifeblueprint.service.DeliveryConfigService;
import com.lifeblueprint.service.ContactCsvService;
import com.qacollector.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.time.LocalDate;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/admin")
public class AdminDeliveryController {
    private final DeliveryRepository repository;
    private final DeliveryConfigService config;
    private final ContactCsvService contactCsv;
    public AdminDeliveryController(DeliveryRepository repository, DeliveryConfigService config, ContactCsvService contactCsv) {
        this.repository = repository;
        this.config = config;
        this.contactCsv = contactCsv;
    }

    @GetMapping("/contacts")
    public ApiResponse<Map<String, Object>> contacts(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "all") String verified
    ) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, pageSize));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", repository.adminContacts(search, verified, (safePage - 1) * safeSize, safeSize));
        body.put("total", repository.adminContactCount(search, verified));
        body.put("page", safePage);
        body.put("pageSize", safeSize);
        return ApiResponse.ok(body);
    }

    @GetMapping("/contacts/export")
    public ResponseEntity<byte[]> exportContacts(
        @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "all") String verified
    ) {
        byte[] csv = contactCsv.export(repository.adminContactsForExport(search, verified));
        String filename = "divinlove-contacts-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .body(csv);
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
