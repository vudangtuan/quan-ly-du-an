package com.tuanhust.coreservice.response;

import com.tuanhust.coreservice.entity.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BoardColumnResponse {
    private String boardColumnId;
    private String name;
    private Double sortOrder;
    private Status status;
    private String projectId;
}