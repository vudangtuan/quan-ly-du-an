package com.tuanhust.coreservice.request;

import com.tuanhust.coreservice.entity.enums.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InviteMemberRequest {
    @NotBlank
    private String projectId;
    @NotBlank
    private String memberId;
    private Role role;
}