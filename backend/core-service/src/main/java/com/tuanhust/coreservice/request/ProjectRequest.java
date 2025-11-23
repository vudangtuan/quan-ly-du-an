package com.tuanhust.coreservice.request;

import com.tuanhust.coreservice.entity.BoardColumn;
import com.tuanhust.coreservice.entity.Label;
import com.tuanhust.coreservice.entity.ProjectMember;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(min = 3, max = 255, message = "Project name must be between 3 and 255 characters")
    private String name;
    private String description;
    private Instant dueAt;
    private List<BoardColumn> boardColumns;
    private List<Label> labels;
    private List<ProjectMember> members;
}