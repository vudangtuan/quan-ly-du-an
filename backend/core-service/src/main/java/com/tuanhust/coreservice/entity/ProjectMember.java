package com.tuanhust.coreservice.entity;

import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.entity.ids.ProjectMemberID;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;



import java.time.Instant;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@IdClass(ProjectMemberID.class)
@Table(name = "project_members",
        indexes = {
                @Index(name = "idx_project_member", columnList = "projectId,memberId"),
                @Index(name = "idx_member_projects", columnList = "memberId")
        })
public class ProjectMember {

    @Column(name = "project_id",insertable = false,updatable = false)
    private String projectId;
    @Id
    @Column(name = "member_id", nullable = false)
    private String memberId;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Project project;

    @Enumerated(EnumType.STRING)
    private Role role;
    @CreatedDate
    private Instant joinedAt;
}