package com.lifeblueprint.service;

import com.lifeblueprint.repository.DeliveryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class ReportDeliveryWorker {
    private final DeliveryRepository repository;
    private final DeepSeekService deepSeek;
    private final SmtpEmailService emailService;
    private final TokenService tokens;

    public ReportDeliveryWorker(DeliveryRepository repository, DeepSeekService deepSeek,
                                SmtpEmailService emailService, TokenService tokens) {
        this.repository = repository;
        this.deepSeek = deepSeek;
        this.emailService = emailService;
        this.tokens = tokens;
    }

    @Scheduled(fixedDelay = 3000, initialDelay = 5000)
    public void run() {
        repository.recoverStaleJobs(System.currentTimeMillis() - 5 * 60_000L);
        repository.nextQueuedReportId().ifPresent(this::generate);
        repository.nextPendingEmail().ifPresent(this::sendEmail);
    }

    private void generate(String reportId) {
        if (!repository.claim(reportId)) return;
        Map<String, Object> row = repository.report(reportId).orElse(null);
        if (row == null) return;
        try {
            String fullReport = deepSeek.generate(row);
            repository.complete(reportId, fullReport);
            Object email = row.get("email");
            if (email != null && !String.valueOf(email).isBlank()) repository.enqueueEmail(reportId, String.valueOf(email));
        } catch (Exception e) {
            int attempts = ((Number) row.getOrDefault("generation_attempts", 1)).intValue();
            repository.generationFailed(reportId, e.getMessage(), attempts < 3);
            log.warn("Report generation failed for {} (attempt {}): {}", reportId, attempts, e.getMessage());
        }
    }

    private void sendEmail(Map<String, Object> emailRow) {
        long id = ((Number) emailRow.get("id")).longValue();
        if (!repository.claimEmail(id)) return;
        String reportId = String.valueOf(emailRow.get("report_id"));
        try {
            Map<String, Object> report = repository.report(reportId).orElseThrow();
            String token = tokens.create();
            repository.createAccessToken(reportId, tokens.hash(token));
            String providerId = emailService.sendReport(String.valueOf(emailRow.get("recipient_email")),
                report.get("display_name") == null ? "" : String.valueOf(report.get("display_name")), token);
            repository.emailSent(id, providerId);
        } catch (Exception e) {
            repository.emailFailed(id, e.getMessage());
            log.warn("Report email failed for {}: {}", reportId, e.getMessage());
        }
    }
}
