package com.lifeblueprint.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 人生蓝图生成器表结构：reports / orders / unlocks。
 * 若 orders 表为旧版结构（缺 report_id 等列），自动 drop 后重建。
 */
@Slf4j
public final class GeneratorSchemaSupport {

    private GeneratorSchemaSupport() {}

    public static void ensureSchema(JdbcTemplate jdbc) {
        ensureReports(jdbc);
        ensureOrders(jdbc);
        ensureUnlocks(jdbc);
        ensureDeliveryTables(jdbc);
        log.info("Generator schema (reports/orders/unlocks/delivery) is ready");
    }

    private static void ensureReports(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS reports (
              report_id VARCHAR(32) NOT NULL PRIMARY KEY,
              display_name VARCHAR(64) NULL,
              report_text LONGTEXT NOT NULL,
              chart_json JSON NULL,
              created_at BIGINT NOT NULL,
              updated_at BIGINT NOT NULL,
              INDEX idx_reports_updated (updated_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
        ensureColumn(jdbc, "reports", "full_report_text", "ALTER TABLE reports ADD COLUMN full_report_text LONGTEXT NULL AFTER report_text");
        ensureColumn(jdbc, "reports", "contact_id", "ALTER TABLE reports ADD COLUMN contact_id VARCHAR(36) NULL AFTER chart_json");
        ensureColumn(jdbc, "reports", "order_id", "ALTER TABLE reports ADD COLUMN order_id VARCHAR(64) NULL AFTER contact_id");
        ensureColumn(jdbc, "reports", "language", "ALTER TABLE reports ADD COLUMN language VARCHAR(10) NOT NULL DEFAULT 'en' AFTER order_id");
        ensureColumn(jdbc, "reports", "generation_status", "ALTER TABLE reports ADD COLUMN generation_status VARCHAR(24) NOT NULL DEFAULT 'PREVIEW' AFTER language");
        ensureColumn(jdbc, "reports", "generation_attempts", "ALTER TABLE reports ADD COLUMN generation_attempts INT NOT NULL DEFAULT 0 AFTER generation_status");
        ensureColumn(jdbc, "reports", "generation_error", "ALTER TABLE reports ADD COLUMN generation_error TEXT NULL AFTER generation_attempts");
        ensureColumn(jdbc, "reports", "generation_started_at", "ALTER TABLE reports ADD COLUMN generation_started_at BIGINT NULL AFTER generation_error");
        ensureColumn(jdbc, "reports", "generation_completed_at", "ALTER TABLE reports ADD COLUMN generation_completed_at BIGINT NULL AFTER generation_started_at");
        ensureColumn(jdbc, "reports", "status_token_hash", "ALTER TABLE reports ADD COLUMN status_token_hash CHAR(64) NULL AFTER generation_completed_at");
        ensureIndex(jdbc, "reports", "idx_reports_generation", "CREATE INDEX idx_reports_generation ON reports (generation_status, updated_at)");
    }

    private static void ensureOrders(JdbcTemplate jdbc) {
        if (tableExists(jdbc, "orders") && !columnExists(jdbc, "orders", "report_id")) {
            log.warn("orders table has outdated schema (missing report_id), migrating...");
            jdbc.execute("DROP TABLE IF EXISTS unlocks");
            if (!tableExists(jdbc, "legacy_app_orders")) {
                jdbc.execute("RENAME TABLE orders TO legacy_app_orders");
            } else {
                jdbc.execute("DROP TABLE IF EXISTS orders");
            }
        }
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS orders (
              id VARCHAR(64) NOT NULL PRIMARY KEY,
              report_id VARCHAR(128) NOT NULL,
              amount INT NOT NULL,
              title VARCHAR(255) NOT NULL,
              channel VARCHAR(32) NOT NULL DEFAULT 'alipay',
              status ENUM('pending', 'paid', 'closed') NOT NULL DEFAULT 'pending',
              trade_no VARCHAR(128) NULL,
              payer_contact VARCHAR(128) NULL,
              created_at BIGINT NOT NULL,
              paid_at BIGINT NULL,
              INDEX idx_orders_report_id (report_id),
              INDEX idx_orders_status (status),
              INDEX idx_orders_trade_no (trade_no),
              INDEX idx_orders_paid_at (paid_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
        ensureColumn(jdbc, "orders", "trade_no",
            "ALTER TABLE orders ADD COLUMN trade_no VARCHAR(128) NULL AFTER status");
        ensureColumn(jdbc, "orders", "payer_contact",
            "ALTER TABLE orders ADD COLUMN payer_contact VARCHAR(128) NULL AFTER trade_no");
        ensureColumn(jdbc, "orders", "paid_at",
            "ALTER TABLE orders ADD COLUMN paid_at BIGINT NULL AFTER created_at");
        ensureIndex(jdbc, "orders", "idx_orders_trade_no",
            "CREATE INDEX idx_orders_trade_no ON orders (trade_no)");
        ensureColumn(jdbc, "orders", "currency", "ALTER TABLE orders ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER payer_contact");
        ensureColumn(jdbc, "orders", "payment_environment", "ALTER TABLE orders ADD COLUMN payment_environment VARCHAR(16) NOT NULL DEFAULT 'sandbox' AFTER currency");
        ensureColumn(jdbc, "orders", "paypal_order_id", "ALTER TABLE orders ADD COLUMN paypal_order_id VARCHAR(64) NULL AFTER payment_environment");
        ensureColumn(jdbc, "orders", "paypal_capture_id", "ALTER TABLE orders ADD COLUMN paypal_capture_id VARCHAR(64) NULL AFTER paypal_order_id");
        ensureColumn(jdbc, "orders", "refund_status", "ALTER TABLE orders ADD COLUMN refund_status VARCHAR(24) NOT NULL DEFAULT 'none' AFTER paypal_capture_id");
    }

    private static void ensureUnlocks(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS unlocks (
              report_id VARCHAR(128) NOT NULL PRIMARY KEY,
              order_id VARCHAR(64) NOT NULL,
              paid_at BIGINT NOT NULL,
              INDEX idx_unlocks_order_id (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
    }

    private static void ensureDeliveryTables(JdbcTemplate jdbc) {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
              id VARCHAR(36) NOT NULL PRIMARY KEY,
              email VARCHAR(320) NOT NULL,
              normalized_email VARCHAR(320) NOT NULL,
              language VARCHAR(10) NOT NULL DEFAULT 'en',
              created_at BIGINT NOT NULL,
              last_seen_at BIGINT NOT NULL,
              UNIQUE KEY uk_contacts_email (normalized_email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS report_access_tokens (
              token_hash CHAR(64) NOT NULL PRIMARY KEY,
              report_id VARCHAR(32) NOT NULL,
              created_at BIGINT NOT NULL,
              revoked_at BIGINT NULL,
              INDEX idx_access_report (report_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS email_deliveries (
              id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
              report_id VARCHAR(32) NOT NULL,
              recipient_email VARCHAR(320) NOT NULL,
              status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
              attempts INT NOT NULL DEFAULT 0,
              provider_message_id VARCHAR(128) NULL,
              last_error TEXT NULL,
              created_at BIGINT NOT NULL,
              sent_at BIGINT NULL,
              updated_at BIGINT NOT NULL,
              INDEX idx_email_status (status, updated_at),
              INDEX idx_email_report (report_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
    }

    private static boolean tableExists(JdbcTemplate jdbc, String table) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            """,
            Integer.class,
            table
        );
        return count != null && count > 0;
    }

    private static boolean columnExists(JdbcTemplate jdbc, String table, String column) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
            """,
            Integer.class,
            table,
            column
        );
        return count != null && count > 0;
    }

    private static void ensureColumn(JdbcTemplate jdbc, String table, String column, String ddl) {
        if (!columnExists(jdbc, table, column)) {
            jdbc.execute(ddl);
            log.info("Added missing column {}.{}", table, column);
        }
    }

    private static void ensureIndex(JdbcTemplate jdbc, String table, String indexName, String ddl) {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            """,
            Integer.class,
            table,
            indexName
        );
        if (count != null && count == 0) {
            try {
                jdbc.execute(ddl);
            } catch (Exception e) {
                log.debug("Index {} may already exist: {}", indexName, e.getMessage());
            }
        }
    }
}
