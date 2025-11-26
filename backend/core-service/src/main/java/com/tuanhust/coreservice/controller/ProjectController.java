package com.tuanhust.coreservice.controller;

import com.tuanhust.coreservice.annotation.ProjectRoles;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.dto.ActivityEvent;
import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.publisher.ActivityPublisher;
import com.tuanhust.coreservice.request.BoardColumnRequest;
import com.tuanhust.coreservice.request.InviteMemberRequest;
import com.tuanhust.coreservice.request.LabelRequest;
import com.tuanhust.coreservice.request.ProjectRequest;
import com.tuanhust.coreservice.response.*;
import com.tuanhust.coreservice.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@RequiredArgsConstructor
@RequestMapping("/project")
public class ProjectController {
    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody ProjectRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully"
                        , response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProjectResponse>>> getProjects(
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PaginatedResponse<ProjectResponse> projects = projectService.getProjectsForUserId(pageable, userId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @PutMapping("/{projectId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> updateProject(
            @PathVariable String projectId,
            @Valid @RequestBody ProjectRequest request
    ) {
        projectService.updateProject(projectId, request);
        return ResponseEntity.ok(
                ApiResponse.success("Updated", null));
    }

    @PatchMapping("/{projectId}/archive")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> archiveProject(
            @PathVariable String projectId
    ) {
        projectService.archiveProject(projectId);
        return ResponseEntity.ok(
                ApiResponse.success("Archived", null));
    }

    @PatchMapping("/{projectId}/unarchive")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> unarchiveProject(
            @PathVariable String projectId
    ) {
        projectService.unarchiveProject(projectId);
        return ResponseEntity.ok(
                ApiResponse.success("Restored", null));
    }

    @DeleteMapping("/{projectId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable String projectId
    ) {
        projectService.deleteProject(projectId);
        return ResponseEntity.ok(
                ApiResponse.success("Deleted", null));
    }


    @GetMapping("/{projectId}")
    @ProjectRoles
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> getProject(
            @PathVariable String projectId) {
        ProjectDetailResponse response = projectService.getProject(projectId);
        response.setCurrentRoleInProject(projectService.getCurrentRoleInProject(projectId));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{projectId}/members")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> inviteMember(
            @Valid @RequestBody InviteMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.inviteMember(request)));
    }

    @PatchMapping("/{projectId}/members/{userId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable String projectId,
            @PathVariable String userId,
            @RequestParam Role role
    ) {
        projectService.updateMemberRole(projectId, userId, role);
        return ResponseEntity.ok(ApiResponse.success(
                "Member role successfully", null));
    }

    @ProjectRoles(roles = {"OWNER"})
    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable String projectId,
            @PathVariable String userId) {
        projectService.deleteMember(userId, projectId);
        return ResponseEntity.ok(ApiResponse.success(
                "Member removed successfully", null));
    }

    @PostMapping("/{projectId}/labels")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<LabelResponse>> createLabel(
            @PathVariable String projectId,
            @RequestBody @Valid LabelRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.createLabel(projectId, request)));
    }

    @PutMapping("/{projectId}/labels/{labelId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<LabelResponse>> updateLabel(
            @PathVariable String projectId,
            @PathVariable String labelId,
            @RequestBody @Valid LabelRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.updateLabel(projectId, labelId, request)));
    }

    @DeleteMapping("/{projectId}/labels/{labelId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> deleteLabel(
            @PathVariable String projectId,
            @PathVariable String labelId
    ) {
        projectService.deleteLabel(projectId, labelId);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }


    @PostMapping("/{projectId}/board-columns")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<BoardColumnResponse>> createBoardColumn(
            @PathVariable String projectId,
            @Valid @RequestBody BoardColumnRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.createBoardColumn(projectId, request)));
    }

    @PatchMapping("/{projectId}/board-columns/{columnId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<BoardColumnResponse>> updateColumn(
            @PathVariable String projectId,
            @PathVariable String columnId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Double sortOrder
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.updateBoardColumn(projectId, columnId,
                        name, sortOrder)));
    }

    @DeleteMapping("/{projectId}/board-columns/{columnId}")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<Void>> deleteBoardColumn(
            @PathVariable String projectId,
            @PathVariable String columnId
    ) {
        projectService.deleteBoardColumn(projectId, columnId);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    @PostMapping("/{projectId}/board-columns/{columnId}/archive")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<BoardColumnResponse>> archiveColumn(
            @PathVariable String projectId,
            @PathVariable String columnId
    ) {

        return ResponseEntity.ok(ApiResponse.success("Archived",
                projectService.archiveBoardColumn(projectId, columnId)));
    }

    @PostMapping("/{projectId}/board-columns/{columnId}/restore")
    @ProjectRoles(roles = {"OWNER"})
    public ResponseEntity<ApiResponse<BoardColumnResponse>> restoreColumn(
            @PathVariable String projectId,
            @PathVariable String columnId,
            @RequestParam(required = false) Double sortOrder
    ) {
        return ResponseEntity.ok(ApiResponse.success("Restored",
                projectService.restoreBoardColumn(projectId, columnId, sortOrder)));
    }
}