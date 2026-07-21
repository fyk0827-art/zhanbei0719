package com.qacollector.service;

import com.qacollector.dto.AdminSettingsDTO;
import com.qacollector.dto.PublicSettingsDTO;
import com.qacollector.dto.UpdateSettingsRequest;
import com.qacollector.entity.AppSetting;
import com.qacollector.repository.AppSettingRepository;
import com.lifeblueprint.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SettingsService {

    public static final String KEY_QUIZ_QUESTION_COUNT = "quiz_question_count";
    public static final String KEY_PAYMENT_MODE = "payment_mode";
    public static final String KEY_51LA_ENABLED = "analytics_51la_enabled";
    public static final String KEY_51LA_SITE_ID = "analytics_51la_site_id";
    public static final String KEY_51LA_CK = "analytics_51la_ck";
    public static final String KEY_FACEBOOK_PIXEL_ENABLED = "analytics_facebook_pixel_enabled";
    public static final String KEY_FACEBOOK_PIXEL_ID = "analytics_facebook_pixel_id";

    private final AppSettingRepository repository;
    private final PricingService pricingService;

    public int getQuizQuestionCount() {
        return parseInt(getValue(KEY_QUIZ_QUESTION_COUNT, "20"), 20, 1, 50);
    }

    public String getPaymentMode() {
        String mode = getValue(KEY_PAYMENT_MODE, "mock");
        return "live".equalsIgnoreCase(mode) ? "live" : "mock";
    }

    public boolean isLa51Enabled() { return Boolean.parseBoolean(getValue(KEY_51LA_ENABLED, "false")); }
    public String getLa51SiteId() { return getValue(KEY_51LA_SITE_ID, "").trim(); }
    public String getLa51Ck() { return getValue(KEY_51LA_CK, "").trim(); }
    public boolean isFacebookPixelEnabled() { return Boolean.parseBoolean(getValue(KEY_FACEBOOK_PIXEL_ENABLED, "false")); }
    public String getFacebookPixelId() { return getValue(KEY_FACEBOOK_PIXEL_ID, "").trim(); }

    public PublicSettingsDTO getPublicSettings() {
        PublicSettingsDTO dto = new PublicSettingsDTO();
        dto.setQuizQuestionCount(getQuizQuestionCount());
        dto.setReportPrice(pricingService.currentPrice());
        dto.setLa51Enabled(isLa51Enabled());
        dto.setLa51SiteId(getLa51SiteId());
        dto.setLa51Ck(getLa51Ck());
        dto.setFacebookPixelEnabled(isFacebookPixelEnabled());
        dto.setFacebookPixelId(getFacebookPixelId());
        return dto;
    }

    public AdminSettingsDTO getAdminSettings() {
        AdminSettingsDTO dto = new AdminSettingsDTO();
        dto.setQuizQuestionCount(getQuizQuestionCount());
        dto.setPaymentMode(getPaymentMode());
        dto.setLa51Enabled(isLa51Enabled());
        dto.setLa51SiteId(getLa51SiteId());
        dto.setLa51Ck(getLa51Ck());
        dto.setFacebookPixelEnabled(isFacebookPixelEnabled());
        dto.setFacebookPixelId(getFacebookPixelId());
        return dto;
    }

    @Transactional
    public AdminSettingsDTO updateSettings(UpdateSettingsRequest req) {
        if (req.getQuizQuestionCount() != null) {
            int count = parseInt(String.valueOf(req.getQuizQuestionCount()), 20, 1, 50);
            upsert(KEY_QUIZ_QUESTION_COUNT, String.valueOf(count), true,
                "Number of quiz questions shown to users");
        }
        if (req.getPaymentMode() != null) {
            String mode = "live".equalsIgnoreCase(req.getPaymentMode()) ? "live" : "mock";
            upsert(KEY_PAYMENT_MODE, mode, false,
                "Payment mode: mock simulates success; live for future gateway integration");
        }
        if (req.getLa51SiteId() != null) {
            String value = req.getLa51SiteId().trim();
            validateIdentifier(value, "51.LA Site ID");
            upsert(KEY_51LA_SITE_ID, value, true, "51.LA analytics site ID");
        }
        if (req.getLa51Ck() != null) {
            String value = req.getLa51Ck().trim();
            validateIdentifier(value, "51.LA CK");
            upsert(KEY_51LA_CK, value, true, "51.LA analytics CK");
        }
        if (req.getFacebookPixelId() != null) {
            String value = req.getFacebookPixelId().trim();
            if (!value.isEmpty() && !value.matches("[0-9]{5,32}")) {
                throw new IllegalArgumentException("Facebook Pixel ID must contain only digits");
            }
            upsert(KEY_FACEBOOK_PIXEL_ID, value, true, "Facebook Pixel ID");
        }
        if (req.getLa51Enabled() != null) {
            if (req.getLa51Enabled() && (getLa51SiteId().isBlank() || getLa51Ck().isBlank())) {
                throw new IllegalArgumentException("51.LA Site ID and CK are required before enabling analytics");
            }
            upsert(KEY_51LA_ENABLED, String.valueOf(req.getLa51Enabled()), true, "Enable 51.LA analytics");
        }
        if (req.getFacebookPixelEnabled() != null) {
            if (req.getFacebookPixelEnabled() && getFacebookPixelId().isBlank()) {
                throw new IllegalArgumentException("Facebook Pixel ID is required before enabling the pixel");
            }
            upsert(KEY_FACEBOOK_PIXEL_ENABLED, String.valueOf(req.getFacebookPixelEnabled()), true, "Enable Facebook Pixel");
        }
        return getAdminSettings();
    }

    @Transactional
    public void seedDefaults() {
        if (!repository.existsById(KEY_QUIZ_QUESTION_COUNT)) {
            upsert(KEY_QUIZ_QUESTION_COUNT, "20", true, "Number of quiz questions shown to users");
        }
        if (!repository.existsById(KEY_PAYMENT_MODE)) {
            upsert(KEY_PAYMENT_MODE, "mock", false, "Payment mode: mock or live");
        }
        seedIfMissing(KEY_51LA_ENABLED, "false", "Enable 51.LA analytics");
        seedIfMissing(KEY_51LA_SITE_ID, "", "51.LA analytics site ID");
        seedIfMissing(KEY_51LA_CK, "", "51.LA analytics CK");
        seedIfMissing(KEY_FACEBOOK_PIXEL_ENABLED, "false", "Enable Facebook Pixel");
        seedIfMissing(KEY_FACEBOOK_PIXEL_ID, "", "Facebook Pixel ID");
    }

    /** Used by feeling-scale seeder to lock quiz length to 20. */
    @Transactional
    public void forceQuizQuestionCount(int count) {
        int clamped = Math.min(Math.max(count, 1), 50);
        upsert(KEY_QUIZ_QUESTION_COUNT, String.valueOf(clamped), true,
            "Number of quiz questions shown to users");
    }

    private String getValue(String key, String defaultValue) {
        return repository.findById(key)
            .map(AppSetting::getSettingValue)
            .orElse(defaultValue);
    }

    private void upsert(String key, String value, boolean publicVisible, String description) {
        AppSetting setting = repository.findById(key).orElseGet(AppSetting::new);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        setting.setPublicVisible(publicVisible);
        setting.setDescription(description);
        setting.setUpdatedAt(LocalDateTime.now());
        repository.save(setting);
    }

    private void seedIfMissing(String key, String value, String description) {
        if (!repository.existsById(key)) upsert(key, value, true, description);
    }

    private static void validateIdentifier(String value, String label) {
        if (!value.isEmpty() && !value.matches("[A-Za-z0-9_-]{4,128}")) {
            throw new IllegalArgumentException(label + " contains unsupported characters");
        }
    }

    private static int parseInt(String raw, int defaultValue, int min, int max) {
        try {
            int value = Integer.parseInt(raw.trim());
            return Math.min(Math.max(value, min), max);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
