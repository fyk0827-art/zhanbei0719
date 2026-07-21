package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.repository.DeliveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportShareServiceTest {
    @Mock DeliveryRepository repository;
    @Mock ReportDeliveryService delivery;
    @Mock TokenService tokens;

    private ReportShareService service;

    @BeforeEach
    void setUp() {
        PaymentProperties properties = new PaymentProperties();
        properties.setFrontendUrl("https://divinlove.com");
        service = new ReportShareService(repository, delivery, tokens, new ObjectMapper(), properties);
    }

    @Test
    void createsStableShareOnlyForAuthorizedEligibleReport() {
        when(delivery.canAccess("report-1", "owner-token")).thenReturn(true);
        when(repository.shareEligible("report-1")).thenReturn(true);
        when(tokens.create()).thenReturn("generated-share-id-abcdefghijklmnopqrstuvwxyz");
        when(repository.createOrGetShare("report-1", "generated-share-id-abcdefghijklmnopqrstuvwxyz"))
            .thenReturn("stable-share-id-abcdefghijklmnopqrstuvwxyz12");

        Map<String, Object> result = service.create("report-1", "owner-token", null).orElseThrow();

        assertEquals("stable-share-id-abcdefghijklmnopqrstuvwxyz12", result.get("shareId"));
        assertEquals("https://divinlove.com/shared-report/stable-share-id-abcdefghijklmnopqrstuvwxyz12", result.get("shareUrl"));
    }

    @Test
    void rejectsUnauthorizedShareCreation() {
        when(delivery.canAccess("report-1", "wrong")).thenReturn(false);
        when(delivery.accessTokenMatchesReport(null, "report-1")).thenReturn(false);

        assertTrue(service.create("report-1", "wrong", null).isEmpty());
        verify(repository, never()).shareEligible(anyString());
    }

    @Test
    void removesPrivateBirthFieldsAndKeepsFirstName() {
        String chart = """
            {"birthData":{"year":1990,"month":7,"day":8,"hour":14,"minute":5,
             "latitude":22.5431,"longitude":114.0579,"timezone":8,"gender":"female","name":"Judica Heventh"},
             "julianDay":2448080.087,"planets":[],"houses":[],"angles":{},"aspects":[],"sunSign":"Leo","moonSign":"Cancer","risingSign":"Libra"}
            """;
        String report = "Judica Heventh was born on 1990-07-08 at 14:05 near 22.5431, 114.0579.";
        when(repository.sharedReport("abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG"))
            .thenReturn(Optional.of(Map.of(
                "display_name", "Judica Heventh",
                "full_report_text", report,
                "chart_json", chart,
                "language", "en"
            )));

        Map<String, Object> result = service.get("abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG").orElseThrow();
        JsonNode publicBirth = ((JsonNode) result.get("chartJson")).path("birthData");
        String publicText = String.valueOf(result.get("reportText"));

        assertEquals("Judica", result.get("displayName"));
        assertEquals("female", publicBirth.path("gender").asText());
        assertEquals(1, publicBirth.size());
        assertFalse(((JsonNode) result.get("chartJson")).has("julianDay"));
        assertFalse(publicText.contains("Heventh"));
        assertFalse(publicText.contains("1990-07-08"));
        assertFalse(publicText.contains("14:05"));
        assertFalse(publicText.contains("22.5431"));
        assertFalse(publicText.contains("114.0579"));
    }
}
