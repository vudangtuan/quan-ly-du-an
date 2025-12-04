package com.tuanhust.coreservice.dto;

import com.tuanhust.coreservice.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvitationData implements Serializable {
    private String projectId;
    private String memberId;
    private String emailMember;
    private String memberName;
    private Role role;
    private String inviterId;
    private String inviterName;
}
