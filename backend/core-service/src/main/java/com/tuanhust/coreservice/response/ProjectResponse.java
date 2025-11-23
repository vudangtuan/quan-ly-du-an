package com.tuanhust.coreservice.response;

import com.tuanhust.coreservice.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProjectResponse {
    private String projectId;
    private String name;
    private String description;
    private Integer members;
    private Instant dueAt;
    private Role currentRoleInProject;
}