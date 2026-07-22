package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeblueprint.repository.DeliveryRepository;
import com.lifeblueprint.web.dto.SaveReportRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportDeliveryServiceTest {
    @Mock DeliveryRepository repository;
    @Mock TokenService tokens;

    private ReportDeliveryService service;

    @BeforeEach
    void setUp() {
        service = new ReportDeliveryService(repository, tokens, new ObjectMapper());
        when(repository.contactVerified("contact-1")).thenReturn(true);
    }

    @Test
    void createsTokenForFirstSave() {
        when(tokens.create()).thenReturn("new-token");
        when(tokens.hash("new-token")).thenReturn("new-hash");
        when(repository.statusTokenMatches("report-1", "new-hash")).thenReturn(true);

        String result = service.savePreview("report-1", request(null));

        assertEquals("new-token", result);
        verify(repository).enqueuePreviewEmailOnce("report-1");
    }

    @Test
    void reusesBrowserTokenForIdempotentSave() {
        when(tokens.hash("existing-token")).thenReturn("existing-hash");
        when(repository.statusTokenMatches("report-1", "existing-hash")).thenReturn(true);

        String result = service.savePreview("report-1", request("existing-token"));

        assertEquals("existing-token", result);
        verify(tokens, never()).create();
    }

    @Test
    void rejectsACompetingTokenInsteadOfRotatingAccess() {
        when(tokens.create()).thenReturn("losing-token");
        when(tokens.hash("losing-token")).thenReturn("losing-hash");
        when(repository.statusTokenMatches("report-1", "losing-hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
            () -> service.savePreview("report-1", request(null)));
        verify(repository, never()).enqueuePreviewEmailOnce("report-1");
    }

    private SaveReportRequest request(String statusToken) {
        return new SaveReportRequest("preview", null, "Release Test", "contact-1", "en", "full", statusToken);
    }
}
