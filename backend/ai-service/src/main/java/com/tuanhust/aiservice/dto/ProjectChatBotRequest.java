package com.tuanhust.aiservice.dto;


import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ProjectChatBotRequest(
        @NotBlank String body,
        List<String> memberIds
) {
}
