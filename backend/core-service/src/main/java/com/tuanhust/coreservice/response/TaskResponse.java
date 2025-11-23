package com.tuanhust.coreservice.response;

import com.tuanhust.coreservice.entity.enums.Priority;
import com.tuanhust.coreservice.entity.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private String taskId;
    private String title;
    private Priority priority;
    private Instant dueAt;
    private Instant createdAt;
    private Boolean completed;
    private Double sortOrder;
    private Status status;

    private String projectId;
    private String boardColumnId;
    private String creatorId;
    private List<String> assigneeIds;
    private List<String> labelIds;
}