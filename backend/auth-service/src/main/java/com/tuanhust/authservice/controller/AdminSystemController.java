package com.tuanhust.authservice.controller;


import com.tuanhust.authservice.repsonse.ApiResponse;
import com.tuanhust.authservice.repsonse.ServiceStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/system")
@Slf4j
public class AdminSystemController {
    private final DiscoveryClient discoveryClient;
    private final RestTemplate restTemplate = new RestTemplate();

    private final List<String> REQUIRED_SERVICES = List.of(
            "API-GATEWAY",
            "AUTH-SERVICE",
            "CORE-SERVICE",
            "ACTIVITY-SERVICE",
            "NOTIFICATION-SERVICE",
            "AI-SERVICE"
    );

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<ServiceStatusResponse>>> getSystemStatus() {
        List<ServiceStatusResponse> statusList = new ArrayList<>();
        List<String> registeredServices = discoveryClient.getServices();

        for (String serviceId : REQUIRED_SERVICES) {
            boolean isRegistered = registeredServices.stream().anyMatch(s -> s.equalsIgnoreCase(serviceId));

            var builder = ServiceStatusResponse.builder()
                    .name(serviceId)
                    .instances(0)
                    .status("DOWN")
                    .url("-")
                    .memoryUsed(0L)
                    .memoryMax(0L)
                    .databaseStatus("UNKNOWN");

            if (isRegistered) {
                List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);
                if (!instances.isEmpty()) {
                    ServiceInstance instance = instances.getFirst();
                    String baseUrl = instance.getUri().toString();

                    builder.status("UP")
                            .instances(instances.size())
                            .url(baseUrl);

                    fetchMetrics(baseUrl, builder);
                }
            }
            statusList.add(builder.build());
        }
        return ResponseEntity.ok(ApiResponse.success(statusList));
    }

    private void fetchMetrics(String baseUrl, ServiceStatusResponse.ServiceStatusResponseBuilder builder) {
        try {
            Map health = restTemplate.getForObject(baseUrl + "/actuator/health", Map.class);
            if (health != null && health.containsKey("components")) {
                Map components = (Map) health.get("components");
                if (components.containsKey("db")) {
                    Map db = (Map) components.get("db");
                    builder.databaseStatus((String) db.get("status"));
                } else {
                    builder.databaseStatus("N/A");
                }
            }

            // 2. Lấy Memory Used (bytes)
            Map memUsed = restTemplate.getForObject(baseUrl + "/actuator/metrics/jvm.memory.used", Map.class);
            if (memUsed != null && !((List)memUsed.get("measurements")).isEmpty()) {
                List measurements = (List) memUsed.get("measurements");
                Map valueMap = (Map) measurements.get(0);
                double value = Double.parseDouble(valueMap.get("value").toString());
                builder.memoryUsed((long) (value / 1024 / 1024)); // Convert to MB
            }

            // 3. Lấy Memory Max (bytes)
            Map memMax = restTemplate.getForObject(baseUrl + "/actuator/metrics/jvm.memory.max", Map.class);
            if (memMax != null && !((List)memMax.get("measurements")).isEmpty()) {
                List measurements = (List) memMax.get("measurements");
                Map valueMap = (Map) measurements.get(0);
                double value = Double.parseDouble(valueMap.get("value").toString());
                builder.memoryMax((long) (value / 1024 / 1024)); // Convert to MB
            }

            // 4. Lấy Uptime (seconds)
            Map uptimeMap = restTemplate.getForObject(baseUrl + "/actuator/metrics/process.uptime", Map.class);
            if (uptimeMap != null && !((List)uptimeMap.get("measurements")).isEmpty()) {
                List measurements = (List) uptimeMap.get("measurements");
                Map valueMap = (Map) measurements.get(0);
                double seconds = Double.parseDouble(valueMap.get("value").toString());
                builder.uptime(formatDuration(Duration.ofSeconds((long) seconds)));
            }

        } catch (Exception e) {
            log.error("Failed to fetch metrics for " + baseUrl, e);
            // Vẫn giữ status UP nhưng metrics sẽ là default
        }
    }

    private String formatDuration(Duration duration) {
        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();
        return String.format("%dd %dh %dm", days, hours, minutes);
    }
}
