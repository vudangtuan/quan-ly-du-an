package com.tuanhust.activityservice.service;


import com.tuanhust.activityservice.dto.PaginatedResponse;
import com.tuanhust.activityservice.entity.Activity;
import org.springframework.data.domain.Pageable;

public interface ActivityService {
    PaginatedResponse<Activity> getActivitiesByProject(String projectId, Pageable pageable);
}
