package com.tuanhust.coreservice.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LabelResponse {
    private String labelId;
    private String name;
    private String color;
    private String projectId;
}