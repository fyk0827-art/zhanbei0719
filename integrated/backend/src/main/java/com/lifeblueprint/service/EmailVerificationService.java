package com.lifeblueprint.service;

import com.lifeblueprint.repository.DeliveryRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class EmailVerificationService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final long CODE_TTL_MS = 10 * 60_000L;
    private static final long RESEND_DELAY_MS = 60_000L;

    private final DeliveryRepository repository;
    private final SmtpEmailService emailService;
    private final TokenService tokens;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(DeliveryRepository repository, SmtpEmailService emailService, TokenService tokens) {
        this.repository = repository;
        this.emailService = emailService;
        this.tokens = tokens;
    }

    public Map<String, Object> sendCode(String rawEmail, String rawLanguage) {
        String email = validateEmail(rawEmail);
        String normalized = email.toLowerCase(Locale.ROOT);
        long now = System.currentTimeMillis();
        repository.verification(normalized).ifPresent(existing -> {
            long availableAt = ((Number) existing.getOrDefault("resend_available_at", 0L)).longValue();
            if (availableAt > now) {
                long seconds = Math.max(1, (availableAt - now + 999) / 1000);
                throw new IllegalArgumentException("Please wait " + seconds + " seconds before requesting another code");
            }
        });

        String language = normalizeLanguage(rawLanguage);
        String contactId = repository.upsertContact(email, normalized, language);
        String code = String.format("%06d", random.nextInt(1_000_000));
        try {
            emailService.sendVerificationCode(email, code);
        } catch (Exception e) {
            throw new IllegalStateException("We couldn't send the verification email. Please try again shortly.", e);
        }
        repository.saveVerification(normalized, contactId, hash(normalized, code),
            now + CODE_TTL_MS, now + RESEND_DELAY_MS);
        return Map.of("email", email, "expiresInSeconds", 600, "resendAfterSeconds", 60);
    }

    public Map<String, Object> verifyCode(String rawEmail, String rawCode, String rawLanguage) {
        String email = validateEmail(rawEmail);
        String normalized = email.toLowerCase(Locale.ROOT);
        String code = rawCode == null ? "" : rawCode.trim();
        if (!code.matches("\\d{6}")) throw new IllegalArgumentException("Enter the 6-digit verification code");
        if (!repository.verifyEmailCode(normalized, hash(normalized, code), System.currentTimeMillis())) {
            throw new IllegalArgumentException("The verification code is incorrect or has expired");
        }
        Map<String, Object> contact = repository.verifiedContact(normalized)
            .orElseThrow(() -> new IllegalArgumentException("Unable to verify this email"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("contactId", contact.get("id"));
        result.put("email", contact.get("email"));
        result.put("language", contact.getOrDefault("language", normalizeLanguage(rawLanguage)));
        result.put("verified", true);
        return result;
    }

    private String hash(String normalizedEmail, String code) {
        return tokens.hash(normalizedEmail + ":" + code);
    }

    private static String validateEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) throw new IllegalArgumentException("Email is required");
        String email = rawEmail.trim();
        if (email.length() > 320 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Enter a valid email address");
        }
        return email;
    }

    private static String normalizeLanguage(String value) {
        return value == null || value.isBlank() ? "en" : value.trim().toLowerCase(Locale.ROOT);
    }
}
