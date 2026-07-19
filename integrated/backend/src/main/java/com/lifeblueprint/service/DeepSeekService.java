package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekService {
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
        String prompt = """
            Create the complete paid Life Blueprint report in English for %s.
            Use the supplied natal-chart data as the factual source. Expand the preview into a thoughtful,
            structured, practical report covering identity, relationships, career, money, growth challenges,
            timing themes and a concrete action plan. Do not mention AI, prompts, payment, or missing data.
            Use Markdown headings and approximately 2500-3500 words.

            PREVIEW:
            %s

            NATAL CHART JSON:
            %s
            """.formatted(name, preview, chart);
        Map<String, Object> payload = Map.of(
            "model", config.deepSeekModel(),
            "messages", List.of(
                Map.of("role", "system", "content", "You are an expert English-language astrology report writer. Be specific, grounded and compassionate."),
                Map.of("role", "user", "content", prompt)
            ),
            "temperature", 0.7,
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

    private static String text(Object value, int max) {
        String raw = value == null ? "" : String.valueOf(value);
        return raw.length() <= max ? raw : raw.substring(0, max);
    }
}
