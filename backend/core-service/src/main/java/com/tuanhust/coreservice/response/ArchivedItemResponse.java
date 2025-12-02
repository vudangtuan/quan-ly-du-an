package com.tuanhust.coreservice.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ArchivedItemResponse {
    private String itemId;
    private String name;
    private String type;
    private Instant archivedAt;
}
