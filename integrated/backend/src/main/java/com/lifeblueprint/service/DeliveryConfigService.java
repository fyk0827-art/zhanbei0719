package com.lifeblueprint.service;

import com.qacollector.entity.AppSetting;
import com.qacollector.repository.AppSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class DeliveryConfigService {
    private final AppSettingRepository settings;
    private final SecretCryptoService crypto;
    private final String envDeepSeekKey;
    private final String envSmtpPassword;

    public DeliveryConfigService(
            AppSettingRepository settings,
            SecretCryptoService crypto,
            @Value("${delivery.deepseek.api-key:}") String envDeepSeekKey,
            @Value("${delivery.smtp.password:}") String envSmtpPassword
    ) {
        this.settings = settings;
        this.crypto = crypto;
        this.envDeepSeekKey = envDeepSeekKey;
        this.envSmtpPassword = envSmtpPassword;
    }

    public String paypalEnvironment() { return value("paypal_environment", "sandbox").equals("live") ? "live" : "sandbox"; }
    public String paypalClientId() { return value("paypal_" + paypalEnvironment() + "_client_id", ""); }
    public String paypalSecret() { return secret("paypal_" + paypalEnvironment() + "_secret", ""); }
    public String paypalWebhookId() { return secret("paypal_" + paypalEnvironment() + "_webhook_id", ""); }
    public String deepSeekKey() { return secret("deepseek_api_key", envDeepSeekKey); }
    public String deepSeekModel() { return value("deepseek_model", "deepseek-chat").toLowerCase(); }
    public String smtpHost() { return value("smtp_host", ""); }
    public int smtpPort() {
        try { return Integer.parseInt(value("smtp_port", "587")); }
        catch (NumberFormatException e) { return 587; }
    }
    public String smtpUsername() { return value("smtp_username", ""); }
    public String smtpPassword() { return secret("smtp_password", envSmtpPassword); }
    public String smtpSecurity() {
        String mode = value("smtp_security", "starttls").toLowerCase();
        return mode.equals("ssl") || mode.equals("none") ? mode : "starttls";
    }
    public String smtpFromAddress() { return value("smtp_from_address", ""); }

    public Map<String, Object> adminSettings() {
        return Map.ofEntries(
            Map.entry("paypalEnvironment", paypalEnvironment()),
            Map.entry("paypalSandboxClientId", value("paypal_sandbox_client_id", "")),
            Map.entry("paypalSandboxSecret", visibleSecret("paypal_sandbox_secret", "")),
            Map.entry("paypalSandboxWebhookId", visibleSecret("paypal_sandbox_webhook_id", "")),
            Map.entry("paypalSandboxSecretConfigured", configured("paypal_sandbox_secret")),
            Map.entry("paypalSandboxWebhookConfigured", configured("paypal_sandbox_webhook_id")),
            Map.entry("paypalLiveClientId", value("paypal_live_client_id", "")),
            Map.entry("paypalLiveSecret", visibleSecret("paypal_live_secret", "")),
            Map.entry("paypalLiveWebhookId", visibleSecret("paypal_live_webhook_id", "")),
            Map.entry("paypalLiveSecretConfigured", configured("paypal_live_secret")),
            Map.entry("paypalLiveWebhookConfigured", configured("paypal_live_webhook_id")),
            Map.entry("deepseekApiKey", visibleSecret("deepseek_api_key", envDeepSeekKey)),
            Map.entry("deepseekConfigured", configured("deepseek_api_key") || !envDeepSeekKey.isBlank()),
            Map.entry("deepseekModel", deepSeekModel()),
            Map.entry("smtpConfigured", !smtpHost().isBlank() && !smtpFromAddress().isBlank()),
            Map.entry("smtpHost", smtpHost()),
            Map.entry("smtpPort", smtpPort()),
            Map.entry("smtpUsername", smtpUsername()),
            Map.entry("smtpPassword", visibleSecret("smtp_password", envSmtpPassword)),
            Map.entry("smtpPasswordConfigured", configured("smtp_password") || !envSmtpPassword.isBlank()),
            Map.entry("smtpSecurity", smtpSecurity()),
            Map.entry("smtpFromAddress", smtpFromAddress()),
            Map.entry("encryptionConfigured", crypto.isConfigured())
        );
    }

    @Transactional
    public void update(Map<String, Object> input) {
        validateWebhookId(input, "paypalSandboxWebhookId");
        validateWebhookId(input, "paypalLiveWebhookId");
        plain(input, "paypalEnvironment", "paypal_environment");
        plain(input, "paypalSandboxClientId", "paypal_sandbox_client_id");
        secret(input, "paypalSandboxSecret", "paypal_sandbox_secret");
        secret(input, "paypalSandboxWebhookId", "paypal_sandbox_webhook_id");
        plain(input, "paypalLiveClientId", "paypal_live_client_id");
        secret(input, "paypalLiveSecret", "paypal_live_secret");
        secret(input, "paypalLiveWebhookId", "paypal_live_webhook_id");
        secret(input, "deepseekApiKey", "deepseek_api_key");
        plain(input, "deepseekModel", "deepseek_model");
        plain(input, "smtpHost", "smtp_host");
        plain(input, "smtpPort", "smtp_port");
        plain(input, "smtpUsername", "smtp_username");
        secret(input, "smtpPassword", "smtp_password");
        plain(input, "smtpSecurity", "smtp_security");
        plain(input, "smtpFromAddress", "smtp_from_address");
    }

    private void validateWebhookId(Map<String, Object> input, String field) {
        if (!input.containsKey(field) || input.get(field) == null) return;
        String value = String.valueOf(input.get(field)).trim().toLowerCase();
        if (value.startsWith("http://") || value.startsWith("https://")) {
            throw new IllegalArgumentException("PayPal Webhook ID must be the WH-... value generated by PayPal, not the webhook URL");
        }
    }

    private boolean configured(String key) { return settings.findById(key).map(v -> !v.getSettingValue().isBlank()).orElse(false); }
    private String value(String key, String fallback) { return settings.findById(key).map(AppSetting::getSettingValue).filter(v -> !v.isBlank()).orElse(fallback); }
    private String secret(String key, String fallback) {
        return settings.findById(key).map(AppSetting::getSettingValue).filter(v -> !v.isBlank()).map(crypto::decrypt).orElse(fallback == null ? "" : fallback);
    }
    private String visibleSecret(String key, String fallback) {
        return settings.findById(key)
            .map(AppSetting::getSettingValue)
            .filter(v -> !v.isBlank())
            .map(v -> {
                if (v.startsWith("enc:v1:") && !crypto.isConfigured()) return "";
                try { return crypto.decrypt(v); }
                catch (IllegalStateException ignored) { return ""; }
            })
            .orElse(fallback == null ? "" : fallback);
    }
    private void plain(Map<String, Object> input, String field, String key) {
        if (input.containsKey(field) && input.get(field) != null) upsert(key, String.valueOf(input.get(field)).trim());
    }
    private void secret(Map<String, Object> input, String field, String key) {
        if (!input.containsKey(field) || input.get(field) == null) return;
        String value = String.valueOf(input.get(field)).trim();
        if (!value.isBlank()) upsert(key, crypto.encrypt(value));
    }
    private void upsert(String key, String value) {
        AppSetting row = settings.findById(key).orElseGet(AppSetting::new);
        row.setSettingKey(key);
        row.setSettingValue(value);
        row.setPublicVisible(false);
        row.setDescription("Secure delivery configuration");
        row.setUpdatedAt(LocalDateTime.now());
        settings.save(row);
    }
}
