package com.lifeblueprint.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class FacebookConversionsRepository {
    private final JdbcTemplate jdbc;

    public FacebookConversionsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean enqueue(String sourceEvent, String eventName, String eventId, long eventTime,
                           String sourceUrl, String contactId, String reportId, String clientIp,
                           String userAgent, String fbp, String fbc, String customDataJson) {
        long now = System.currentTimeMillis();
        return jdbc.update("""
            INSERT IGNORE INTO facebook_conversion_events
              (source_event,event_name,event_id,event_time,event_source_url,contact_id,report_id,
               client_ip,client_user_agent,fbp,fbc,custom_data,status,attempts,next_attempt_at,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'PENDING',0,?,?,?)
            """, sourceEvent, eventName, eventId, eventTime, sourceUrl, emptyToNull(contactId),
            emptyToNull(reportId), emptyToNull(clientIp), truncate(userAgent, 512), emptyToNull(fbp),
            emptyToNull(fbc), customDataJson, now, now, now) == 1;
    }

    public void recoverStale(long staleBefore) {
        jdbc.update("""
            UPDATE facebook_conversion_events SET status='FAILED', next_attempt_at=?, updated_at=?
            WHERE status='SENDING' AND updated_at < ? AND attempts < 5
            """, System.currentTimeMillis(), System.currentTimeMillis(), staleBefore);
    }

    public Optional<Long> nextPendingId(long now) {
        List<Long> ids = jdbc.query("""
            SELECT id FROM facebook_conversion_events
            WHERE status IN ('PENDING','FAILED') AND attempts < 5 AND next_attempt_at <= ?
            ORDER BY id LIMIT 1
            """, (rs, rowNum) -> rs.getLong(1), now);
        return ids.stream().findFirst();
    }

    public boolean claim(long id) {
        return jdbc.update("""
            UPDATE facebook_conversion_events SET status='SENDING', attempts=attempts+1, updated_at=?
            WHERE id=? AND status IN ('PENDING','FAILED') AND attempts < 5
            """, System.currentTimeMillis(), id) == 1;
    }

    public Optional<Map<String, Object>> event(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT e.*,
                   COALESCE(c.normalized_email, rc.normalized_email) normalized_email,
                   COALESCE(e.contact_id, r.contact_id) resolved_contact_id
            FROM facebook_conversion_events e
            LEFT JOIN contacts c ON c.id=e.contact_id
            LEFT JOIN reports r ON r.report_id=e.report_id
            LEFT JOIN contacts rc ON rc.id=r.contact_id
            WHERE e.id=? LIMIT 1
            """, id);
        return rows.stream().findFirst();
    }

    public void sent(long id, String responseId) {
        long now = System.currentTimeMillis();
        jdbc.update("""
            UPDATE facebook_conversion_events
            SET status='SENT', response_id=?, last_error=NULL, sent_at=?, updated_at=?,
                client_ip=NULL, client_user_agent=NULL, fbp=NULL, fbc=NULL
            WHERE id=?
            """, truncate(responseId, 128), now, now, id);
    }

    public void failed(long id, String error, int attempts) {
        long delay = Math.min(30 * 60_000L, 30_000L * (1L << Math.max(0, attempts - 1)));
        jdbc.update("""
            UPDATE facebook_conversion_events SET status='FAILED', last_error=?, next_attempt_at=?, updated_at=?
            WHERE id=?
            """, truncate(error, 2000), System.currentTimeMillis() + delay, System.currentTimeMillis(), id);
    }

    public int retryFailed() {
        long now = System.currentTimeMillis();
        return jdbc.update("""
            UPDATE facebook_conversion_events
            SET status='PENDING', attempts=0, next_attempt_at=?, last_error=NULL, updated_at=?
            WHERE status='FAILED'
            """, now, now);
    }

    public Map<String, Object> diagnostics() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("pending", count("PENDING"));
        result.put("sending", count("SENDING"));
        result.put("failed", count("FAILED"));
        result.put("sent", count("SENT"));
        List<Map<String, Object>> latest = jdbc.queryForList("""
            SELECT event_name,event_id,status,attempts,response_id,last_error,created_at,sent_at
            FROM facebook_conversion_events ORDER BY id DESC LIMIT 1
            """);
        result.put("latest", latest.isEmpty() ? null : latest.get(0));
        List<Map<String, Object>> providers = jdbc.queryForList(
            "SELECT provider,status,last_event,last_ready_at,last_event_at,last_error,updated_at FROM analytics_provider_diagnostics");
        result.put("providers", providers);
        return result;
    }

    public void providerDiagnostic(String provider, String status, String event, String error) {
        long now = System.currentTimeMillis();
        Long readyAt = "READY".equals(status) ? now : null;
        Long eventAt = event == null || event.isBlank() ? null : now;
        jdbc.update("""
            INSERT INTO analytics_provider_diagnostics
              (provider,status,last_event,last_ready_at,last_event_at,last_error,updated_at)
            VALUES (?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE status=VALUES(status),
              last_event=COALESCE(VALUES(last_event),last_event),
              last_ready_at=COALESCE(VALUES(last_ready_at),last_ready_at),
              last_event_at=COALESCE(VALUES(last_event_at),last_event_at),
              last_error=VALUES(last_error),updated_at=VALUES(updated_at)
            """, provider, status, emptyToNull(event), readyAt, eventAt, emptyToNull(truncate(error, 512)), now);
    }

    private int count(String status) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM facebook_conversion_events WHERE status=?", Integer.class, status);
        return count == null ? 0 : count;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
