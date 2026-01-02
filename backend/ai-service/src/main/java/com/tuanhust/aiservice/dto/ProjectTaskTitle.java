package com.tuanhust.aiservice.dto;

import jakarta.validation.constraints.NotBlank;

public record ProjectTaskTitle(@NotBlank String projectName, @NotBlank String taskTitle) {
}
