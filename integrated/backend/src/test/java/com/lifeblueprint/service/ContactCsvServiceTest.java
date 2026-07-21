package com.lifeblueprint.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ContactCsvServiceTest {
    private final ContactCsvService service = new ContactCsvService();

    @Test
    void exportsUtf8CsvWithVerificationAndIsoDates() {
        long createdAt = Instant.parse("2026-07-21T06:30:00Z").toEpochMilli();
        String csv = new String(service.export(List.of(Map.of(
            "email", "person@example.com",
            "verified_at", createdAt,
            "language", "en",
            "created_at", createdAt,
            "last_seen_at", createdAt
        ))), StandardCharsets.UTF_8);

        assertTrue(csv.startsWith("\uFEFFEmail,Verified,Language,Created At,Last Seen At\r\n"));
        assertTrue(csv.contains("\"person@example.com\",Yes,\"en\",\"2026-07-21T06:30:00Z\""));
    }

    @Test
    void escapesQuotesAndNeutralizesSpreadsheetFormulas() {
        String csv = new String(service.export(List.of(Map.of(
            "email", "=HYPERLINK(\"https://example.com\")",
            "language", "+cmd",
            "created_at", 0L,
            "last_seen_at", 0L
        ))), StandardCharsets.UTF_8);

        assertTrue(csv.contains("\"'=HYPERLINK(\"\"https://example.com\"\")\""));
        assertTrue(csv.contains("\"'+cmd\""));
        assertTrue(csv.contains(",No,"));
    }
}
