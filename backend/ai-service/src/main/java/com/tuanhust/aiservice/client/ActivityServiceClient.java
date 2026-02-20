package com.tuanhust.aiservice.client;

import com.tuanhust.aiservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "activity-service", configuration = FeignConfig.class,
        path = "/internal/activity")
public interface ActivityServiceClient {
    @GetMapping("/{projectId}")
    Object getActivity(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    );

    @GetMapping("/{projectId}/user/{userId}")
    Object getActivitiesByUserId(
            @PathVariable String projectId,
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    );

    @GetMapping("/task/{taskId}")
    Object getActivitiesByTask(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size);

    @GetMapping("/task/{taskId}/user/{userId}")
    Object getActivitiesByTaskAndUser(
            @PathVariable String taskId,
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size);
}
