package com.tuanhust.coreservice.entity;

import com.tuanhust.coreservice.entity.ids.TaskAssigneeId;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@IdClass(TaskAssigneeId.class)
public class TaskAssignee {
    @Column(nullable = false,name = "assignee_id")
    @Id
    private String assigneeId;

    @Column(nullable = false,name = "task_id",insertable = false,updatable = false)
    private String taskId;

    @CreatedDate
    private Instant joinAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Id
    private Task task;
}