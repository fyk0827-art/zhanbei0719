package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.repository.FacebookConversionsRepository;
import com.qacollector.service.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacebookConversionsServiceTest {
    @Mock FacebookConversionsRepository repository;
    @Mock SettingsService settings;

    private FacebookConversionsService service;

    @BeforeEach
    void setUp() {
        service = new FacebookConversionsService(repository, settings, new ObjectMapper());
    }

    @Test
    void rejectsEventsOutsideTheFixedWhitelist() {
        AnalyticsEventRequest request = new AnalyticsEventRequest(
            "ArbitraryRevenue", "event:1234", System.currentTimeMillis(), "/generator",
            null, null, null, null, Map.of("value", 9999));

        assertThrows(IllegalArgumentException.class, () -> service.enqueueClient(request, "127.0.0.1", "test"));
        verifyNoInteractions(repository);
    }

    @Test
    void disabledCapiDoesNotQueueClientEvents() {
        when(settings.isFacebookCapiEnabled()).thenReturn(false);
        AnalyticsEventRequest request = new AnalyticsEventRequest(
            "EmailVerified", "email:contact-1234", System.currentTimeMillis(), "/generator?token=private",
            "contact-1234", null, null, null, Map.of("source", "email_verification"));

        assertFalse(service.enqueueClient(request, "127.0.0.1", "test"));
        verifyNoInteractions(repository);
    }

    @Test
    void enabledCapiQueuesMappedEventWithSanitizedUrl() {
        when(settings.isFacebookCapiEnabled()).thenReturn(true);
        when(settings.getFacebookCapiAccessToken()).thenReturn("token");
        when(settings.getFacebookPixelId()).thenReturn("2046058972690279");
        when(repository.enqueue(anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any(), any(), any(), anyString()))
            .thenReturn(true);
        AnalyticsEventRequest request = new AnalyticsEventRequest(
            "PreviewReportViewed", "preview:report-1234", System.currentTimeMillis(), "/report-access?token=private",
            null, "report-1234", "fb.1.123.456", null,
            Map.of("content_type", "preview_report", "private_value", "must-not-pass"));

        assertTrue(service.enqueueClient(request, "127.0.0.1", "test-agent"));
        verify(repository).enqueue(eq("PreviewReportViewed"), eq("ViewContent"), eq("preview:report-1234"),
            anyLong(), eq("https://divinlove.com/report-access"), isNull(), eq("report-1234"),
            eq("127.0.0.1"), eq("test-agent"), eq("fb.1.123.456"), isNull(),
            argThat(json -> json.contains("content_type") && !json.contains("private_value")));
    }

    @Test
    void serverSideAnalyticsFailureNeverBreaksPaymentFlow() {
        when(settings.isFacebookCapiEnabled()).thenReturn(true);
        when(settings.getFacebookCapiAccessToken()).thenReturn("token");
        when(settings.getFacebookPixelId()).thenReturn("2046058972690279");
        when(repository.enqueue(anyString(), anyString(), anyString(), anyLong(), anyString(), any(), any(), any(), any(), any(), any(), anyString()))
            .thenThrow(new IllegalStateException("database unavailable"));

        assertFalse(service.enqueueServer("PurchaseCompleted", "CAPTURE-1234", System.currentTimeMillis(),
            "/generator/final-report", "report-1234", "127.0.0.1", "test-agent", null, null,
            Map.of("value", 0.01, "currency", "USD")));
    }
}
