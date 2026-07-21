package com.lifeblueprint.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class ContactCsvService {
    public byte[] export(List<Map<String, Object>> contacts) {
        StringBuilder csv = new StringBuilder("\uFEFFEmail,Verified,Language,Created At,Last Seen At\r\n");
        for (Map<String, Object> contact : contacts) {
            csv.append(cell(contact.get("email"))).append(',')
                .append(contact.get("verified_at") == null ? "No" : "Yes").append(',')
                .append(cell(contact.get("language"))).append(',')
                .append(cell(time(contact.get("created_at")))).append(',')
                .append(cell(time(contact.get("last_seen_at")))).append("\r\n");
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String time(Object value) {
        if (!(value instanceof Number number)) return "";
        return Instant.ofEpochMilli(number.longValue()).toString();
    }

    private static String cell(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        if (!text.isEmpty() && "=+-@".indexOf(text.charAt(0)) >= 0) text = "'" + text;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }
}
