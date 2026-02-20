package com.tuanhust.storageservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActivityEvent(
        String projectId,
        String taskId,
        String actorId,
        String actorName,
        String actorEmail,
        String actionType,
        String description,
        Map<String, Object> metadata,
        Instant createdAt,
        String targetId,
        String targetName
) {}
