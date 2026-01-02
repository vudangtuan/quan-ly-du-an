package com.tuanhust.activityservice.service.impl;


import com.tuanhust.activityservice.dto.PaginatedResponse;
import com.tuanhust.activityservice.entity.Activity;
import com.tuanhust.activityservice.repository.ActivityRepository;
import com.tuanhust.activityservice.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {
    private final ActivityRepository activityRepository;

    @Override
    public PaginatedResponse<Activity> getActivitiesByProject(String projectId, Pageable pageable) {
         Page<Activity> page = activityRepository.
                findByProjectIdOrderByCreatedAtDesc(projectId,pageable);
        return PaginatedResponse.<Activity>builder()
                .first(page.isFirst())
                .last(page.isLast())
                .number(page.getNumber())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .size(page.getSize())
                .content(page.getContent())
                .build();
    }

    @Override
    public PaginatedResponse<Activity> getActivitiesByTask(String taskId, Pageable pageable) {
        Page<Activity> page = activityRepository.
                findByTaskIdOrderByCreatedAtDesc(taskId,pageable);
        return PaginatedResponse.<Activity>builder()
                .first(page.isFirst())
                .last(page.isLast())
                .number(page.getNumber())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .size(page.getSize())
                .content(page.getContent())
                .build();
    }
}
