package com.tuanhust.coreservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tuanhust.coreservice.entity.enums.Priority;
import com.tuanhust.coreservice.entity.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "tasks",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_board_column_sort", columnNames = {"board_column_id", "sortOrder"})
        },
        indexes = {
                @Index(name = "idx_project_id", columnList = "projectId"),
        })
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@SQLRestriction("status <> 'ARCHIVED'")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String taskId;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;
    private Boolean completed;
    private Instant dueAt;
    private Instant archivedAt;
    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    @Column(nullable = false)
    private String creatorId;
    private Double sortOrder;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "task",orphanRemoval = true)
    @OrderBy("updatedAt desc")
    @Builder.Default
    private Set<Comment> comments = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "task", orphanRemoval = true)
    @Builder.Default
    private Set<TaskLabel> taskLabels = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "task", orphanRemoval = true)
    @Builder.Default
    private Set<TaskAssignee> assignees = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "task", orphanRemoval = true)
    @OrderBy("done ASC, createdAt DESC")
    @Builder.Default
    private Set<CheckList> checkLists = new HashSet<>();

    @Column(name = "project_id",insertable = false,updatable = false)
    private String projectId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id",nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private Project project;

    @Column(name = "board_column_id",insertable = false,updatable = false)
    private String boardColumnId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_column_id",nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private BoardColumn boardColumn;
}