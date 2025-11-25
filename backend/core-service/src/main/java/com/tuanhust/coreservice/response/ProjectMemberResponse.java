package com.tuanhust.coreservice.response;

import com.tuanhust.coreservice.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectMemberResponse {
    private String userId;
    private String fullName;
    private String email;
    private Role roleInProject;
    private Instant joinAt;
    private String projectId;
}