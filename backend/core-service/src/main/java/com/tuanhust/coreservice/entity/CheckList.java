package com.tuanhust.coreservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "check_list",
        indexes = {
                @Index(name = "idx_checklist_task_id", columnList = "taskId")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_checklist_task_id_body", columnNames = {"body", "task_id"})
        })
@Entity
@EntityListeners(AuditingEntityListener.class)
public class CheckList {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String checkListId;
    private String body;
    @Column(name = "task_id", insertable = false, updatable = false)
    private String taskId;
    private boolean done = false;
    @Column(nullable = false)
    private String creatorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Task task;
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}