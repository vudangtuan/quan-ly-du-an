package com.tuanhust.coreservice.controller;

import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.repository.ProjectMemberRepository;
import com.tuanhust.coreservice.response.ProjectDetailResponse;
import com.tuanhust.coreservice.response.TaskDetailResponse;
import com.tuanhust.coreservice.service.ProjectService;
import com.tuanhust.coreservice.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;


@RestController
@RequiredArgsConstructor
@RequestMapping("/internal")
public class internalController {
    private final ProjectService projectService;
    private final TaskService taskService;
    private final ProjectMemberRepository projectMemberRepository;

    @GetMapping("project/{projectId}")
    public ProjectDetailResponse getProject(
            @PathVariable String projectId) {
        return projectService.getProject(projectId);
    }

    @GetMapping("/project/{projectId}/task/{taskId}")
    public TaskDetailResponse getTask(
            @PathVariable String projectId,
            @PathVariable String taskId
    ) {
        return taskService.getTask(projectId, taskId);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "roleInCurrentProject", key = "#projectId+':'+#userId")
    @GetMapping("/project/{projectId}/user/{userId}/role")
    public Role isUserInProject(
            @PathVariable String projectId,
            @PathVariable String userId
    ) {
        return  projectMemberRepository.getRole(projectId, userId).orElseThrow();
    }
}
