package com.tuanhust.activityservice.controller;

import com.tuanhust.activityservice.dto.ApiResponse;
import com.tuanhust.activityservice.dto.PaginatedResponse;
import com.tuanhust.activityservice.entity.Activity;
import com.tuanhust.activityservice.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequiredArgsConstructor
@RequestMapping("/activity")
public class ActivityController {
    private final ActivityService activityService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<PaginatedResponse<Activity>>> getActivitiesByProject(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                activityService.getActivitiesByProject(projectId,pageable)));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<ApiResponse<PaginatedResponse<Activity>>> getActivitiesByTask(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size){
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                activityService.getActivitiesByTask(taskId,pageable)));
    }
}
