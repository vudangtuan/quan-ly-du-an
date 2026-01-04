package com.tuanhust.authservice.controller;


import com.tuanhust.authservice.repsonse.ApiResponse;
import com.tuanhust.authservice.repsonse.ServiceStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/system")
public class AdminSystemController {
    private final DiscoveryClient discoveryClient;

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
            boolean isRegistered = registeredServices.stream()
                    .anyMatch(s -> s.equalsIgnoreCase(serviceId));

            if (isRegistered) {
                List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);
                if (!instances.isEmpty()) {
                    ServiceInstance instance = instances.getFirst();
                    statusList.add(ServiceStatusResponse.builder()
                            .name(serviceId)
                            .status("UP")
                            .instances(instances.size())
                            .url(instance.getUri().toString())
                            .build());
                } else {
                    statusList.add(ServiceStatusResponse.builder()
                            .name(serviceId)
                            .status("DOWN")
                            .instances(0)
                            .url("-")
                            .build());
                }
            } else {
                statusList.add(ServiceStatusResponse.builder()
                        .name(serviceId)
                        .status("DOWN")
                        .instances(0)
                        .url("-")
                        .build());
            }
        }
        return ResponseEntity.ok(ApiResponse.success(statusList));
    }
}
