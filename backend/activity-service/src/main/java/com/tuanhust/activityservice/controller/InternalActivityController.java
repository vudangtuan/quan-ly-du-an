package com.tuanhust.activityservice.controller;

import com.tuanhust.activityservice.dto.PaginatedResponse;
import com.tuanhust.activityservice.entity.Activity;
import com.tuanhust.activityservice.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/activity")
public class InternalActivityController {
    private final ActivityService activityService;
    @GetMapping("/{projectId}")
    public PaginatedResponse<Activity> getActivity(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return activityService.getActivitiesByProject(projectId, pageable);
    }
    @GetMapping("/{projectId}/user/{userId}")
    public PaginatedResponse<Activity> getActivitiesByUserId(
            @PathVariable String projectId,
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ){
        Pageable pageable = PageRequest.of(page, size);
        return activityService.getActivities(projectId,userId, pageable);
    }
    @GetMapping("/task/{taskId}")
    public PaginatedResponse<Activity> getActivitiesByTask(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size){
        Pageable pageable = PageRequest.of(page, size);
        return activityService.getActivitiesByTask(taskId,pageable);
    }
    @GetMapping("/task/{taskId}/user/{userId}")
    public PaginatedResponse<Activity> getActivitiesByTaskAndUser(
            @PathVariable String taskId,
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size){
        Pageable pageable = PageRequest.of(page, size);
        return activityService.getActivitiesByTaskAndUser(taskId,userId,pageable);
    }
}
