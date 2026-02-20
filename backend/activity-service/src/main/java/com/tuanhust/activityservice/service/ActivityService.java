package com.tuanhust.activityservice.service;


import com.tuanhust.activityservice.dto.PaginatedResponse;
import com.tuanhust.activityservice.entity.Activity;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ActivityService {
    PaginatedResponse<Activity> getActivitiesByProject(String projectId, Pageable pageable);

    PaginatedResponse<Activity> getActivitiesByTask(String taskId, Pageable pageable);

    List<Activity> getActivitiesByUser(String userId);

    PaginatedResponse<Activity> getActivities(String projectId, String userId, Pageable pageable);

    PaginatedResponse<Activity> getActivitiesByTaskAndUser(String taskId, String userId, Pageable pageable);
}
