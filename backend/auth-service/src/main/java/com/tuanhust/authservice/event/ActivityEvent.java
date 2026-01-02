package com.tuanhust.authservice.event;

import java.time.Instant;
import java.util.Map;


public record ActivityEvent(
        String actorId,
        String actorName,
        String actorEmail,
        ActivityType actionType,
        String description,
        Map<String, Object> metadata,
        Instant createdAt
) {

}
