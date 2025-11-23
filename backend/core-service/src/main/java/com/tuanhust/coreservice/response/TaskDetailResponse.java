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
public class TaskDetailResponse {
    private String taskId;
    private String title;
    private String description;
    private Status status;
    private Priority priority;
    private Boolean completed;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant dueAt;

    private String projectId;
    private String boardColumnId;
    private String creatorId;
    private List<String> assigneeIds;
    private List<String> labelIds;
    private List<CommentResponse> comments;
    private List<CheckListResponse> checkLists;
}