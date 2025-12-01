package com.tuanhust.coreservice.entity;

import com.tuanhust.coreservice.entity.ids.TaskLabelId;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@IdClass(TaskLabelId.class)
@Entity
@Table(name = "task_labels")
public class TaskLabel {

    @Column(name = "task_id",insertable = false,updatable = false)
    private String taskId;

    @Column(name = "label_id",insertable = false,updatable = false)
    private String labelId;
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id",nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Task task;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "label_id",nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Label label;
}