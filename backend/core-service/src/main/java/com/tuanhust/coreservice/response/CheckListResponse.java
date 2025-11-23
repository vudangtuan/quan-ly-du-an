package com.tuanhust.coreservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckListResponse {
    private String checkListId;
    private String body;
    private String taskId;
    private String creatorId;
    private Boolean done;
    private Instant createdAt;
    private Instant updatedAt;
}