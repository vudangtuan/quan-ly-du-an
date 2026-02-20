package com.tuanhust.aiservice.dto;

import java.time.Instant;
import java.util.List;

public record TaskRequest(String title, String description,
                          String priority, String dueAt, String projectId,
                          String boardColumnId, List<String> assigneeIds,
                          List<String> labelIds, List<String> checkLists) {
}
