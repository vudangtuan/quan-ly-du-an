package com.tuanhust.coreservice.entity;

import com.tuanhust.coreservice.entity.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.SQLRestriction;


@Entity
@Table(name = "board_columns",
        indexes = {
                @Index(name = "idx_projectId", columnList = "project_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_projectId_name", columnNames = {"name", "project_id"}),
                @UniqueConstraint(name = "uk_projectId_sort", columnNames = {"sortOrder", "project_id"})
        })
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SQLRestriction("status <> 'ARCHIVED'")
public class BoardColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String boardColumnId;
    @Column(name = "project_id", insertable = false, updatable = false)
    private String projectId;
    @Column(nullable = false, columnDefinition = "CITEXT")
    private String name;
    @Column
    private Double sortOrder;
    @Enumerated(EnumType.STRING)
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id",nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Project project;
}