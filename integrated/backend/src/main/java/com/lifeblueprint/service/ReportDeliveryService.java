package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.repository.DeliveryRepository;
import com.lifeblueprint.web.dto.SaveReportRequest;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ReportDeliveryService {
    private final DeliveryRepository repository;
    private final TokenService tokens;
    private final ObjectMapper json;

    public ReportDeliveryService(DeliveryRepository repository, TokenService tokens, ObjectMapper json) {
        this.repository = repository;
        this.tokens = tokens;
        this.json = json;
    }

    public String savePreview(String reportId, SaveReportRequest request) {
        if (request.contactId() == null || request.contactId().isBlank() || !repository.contactVerified(request.contactId())) {
            throw new IllegalArgumentException("A verified contactId is required");
        }
        try {
            String statusToken = tokens.create();
            String chartJson = request.chartJson() == null ? null : json.writeValueAsString(request.chartJson());
            repository.savePreview(reportId, request.reportText(), chartJson, request.displayName(),
                request.contactId(), normalizeLanguage(request.language()), tokens.hash(statusToken));
            repository.enqueuePreviewEmailOnce(reportId);
            return statusToken;
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException iae) throw iae;
            throw new IllegalArgumentException("Unable to save report input", e);
        }
    }

    public Optional<Map<String, Object>> status(String reportId, String statusToken) {
        if (!canAccess(reportId, statusToken)) {
            return Optional.empty();
        }
        return repository.report(reportId).map(row -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("reportId", reportId);
            body.put("status", row.get("generation_status"));
            body.put("startedAt", row.get("generation_started_at"));
            body.put("completedAt", row.get("generation_completed_at"));
            body.put("attempts", row.get("generation_attempts"));
            body.put("error", row.get("generation_error"));
            if ("COMPLETE".equals(row.get("generation_status"))) {
                body.put("reportText", row.get("full_report_text"));
                body.put("chartJson", parseJson(row.get("chart_json")));
                body.put("displayName", row.get("display_name"));
            }
            return body;
        });
    }

    public boolean canAccess(String reportId, String statusToken) {
        return statusToken != null && !statusToken.isBlank()
            && repository.statusTokenMatches(reportId, tokens.hash(statusToken));
    }

    public Optional<Map<String, Object>> access(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        return repository.reportByAccessToken(tokens.hash(rawToken)).map(row -> {
            String scope = String.valueOf(row.getOrDefault("access_scope", "FULL"));
            boolean paid = row.get("paid") instanceof Number number && number.intValue() == 1;
            boolean full = "COMPLETE".equals(String.valueOf(row.get("generation_status")))
                && ("FULL".equals(scope) || paid);
            if ("FULL".equals(scope) && !full) return null;
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("reportId", row.get("report_id"));
            body.put("displayName", row.get("display_name"));
            body.put("reportText", full ? row.get("full_report_text") : row.get("report_text"));
            body.put("chartJson", parseJson(row.get("chart_json")));
            body.put("language", row.get("language"));
            body.put("completedAt", row.get("generation_completed_at"));
            body.put("accessScope", scope);
            body.put("unlocked", full);
            body.put("paid", paid);
            body.put("generationStatus", row.get("generation_status"));
            return body;
        }).filter(java.util.Objects::nonNull);
    }

    public boolean accessTokenMatchesReport(String rawToken, String reportId) {
        if (rawToken == null || rawToken.isBlank() || reportId == null || reportId.isBlank()) return false;
        return repository.reportByAccessToken(tokens.hash(rawToken))
            .map(row -> reportId.equals(String.valueOf(row.get("report_id"))))
            .orElse(false);
    }

    private JsonNode parseJson(Object value) {
        if (value == null) return null;
        try { return json.readTree(String.valueOf(value)); }
        catch (Exception e) { return null; }
    }
    private static String normalizeLanguage(String value) {
        return value == null || value.isBlank() ? "en" : value.trim().toLowerCase();
    }
}
