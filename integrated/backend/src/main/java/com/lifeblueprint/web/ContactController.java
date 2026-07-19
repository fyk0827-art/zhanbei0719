package com.lifeblueprint.web;

import com.lifeblueprint.repository.DeliveryRepository;
import com.qacollector.dto.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private final DeliveryRepository repository;
    public ContactController(DeliveryRepository repository) { this.repository = repository; }

    @PostMapping
    public ApiResponse<Map<String, Object>> save(@RequestBody ContactRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String email = request.email().trim();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Enter a valid email address");
        }
        String normalized = email.toLowerCase(Locale.ROOT);
        String language = request.language() == null || request.language().isBlank()
            ? "en" : request.language().trim().toLowerCase(Locale.ROOT);
        return ApiResponse.ok(Map.of("contactId", repository.upsertContact(email, normalized, language), "email", email, "language", language));
    }

    public record ContactRequest(String email, String language) {}
}
