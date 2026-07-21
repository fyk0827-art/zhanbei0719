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
        return send(email, "Your complete Life Blueprint is ready", plainText, html);
    }

    public String sendVerificationCode(String email, String code) throws Exception {
        String plainText = "Your Divinlove verification code is " + code + ". It expires in 10 minutes.";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#241b32;line-height:1.6">
              <p style="letter-spacing:.2em;color:#8b6a2f">DIVINLOVE</p>
              <h1>Verify your email</h1>
              <p>Enter this code to continue your Life Script reading:</p>
              <p style="font-size:32px;font-weight:700;letter-spacing:.28em;color:#5B3A8C">%s</p>
              <p style="color:#666;font-size:13px">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
            </div>
            """.formatted(escape(code));
        return send(email, "Your Divinlove verification code", plainText, html);
    }

    public String sendPreviewReport(String email, String displayName, String accessToken) throws Exception {
        String link = frontendUrl + "/report-access?token=" + accessToken;
        String greeting = displayName == null || displayName.isBlank() ? "there" : displayName;
        String plainText = """
            Your free Life Script preview is ready

            Hi %s, your first personalized insights are ready.
            Open your private preview and unlock the complete report when you are ready:
            %s
            """.formatted(greeting, link);
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#241b32;line-height:1.6">
              <p style="letter-spacing:.2em;color:#8b6a2f">DIVINLOVE</p>
              <h1>Your free Life Script preview is ready</h1>
              <p>Hi %s, your first personalized insights are ready.</p>
              <p><a href="%s" style="display:inline-block;background:#5B3A8C;color:#fff;text-decoration:none;padding:14px 22px;border-radius:6px">View my free reading</a></p>
              <p style="color:#666;font-size:13px">Your private page also lets you securely unlock the complete report with PayPal.</p>
            </div>
            """.formatted(escape(greeting), link);
        return send(email, "Your free Life Script preview is ready", plainText, html);
    }

    private JavaMailSenderImpl createSender() {
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

        return sender;
    }

    private String send(String email, String subject, String plainText, String html) throws Exception {
        JavaMailSenderImpl sender = createSender();
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        InternetAddress from = new InternetAddress(config.smtpFromAddress(), "Divinlove", StandardCharsets.UTF_8.name());
        from.validate();
        helper.setFrom(from);
        helper.setTo(email);
        helper.setSubject(subject);
        helper.setSentDate(new Date());
        helper.setText(plainText, html);
        sender.send(message);
        return message.getMessageID() == null ? "smtp-" + UUID.randomUUID() : message.getMessageID();
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
