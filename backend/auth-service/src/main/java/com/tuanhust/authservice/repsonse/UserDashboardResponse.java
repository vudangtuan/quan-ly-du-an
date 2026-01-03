package com.tuanhust.authservice.repsonse;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserDashboardResponse {
    private long totalUsers;
    private List<UserGrowthData> growthChart;

    @Data
    @Builder
    public static class UserGrowthData {
        private String group;
        private long count;
    }
}
