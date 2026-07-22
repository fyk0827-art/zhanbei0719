package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class DeepSeekService {
    private static final Pattern HAN_CHARACTERS = Pattern.compile("\\p{IsHan}");
    private final DeliveryConfigService config;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    public DeepSeekService(DeliveryConfigService config, ObjectMapper json) {
        this.config = config;
        this.json = json;
    }

    public String generate(Map<String, Object> report) throws Exception {
        String apiKey = config.deepSeekKey();
        if (apiKey.isBlank()) throw new IllegalStateException("DeepSeek API key is not configured");
        String preview = text(report.get("report_text"), 18000);
        String chart = text(report.get("chart_json"), 30000);
        String name = report.get("display_name") == null ? "the client" : String.valueOf(report.get("display_name"));
        String prompt = buildPrompt(name, preview, chart, LocalDate.now(ZoneOffset.UTC));
        String content = requestCompletion(apiKey, List.of(
                Map.of("role", "system", "content", "You are an expert English-language astrology report writer. Be specific, grounded and compassionate."),
                Map.of("role", "user", "content", prompt)
            ), 0.7);
        if (!containsHan(content)) return content;

        String repaired = requestCompletion(apiKey, List.of(
                Map.of("role", "system", "content", "You are a meticulous English-language editor. Return only the corrected report."),
                Map.of("role", "user", "content", buildEnglishRepairPrompt(content))
            ), 0.2);
        if (containsHan(repaired)) {
            throw new IllegalStateException("DeepSeek returned non-English text after correction");
        }
        return repaired;
    }

    private String requestCompletion(String apiKey, List<Map<String, String>> messages, double temperature) throws Exception {
        Map<String, Object> payload = Map.of(
            "model", config.deepSeekModel(),
            "messages", messages,
            "temperature", temperature,
            "max_tokens", 8000,
            "stream", false
        );
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.deepseek.com/chat/completions"))
            .timeout(Duration.ofMinutes(4))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload)))
            .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("DeepSeek request failed with HTTP " + response.statusCode());
        }
        JsonNode root = json.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("").trim();
        if (content.isBlank()) throw new IllegalStateException("DeepSeek returned an empty report");
        return content;
    }

    static boolean containsHan(String content) {
        return content != null && HAN_CHARACTERS.matcher(content).find();
    }

    static String buildEnglishRepairPrompt(String report) {
        return """
            Edit the report below so every word is in English. Translate any Chinese or other non-English
            prose into natural English while preserving all Markdown headings, emphasis, structure, factual
            meaning, tone, and level of detail. Do not summarize, add commentary, or wrap the result in a
            code fence. Return the complete corrected report only.

            REPORT:
            %s
            """.formatted(report);
    }

    static String buildPrompt(String name, String preview, String chart, LocalDate currentDate) {
        return """
            Create the complete paid Life Blueprint report in English for %s.
            The current date is %s (UTC). Never describe a past date as current or future.
            Use the supplied natal-chart data as the factual source. Expand the preview into a thoughtful,
            structured, practical report covering identity, relationships, career, money, growth challenges,
            timing themes and a concrete action plan. Do not mention AI, prompts, payment, or missing data.
            Write every word of the report in English. Do not use Chinese characters or untranslated
            non-English expressions, even for labels, metaphors, titles, or emphasis.
            The chart JSON contains natal data only. Do not invent current planetary positions, transits,
            ephemeris facts, or dated forecasts. Express timing themes as non-dated life stages or practical
            next-90-day actions unless a date is explicitly present in the supplied source.
            Use Markdown headings and approximately 2500-3500 words.

            PREVIEW:
            %s

            NATAL CHART JSON:
            %s
            """.formatted(name, currentDate, preview, chart);
    }

    private static String text(Object value, int max) {
        String raw = value == null ? "" : String.valueOf(value);
        return raw.length() <= max ? raw : raw.substring(0, max);
    }
}
