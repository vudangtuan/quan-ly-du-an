package com.tuanhust.coreservice.response;

import com.tuanhust.coreservice.entity.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ProjectMemberResponse {
    private String userId;
    private String fullName;
    private String email;
    private Role roleInProject;
    private Instant joinAt;
    private String projectId;
}