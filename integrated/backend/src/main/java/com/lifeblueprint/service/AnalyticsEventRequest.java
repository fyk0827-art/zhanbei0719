package com.lifeblueprint.service;

import java.util.Map;

public record AnalyticsEventRequest(
    String eventName,
    String eventId,
    Long occurredAt,
    String path,
    String contactId,
    String reportId,
    String fbp,
    String fbc,
    Map<String, Object> properties
) {}
