package com.tuanhust.coreservice.entity;


import com.tuanhust.coreservice.entity.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Set;


@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "projects", indexes = {
        @Index(name = "idx_creator_id", columnList = "creatorId")
})
@EntityListeners(AuditingEntityListener.class)
@SQLRestriction("status <> 'ARCHIVED'")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String projectId;
    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false)
    private String creatorId;
    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    private Instant dueAt;

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "project")
    private Set<Label> labels;
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "project")
    @OrderBy("sortOrder ASC")
    private Set<BoardColumn> boardColumns;
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "project")
    @OrderBy("joinedAt ASC")
    private Set<ProjectMember> members;
    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, mappedBy = "project")
    private Set<Task> tasks;
}