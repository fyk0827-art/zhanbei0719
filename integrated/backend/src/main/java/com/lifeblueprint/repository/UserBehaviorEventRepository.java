package com.lifeblueprint.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserBehaviorEventRepository {
    private final JdbcTemplate jdbc;

    public UserBehaviorEventRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean insert(String eventName, String eventId, long occurredAt, String source, String path,
                          String sessionId, String contactId, String reportId, String properties, long createdAt) {
        return jdbc.update("""
            INSERT IGNORE INTO user_behavior_events
              (event_name, event_id, occurred_at, source, path, session_id, contact_id, report_id, properties, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, eventName, eventId, occurredAt, source, path, sessionId, contactId, reportId, properties, createdAt) == 1;
    }
}
