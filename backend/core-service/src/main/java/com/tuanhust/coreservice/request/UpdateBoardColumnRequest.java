package com.tuanhust.coreservice.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateBoardColumnRequest {
    @NotBlank
    private String boardId;
    @NotBlank
    private String name;
}