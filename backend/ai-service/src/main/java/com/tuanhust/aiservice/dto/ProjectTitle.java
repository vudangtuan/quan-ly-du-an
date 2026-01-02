package com.tuanhust.aiservice.dto;

import jakarta.validation.constraints.NotBlank;

public record ProjectTitle(@NotBlank String title) {
}
