package com.lifeblueprint.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Properties;
import java.util.UUID;

@Service
public class SmtpEmailService {
    private final DeliveryConfigService config;
    private final String frontendUrl;

    public SmtpEmailService(DeliveryConfigService config,
                            @Value("${payment.frontend-url:http://localhost:3030}") String frontendUrl) {
        this.config = config;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public String sendReport(String email, String displayName, String accessToken) throws Exception {
        if (config.smtpHost().isBlank() || config.smtpFromAddress().isBlank()) {
            throw new IllegalStateException("SMTP host and From address are not configured");
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(config.smtpHost());
        sender.setPort(config.smtpPort());
        sender.setUsername(config.smtpUsername());
        sender.setPassword(config.smtpPassword());
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        Properties properties = sender.getJavaMailProperties();
        boolean authenticated = !config.smtpUsername().isBlank();
        properties.put("mail.smtp.auth", String.valueOf(authenticated));
        properties.put("mail.smtp.connectiontimeout", "20000");
        properties.put("mail.smtp.timeout", "45000");
        properties.put("mail.smtp.writetimeout", "45000");
        if (!config.smtpUsername().isBlank()) {
            properties.put("mail.smtp.from", config.smtpUsername());
        }
        if ("ssl".equals(config.smtpSecurity())) {
            properties.put("mail.smtp.ssl.enable", "true");
        } else if ("starttls".equals(config.smtpSecurity())) {
            properties.put("mail.smtp.starttls.enable", "true");
            properties.put("mail.smtp.starttls.required", "true");
        }

        String link = frontendUrl + "/report-access?token=" + accessToken;
        String safeName = escape(displayName == null || displayName.isBlank() ? "there" : displayName);
        String plainText = """
            Your Life Blueprint is ready

            Hi %s, your complete personalized report has finished generating.

            View your complete report:
            %s

            This private link was created for delivery of your purchased report.
            """.formatted(displayName == null || displayName.isBlank() ? "there" : displayName, link);
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#241b32;line-height:1.6">
              <h1>Your Life Blueprint is ready</h1>
              <p>Hi %s, your complete personalized report has finished generating.</p>
              <p><a href="%s" style="display:inline-block;background:#5B3A8C;color:#fff;text-decoration:none;padding:14px 22px;border-radius:6px">View my complete report</a></p>
              <p style="color:#666;font-size:13px">This private link was created for delivery of your purchased report.</p>
            </div>
            """.formatted(safeName, link);

        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        InternetAddress from = new InternetAddress(config.smtpFromAddress(), "Divinlove", StandardCharsets.UTF_8.name());
        from.validate();
        helper.setFrom(from);
        helper.setTo(email);
        helper.setSubject("Your complete Life Blueprint is ready");
        helper.setSentDate(new Date());
        helper.setText(plainText, html);
        sender.send(message);
        return message.getMessageID() == null ? "smtp-" + UUID.randomUUID() : message.getMessageID();
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
