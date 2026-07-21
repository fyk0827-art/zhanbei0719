package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.repository.DeliveryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class ReportShareService {
    private final DeliveryRepository repository;
    private final ReportDeliveryService delivery;
    private final TokenService tokens;
    private final ObjectMapper json;
    private final PaymentProperties properties;

    public ReportShareService(DeliveryRepository repository, ReportDeliveryService delivery,
                              TokenService tokens, ObjectMapper json, PaymentProperties properties) {
        this.repository = repository;
        this.delivery = delivery;
        this.tokens = tokens;
        this.json = json;
        this.properties = properties;
    }

    public Optional<Map<String, Object>> create(String reportId, String statusToken, String accessToken) {
        boolean owner = delivery.canAccess(reportId, statusToken)
            || delivery.accessTokenMatchesReport(accessToken, reportId);
        if (!owner || !repository.shareEligible(reportId)) return Optional.empty();
        String shareId = repository.createOrGetShare(reportId, tokens.create());
        return Optional.of(Map.of(
            "shareId", shareId,
            "shareUrl", properties.getFrontendUrl() + "/shared-report/" + shareId
        ));
    }

    public Optional<Map<String, Object>> get(String shareId) {
        if (shareId == null || !shareId.matches("[A-Za-z0-9_-]{32,64}")) return Optional.empty();
        return repository.sharedReport(shareId).flatMap(this::sanitize);
    }

    private Optional<Map<String, Object>> sanitize(Map<String, Object> row) {
        try {
            JsonNode parsed = json.readTree(text(row.get("chart_json")));
            if (!(parsed instanceof ObjectNode chart)
                || !(chart.get("birthData") instanceof ObjectNode birth)) return Optional.empty();
            String fullName = text(row.get("display_name"));
            String firstName = firstName(fullName);
            int age = age(birth);
            String gender = validGender(birth.path("gender").asText(""));
            String reportText = sanitizeText(text(row.get("full_report_text")), fullName, firstName, birth);

            birth.removeAll();
            birth.put("gender", gender);
            chart.remove("julianDay");

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("displayName", firstName);
            body.put("age", age);
            body.put("gender", gender);
            body.put("reportText", reportText);
            body.put("chartJson", chart);
            body.put("language", text(row.get("language")).isBlank() ? "en" : text(row.get("language")));
            return Optional.of(body);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private static String sanitizeText(String value, String fullName, String firstName, ObjectNode birth) {
        String result = value;
        if (!fullName.isBlank() && !fullName.equals(firstName)) result = result.replace(fullName, firstName);
        int year = birth.path("year").asInt(0);
        int month = birth.path("month").asInt(0);
        int day = birth.path("day").asInt(0);
        int hour = birth.path("hour").asInt(-1);
        int minute = birth.path("minute").asInt(-1);
        if (year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            String[] dates = {
                "%04d-%02d-%02d".formatted(year, month, day),
                "%02d/%02d/%04d".formatted(month, day, year),
                "%d/%d/%04d".formatted(month, day, year),
                "%s %d, %04d".formatted(monthName, day, year)
            };
            for (String date : dates) result = result.replace(date, "your birth date");
        }
        if (hour >= 0 && minute >= 0) {
            result = result.replace("%02d:%02d".formatted(hour, minute), "your birth time");
            int twelveHour = hour % 12 == 0 ? 12 : hour % 12;
            String suffix = hour < 12 ? "AM" : "PM";
            result = result.replace("%d:%02d %s".formatted(twelveHour, minute, suffix), "your birth time");
        }
        for (String key : new String[]{"latitude", "longitude"}) {
            JsonNode coordinate = birth.get(key);
            if (coordinate != null && coordinate.isNumber()) {
                result = result.replace(coordinate.asText(), "your birth location");
            }
        }
        return result;
    }

    private static int age(ObjectNode birth) {
        try {
            LocalDate born = LocalDate.of(
                birth.path("year").asInt(), birth.path("month").asInt(), birth.path("day").asInt());
            LocalDate today = LocalDate.now();
            int value = today.getYear() - born.getYear();
            if (today.isBefore(born.plusYears(value))) value--;
            return Math.max(0, Math.min(120, value));
        } catch (Exception e) {
            return 0;
        }
    }

    private static String firstName(String value) {
        String trimmed = value.trim();
        return trimmed.isBlank() ? "You" : trimmed.split("\\s+", 2)[0];
    }

    private static String validGender(String value) {
        return "male".equals(value) ? "male" : "female";
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
