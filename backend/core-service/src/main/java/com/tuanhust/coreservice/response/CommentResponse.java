package com.tuanhust.coreservice.response;

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
public class CommentResponse {
    private String commentId;
    private String body;
    private String creatorId;
    private String taskId;
    private Instant createdAt;
    private Instant updatedAt;
    private List<String> mentionIds;
}