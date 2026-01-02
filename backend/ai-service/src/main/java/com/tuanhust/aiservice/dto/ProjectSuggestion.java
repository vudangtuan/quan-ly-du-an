package com.tuanhust.aiservice.dto;

import java.time.Instant;
import java.util.List;


public record ProjectSuggestion(
        String name,
        String description,
        Instant dueAt,
        List<BoardColumnSuggestion> boardColumns,
        List<LabelSuggestion> labels
) {

    public record BoardColumnSuggestion(
            String name,
            String description,
            int sortOrder
    ) {}

    public record LabelSuggestion(
            String name,
            String description,
            String color
    ) {}
}