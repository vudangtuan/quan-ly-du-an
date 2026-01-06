package com.tuanhust.authservice.repsonse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ServiceStatusResponse {
    private String name;
    private String status;
    private String url;
    private int instances;
    private Long memoryUsed;
    private Long memoryMax;
    private Double cpuUsage;
    private String uptime;
    private String databaseStatus;
}