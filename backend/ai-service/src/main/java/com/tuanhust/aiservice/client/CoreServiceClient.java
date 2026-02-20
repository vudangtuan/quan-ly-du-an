package com.tuanhust.aiservice.client;

import com.tuanhust.aiservice.config.FeignConfig;
import com.tuanhust.aiservice.dto.ApiResponse;
import com.tuanhust.aiservice.dto.TaskRequest;
import jakarta.validation.Valid;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@Component
@FeignClient(name = "core-service", configuration = FeignConfig.class)
public interface CoreServiceClient {
    @GetMapping("internal/project/{projectId}")
    Map<String, Object> getProject(@PathVariable String projectId);

    @GetMapping("internal/project/{projectId}/task/{taskId}")
    Map<String, Object> getTask(
            @PathVariable String projectId,
            @PathVariable String taskId
    );
    @GetMapping("internal/project/{projectId}/user/{userId}/role")
    String isUserInProject(
            @PathVariable String projectId,
            @PathVariable String userId
    );
    @PostMapping("/project/{projectId}/task")
    ResponseEntity<ApiResponse<?>> createTask(
            @PathVariable String projectId,
            @RequestBody TaskRequest taskRequest
    );
}
