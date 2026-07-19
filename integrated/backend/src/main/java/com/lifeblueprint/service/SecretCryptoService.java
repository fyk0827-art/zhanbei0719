package com.lifeblueprint.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class SecretCryptoService {
    private static final String PREFIX = "enc:v1:";
    private final byte[] key;
    private final SecureRandom random = new SecureRandom();

    public SecretCryptoService(@Value("${security.config-encryption-key:}") String masterKey) {
        this.key = masterKey == null || masterKey.isBlank() ? null : sha256(masterKey.trim());
    }

    public boolean isConfigured() {
        return key != null;
    }

    public String encrypt(String plainText) {
        if (!isConfigured()) {
            throw new IllegalStateException("APP_CONFIG_ENCRYPTION_KEY must be configured before saving secrets");
        }
        try {
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(encrypted, 0, payload, iv.length, encrypted.length);
            return PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encrypt configuration secret", e);
        }
    }

    public String decrypt(String stored) {
        if (stored == null || stored.isBlank()) return "";
        if (!stored.startsWith(PREFIX)) return stored;
        if (!isConfigured()) {
            throw new IllegalStateException("APP_CONFIG_ENCRYPTION_KEY is required to read encrypted secrets");
        }
        try {
            byte[] payload = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            byte[] iv = new byte[12];
            byte[] encrypted = new byte[payload.length - iv.length];
            System.arraycopy(payload, 0, iv, 0, iv.length);
            System.arraycopy(payload, iv.length, encrypted, 0, encrypted.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to decrypt configuration secret", e);
        }
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
