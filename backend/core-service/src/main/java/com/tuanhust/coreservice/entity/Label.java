package com.tuanhust.coreservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "labels",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_project_label_name", columnNames = {"project_id", "name"})
        },
        indexes = {
                @Index(name = "idx_label_project_id", columnList = "project_id")
        }
)
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Label {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String labelId;
    @Column(name = "project_id", insertable = false, updatable = false)
    private String projectId;
    @Column(nullable = false, columnDefinition = "CITEXT")
    private String name;
    private String color;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private Project project;
}