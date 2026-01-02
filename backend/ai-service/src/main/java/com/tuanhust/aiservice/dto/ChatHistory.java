package com.tuanhust.aiservice.dto;

import java.time.Instant;

public record ChatHistory(
        String id,
        String role,
        String content,
        Instant createdAt
) {
}
