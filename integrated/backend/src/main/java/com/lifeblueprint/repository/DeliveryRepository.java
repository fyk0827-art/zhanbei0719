package com.lifeblueprint.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DeliveryRepository {
    private final JdbcTemplate jdbc;

    public DeliveryRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public String upsertContact(String email, String normalizedEmail, String language) {
        long now = System.currentTimeMillis();
        String id = UUID.randomUUID().toString();
        jdbc.update("""
            INSERT INTO contacts (id, email, normalized_email, language, created_at, last_seen_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE email = VALUES(email), language = VALUES(language), last_seen_at = VALUES(last_seen_at)
            """, id, email, normalizedEmail, language, now, now);
        return jdbc.queryForObject("SELECT id FROM contacts WHERE normalized_email = ?", String.class, normalizedEmail);
    }

    public boolean contactExists(String contactId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM contacts WHERE id = ?", Integer.class, contactId);
        return count != null && count > 0;
    }

    public boolean contactVerified(String contactId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM contacts WHERE id = ? AND verified_at IS NOT NULL", Integer.class, contactId);
        return count != null && count > 0;
    }

    public Optional<Map<String, Object>> verification(String normalizedEmail) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM email_verifications WHERE normalized_email = ? LIMIT 1", normalizedEmail);
        return rows.stream().findFirst();
    }

    @Transactional
    public void saveVerification(String normalizedEmail, String contactId, String codeHash,
                                 long expiresAt, long resendAvailableAt) {
        long now = System.currentTimeMillis();
        jdbc.update("""
            INSERT INTO email_verifications
              (normalized_email, contact_id, code_hash, expires_at, resend_available_at, attempts, created_at, verified_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, NULL)
            ON DUPLICATE KEY UPDATE contact_id=VALUES(contact_id), code_hash=VALUES(code_hash),
              expires_at=VALUES(expires_at), resend_available_at=VALUES(resend_available_at),
              attempts=0, created_at=VALUES(created_at), verified_at=NULL
            """, normalizedEmail, contactId, codeHash, expiresAt, resendAvailableAt, now);
    }

    @Transactional
    public boolean verifyEmailCode(String normalizedEmail, String codeHash, long now) {
        int updated = jdbc.update("""
            UPDATE email_verifications SET verified_at=?
            WHERE normalized_email=? AND code_hash=? AND verified_at IS NULL
              AND expires_at>=? AND attempts<5
            """, now, normalizedEmail, codeHash, now);
        if (updated != 1) {
            jdbc.update("""
                UPDATE email_verifications SET attempts=attempts+1
                WHERE normalized_email=? AND verified_at IS NULL AND expires_at>=?
                """, normalizedEmail, now);
            return false;
        }
        jdbc.update("""
            UPDATE contacts c JOIN email_verifications v ON v.contact_id=c.id
            SET c.verified_at=?, c.last_seen_at=? WHERE v.normalized_email=?
            """, now, now, normalizedEmail);
        return true;
    }

    public Optional<Map<String, Object>> verifiedContact(String normalizedEmail) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT id, email, language, verified_at FROM contacts
            WHERE normalized_email=? AND verified_at IS NOT NULL LIMIT 1
            """, normalizedEmail);
        return rows.stream().findFirst();
    }

    public void savePreview(String reportId, String preview, String chartJson, String displayName,
                            String contactId, String language, String statusTokenHash) {
        long now = System.currentTimeMillis();
        jdbc.update("""
            INSERT INTO reports (report_id, display_name, report_text, chart_json, contact_id, language,
                                 generation_status, status_token_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'PREVIEW', ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              display_name = COALESCE(VALUES(display_name), display_name),
              report_text = VALUES(report_text),
              chart_json = COALESCE(VALUES(chart_json), chart_json),
              contact_id = COALESCE(VALUES(contact_id), contact_id),
              language = VALUES(language),
              status_token_hash = VALUES(status_token_hash),
              updated_at = VALUES(updated_at)
            """, reportId, displayName, preview, chartJson, contactId, language, statusTokenHash, now, now);
    }

    public Optional<Map<String, Object>> report(String reportId) {
        try {
            return Optional.ofNullable(jdbc.queryForMap("""
                SELECT r.*, c.email FROM reports r LEFT JOIN contacts c ON c.id = r.contact_id
                WHERE r.report_id = ? LIMIT 1
                """, reportId));
        } catch (EmptyResultDataAccessException e) { return Optional.empty(); }
    }

    public boolean statusTokenMatches(String reportId, String hash) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM reports WHERE report_id = ? AND status_token_hash = ?", Integer.class, reportId, hash);
        return count != null && count > 0;
    }

    @Transactional
    public boolean queueReport(String reportId, String orderId) {
        long now = System.currentTimeMillis();
        int updated = jdbc.update("""
            UPDATE reports SET order_id = ?, generation_status = 'QUEUED', generation_error = NULL,
                               generation_attempts = 0, generation_started_at = COALESCE(generation_started_at, ?), updated_at = ?
            WHERE report_id = ? AND generation_status NOT IN ('QUEUED','GENERATING','COMPLETE')
            """, orderId, now, now, reportId);
        return updated > 0;
    }

    public Optional<String> nextQueuedReportId() {
        List<String> ids = jdbc.query("""
            SELECT report_id FROM reports WHERE generation_status = 'QUEUED' AND generation_attempts < 3
            ORDER BY updated_at ASC LIMIT 1
            """, (rs, n) -> rs.getString(1));
        return ids.stream().findFirst();
    }

    public boolean claim(String reportId) {
        long now = System.currentTimeMillis();
        return jdbc.update("""
            UPDATE reports SET generation_status='GENERATING', generation_attempts=generation_attempts+1,
                               generation_started_at=COALESCE(generation_started_at, ?), updated_at=?
            WHERE report_id=? AND generation_status='QUEUED'
            """, now, now, reportId) == 1;
    }

    public void recoverStaleJobs(long staleBefore) {
        jdbc.update("""
            UPDATE reports SET generation_status='QUEUED', generation_error='Recovered after worker interruption', updated_at=?
            WHERE generation_status='GENERATING' AND updated_at < ? AND generation_attempts < 3
            """, System.currentTimeMillis(), staleBefore);
    }

    public void complete(String reportId, String fullText) {
        long now = System.currentTimeMillis();
        jdbc.update("""
            UPDATE reports SET full_report_text=?, generation_status='COMPLETE', generation_error=NULL,
                               generation_completed_at=?, updated_at=? WHERE report_id=?
            """, fullText, now, now, reportId);
    }

    public void generationFailed(String reportId, String error, boolean retry) {
        jdbc.update("""
            UPDATE reports SET generation_status=?, generation_error=?, updated_at=? WHERE report_id=?
            """, retry ? "QUEUED" : "FAILED", truncate(error, 4000), System.currentTimeMillis(), reportId);
    }

    public void createAccessToken(String reportId, String tokenHash, String scope) {
        jdbc.update("INSERT INTO report_access_tokens (token_hash, report_id, created_at, access_scope) VALUES (?, ?, ?, ?)",
            tokenHash, reportId, System.currentTimeMillis(), scope);
    }

    public Optional<Map<String, Object>> reportByAccessToken(String tokenHash) {
        try {
            return Optional.ofNullable(jdbc.queryForMap("""
                SELECT r.report_id, r.display_name, r.report_text, r.full_report_text, r.chart_json, r.language,
                       r.generation_status, r.generation_completed_at, t.access_scope,
                       CASE WHEN u.report_id IS NULL THEN 0 ELSE 1 END paid
                FROM report_access_tokens t JOIN reports r ON r.report_id=t.report_id
                LEFT JOIN unlocks u ON u.report_id=r.report_id
                WHERE t.token_hash=? AND t.revoked_at IS NULL LIMIT 1
                """, tokenHash));
        } catch (EmptyResultDataAccessException e) { return Optional.empty(); }
    }

    public void enqueueEmail(String reportId, String recipient, String deliveryType) {
        long now = System.currentTimeMillis();
        jdbc.update("""
            INSERT INTO email_deliveries
              (report_id, recipient_email, status, attempts, created_at, updated_at, delivery_type)
            VALUES (?, ?, 'PENDING', 0, ?, ?, ?)
            """, reportId, recipient, now, now, deliveryType);
    }

    @Transactional
    public boolean enqueuePreviewEmailOnce(String reportId) {
        long now = System.currentTimeMillis();
        int updated = jdbc.update("""
            UPDATE reports SET preview_email_queued_at=?, updated_at=?
            WHERE report_id=? AND preview_email_queued_at IS NULL
            """, now, now, reportId);
        if (updated != 1) return false;
        List<String> recipients = jdbc.query("""
            SELECT c.email FROM reports r JOIN contacts c ON c.id=r.contact_id
            WHERE r.report_id=? AND c.verified_at IS NOT NULL LIMIT 1
            """, (rs, n) -> rs.getString(1), reportId);
        if (recipients.isEmpty()) return false;
        enqueueEmail(reportId, recipients.get(0), "PREVIEW");
        return true;
    }

    public Optional<Map<String, Object>> nextPendingEmail() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT * FROM email_deliveries WHERE status IN ('PENDING','FAILED') AND attempts < 3
            ORDER BY updated_at ASC LIMIT 1
            """);
        return rows.stream().findFirst();
    }

    public boolean claimEmail(long id) {
        return jdbc.update("""
            UPDATE email_deliveries SET status='SENDING', attempts=attempts+1, updated_at=?
            WHERE id=? AND status IN ('PENDING','FAILED')
            """, System.currentTimeMillis(), id) == 1;
    }

    public void emailSent(long id, String providerId) {
        long now = System.currentTimeMillis();
        jdbc.update("UPDATE email_deliveries SET status='SENT', provider_message_id=?, sent_at=?, updated_at=? WHERE id=?",
            providerId, now, now, id);
    }

    public void emailFailed(long id, String error) {
        jdbc.update("UPDATE email_deliveries SET status='FAILED', last_error=?, updated_at=? WHERE id=?",
            truncate(error, 4000), System.currentTimeMillis(), id);
    }

    @Transactional
    public boolean retryReport(String reportId) {
        List<String> paidOrderIds = jdbc.query("""
            SELECT id FROM orders
            WHERE report_id=? AND status='paid'
            ORDER BY paid_at DESC, created_at DESC LIMIT 1
            """, (rs, n) -> rs.getString(1), reportId);
        if (paidOrderIds.isEmpty()) return false;
        return jdbc.update("""
            UPDATE reports SET order_id=?, generation_status='QUEUED', generation_attempts=0,
                               generation_error=NULL, generation_started_at=?, generation_completed_at=NULL,
                               updated_at=?
            WHERE report_id=? AND generation_status NOT IN ('QUEUED','GENERATING')
            """, paidOrderIds.get(0), System.currentTimeMillis(), System.currentTimeMillis(), reportId) == 1;
    }

    @Transactional
    public boolean retryEmail(String reportId) {
        List<String> recipients = jdbc.query("""
            SELECT COALESCE(NULLIF(c.email, ''), NULLIF(o.payer_contact, '')) recipient
            FROM reports r
            JOIN orders o ON o.report_id=r.report_id AND o.status='paid'
            LEFT JOIN contacts c ON c.id=r.contact_id
            WHERE r.report_id=? AND r.generation_status='COMPLETE'
            ORDER BY o.paid_at DESC, o.created_at DESC LIMIT 1
            """, (rs, n) -> rs.getString(1), reportId);
        if (recipients.isEmpty() || recipients.get(0) == null || recipients.get(0).isBlank()) return false;
        enqueueEmail(reportId, recipients.get(0), "FULL");
        return true;
    }

    public List<Map<String, Object>> adminOrders(String search, String status, int offset, int limit) {
        String pattern = "%" + (search == null ? "" : search.trim()) + "%";
        String selected = status == null || status.isBlank() ? "%" : status;
        return jdbc.queryForList("""
            SELECT o.id order_id, o.report_id, o.amount, o.currency, o.status payment_status, o.channel,
                   o.trade_no, o.payer_contact email, o.payment_environment, o.paypal_order_id,
                   o.paypal_capture_id, o.refund_status, o.created_at, o.paid_at,
                   r.generation_status, r.generation_started_at, r.generation_completed_at, r.generation_error,
                   (SELECT e.status FROM email_deliveries e WHERE e.report_id=o.report_id ORDER BY e.id DESC LIMIT 1) email_status,
                   (SELECT e.sent_at FROM email_deliveries e WHERE e.report_id=o.report_id ORDER BY e.id DESC LIMIT 1) email_sent_at,
                   (SELECT e.last_error FROM email_deliveries e WHERE e.report_id=o.report_id ORDER BY e.id DESC LIMIT 1) email_error
            FROM orders o LEFT JOIN reports r ON r.report_id=o.report_id
            WHERE (o.id LIKE ? OR o.report_id LIKE ? OR COALESCE(o.payer_contact,'') LIKE ? OR COALESCE(o.paypal_order_id,'') LIKE ?)
              AND o.status LIKE ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?
            """, pattern, pattern, pattern, pattern, selected, limit, offset);
    }

    public int adminOrderCount(String search, String status) {
        String pattern = "%" + (search == null ? "" : search.trim()) + "%";
        String selected = status == null || status.isBlank() ? "%" : status;
        Integer count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM orders o WHERE
            (o.id LIKE ? OR o.report_id LIKE ? OR COALESCE(o.payer_contact,'') LIKE ? OR COALESCE(o.paypal_order_id,'') LIKE ?)
            AND o.status LIKE ?
            """, Integer.class, pattern, pattern, pattern, pattern, selected);
        return count == null ? 0 : count;
    }

    public void attachPaypalOrder(String internalId, String paypalOrderId, String environment) {
        jdbc.update("UPDATE orders SET channel='paypal', paypal_order_id=?, payment_environment=?, currency='USD' WHERE id=?",
            paypalOrderId, environment, internalId);
    }

    public void markPaypalRefunded(String paypalOrderId) {
        jdbc.update("UPDATE orders SET refund_status='refunded' WHERE paypal_order_id=?", paypalOrderId);
    }

    public Optional<Map<String, Object>> paypalOrder(String paypalOrderId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, report_id, status, paypal_capture_id FROM orders WHERE paypal_order_id=? LIMIT 1", paypalOrderId);
        return rows.stream().findFirst();
    }

    @Transactional
    public Optional<String> markPaypalPaid(String paypalOrderId, String captureId, String payerEmail) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, report_id, status FROM orders WHERE paypal_order_id=? LIMIT 1", paypalOrderId);
        if (rows.isEmpty()) return Optional.empty();
        Map<String, Object> row = rows.get(0);
        String reportId = String.valueOf(row.get("report_id"));
        long now = System.currentTimeMillis();
        jdbc.update("""
            UPDATE orders SET status='paid', paid_at=COALESCE(paid_at, ?), trade_no=COALESCE(trade_no, ?),
                              paypal_capture_id=COALESCE(paypal_capture_id, ?), payer_contact=COALESCE(payer_contact, ?)
            WHERE paypal_order_id=?
            """, now, captureId, captureId, payerEmail, paypalOrderId);
        jdbc.update("""
            INSERT INTO unlocks (report_id, order_id, paid_at) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE order_id=VALUES(order_id), paid_at=VALUES(paid_at)
            """, reportId, String.valueOf(row.get("id")), now);
        queueReport(reportId, String.valueOf(row.get("id")));
        return Optional.of(reportId);
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
