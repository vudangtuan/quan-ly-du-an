package com.tuanhust.coreservice.response;

import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.entity.enums.Status;
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
public class ProjectDetailResponse {
    private String projectId;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant dueAt;
    private Status status;

    private ProjectMemberResponse creator;
    private Role currentRoleInProject;
    private List<LabelResponse> labels;
    private List<BoardColumnResponse> boardColumns;
    private List<ProjectMemberResponse> members;
}