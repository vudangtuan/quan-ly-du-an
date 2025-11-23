package com.tuanhust.coreservice.request;

import com.tuanhust.coreservice.entity.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Priority priority;
    private Instant dueAt;

    @NotBlank
    private String projectId;
    @NotBlank
    private String boardColumnId;
    private List<String> assigneeIds;
    private List<String> labelIds;
}