package com.tuanhust.coreservice.controller;

import com.tuanhust.coreservice.annotation.ProjectRoles;
import com.tuanhust.coreservice.request.CommentRequest;
import com.tuanhust.coreservice.request.TaskRequest;
import com.tuanhust.coreservice.response.*;
import com.tuanhust.coreservice.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/project/{projectId}/task")
public class TaskController {
    private final TaskService taskService;

    @PostMapping
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable String projectId,
            @RequestBody @Valid TaskRequest taskRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Task created",
                        taskService.createTask(projectId, taskRequest))
        );
    }

    @GetMapping
    @ProjectRoles
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksForProject(
            @PathVariable String projectId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(taskService.getTaskForProject(projectId)));
    }

    @PostMapping("/{taskId}/archive")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<TaskResponse>> archiveTask(
            @PathVariable String projectId,
            @PathVariable String taskId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(taskService.archiveTask(projectId, taskId)));
    }

    @PostMapping("/{taskId}/restore")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<TaskResponse>> restoreTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam(required = false) Double sortOrder
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(taskService.restoreTask(projectId, taskId, sortOrder)));
    }

    @DeleteMapping("/{taskId}")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable String projectId,
            @PathVariable String taskId
    ) {
        taskService.deleteTask(projectId, taskId);
        return ResponseEntity.ok(
                ApiResponse.success("deleted", null));
    }

    @PatchMapping("/{taskId}/move")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<TaskResponse>> moveTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam Double sortOrder,
            @RequestParam String boardColumnId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(taskService.moveTask(projectId, taskId, sortOrder, boardColumnId)));
    }

    @GetMapping("/{taskId}")
    @ProjectRoles
    public ResponseEntity<ApiResponse<TaskDetailResponse>> getTask(
            @PathVariable String projectId,
            @PathVariable String taskId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(taskService.getTask(projectId, taskId))
        );
    }

    @PutMapping("/{taskId}")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<Void>> updateTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestBody TaskRequest taskRequest
    ) {
        taskService.updateTask(projectId, taskId, taskRequest);
        return ResponseEntity.ok(ApiResponse.success("updated", null));
    }

    @PutMapping("/{taskId}/assignees")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<Void>> addAssigneeTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam String assigneeId){
        taskService.addAssigneeTask(projectId,taskId,assigneeId);
        return ResponseEntity.ok(ApiResponse.success("updated", null));
    }

    @DeleteMapping("/{taskId}/assignees")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<Void>> deleteAssigneeTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam String assigneeId){
        taskService.deleteAssigneeTask(projectId,taskId,assigneeId);
        return ResponseEntity.ok(ApiResponse.success("deleted", null));
    }

    @PutMapping("/{taskId}/labels")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<Void>> addLabelTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam String labelId){
        taskService.addLabelTask(projectId,taskId,labelId);
        return ResponseEntity.ok(ApiResponse.success("updated", null));
    }

    @DeleteMapping("/{taskId}/labels")
    @ProjectRoles(roles = {"OWNER", "ADMIN"})
    public ResponseEntity<ApiResponse<Void>> deleteLabelTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam String labelId){
        taskService.deleteLabelTask(projectId,taskId,labelId);
        return ResponseEntity.ok(ApiResponse.success("deleted", null));
    }

    @PutMapping("/{taskId}/complete")
    @ProjectRoles(roles = {"OWNER", "ADMIN", "MEMBER"})
    public ResponseEntity<ApiResponse<Void>> updateCompletedTask(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam Boolean completed
    ) {
        taskService.updateCompletedTask(projectId, taskId, completed);
        return ResponseEntity.ok(ApiResponse.success("updated", null));
    }

    @PostMapping("/{taskId}/checkList")
    @ProjectRoles(roles = {"OWNER", "ADMIN", "MEMBER"})
    public ResponseEntity<ApiResponse<CheckListResponse>> createCheckList(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestParam(required = false) String body
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.createCheckList(projectId, taskId, body)));
    }

    @PutMapping("/{taskId}/checkList/{checkListId}")
    @ProjectRoles(roles = {"OWNER", "ADMIN", "MEMBER"})
    public ResponseEntity<ApiResponse<CheckListResponse>> updateCheckList(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @PathVariable String checkListId,
            @RequestParam(required = false) String body,
            @RequestParam(required = false) Boolean done
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.updateCheckList(projectId,taskId,checkListId, body, done)));
    }

    @DeleteMapping("/{taskId}/checkList/{checkListId}")
    @ProjectRoles(roles = {"OWNER", "ADMIN", "MEMBER"})
    public ResponseEntity<ApiResponse<Void>> deleteCheckList(
            @PathVariable String checkListId,
            @PathVariable String projectId, @PathVariable String taskId) {
        taskService.deleteCheckList(projectId,taskId,checkListId);
        return ResponseEntity.ok(ApiResponse.success("deleted", null));
    }


    @PostMapping("/{taskId}/comment")
    @ProjectRoles(roles = {"OWNER", "ADMIN", "MEMBER"})
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable String projectId,
            @PathVariable String taskId,
            @RequestBody @Valid CommentRequest commentRequest) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.createComment(projectId, taskId, commentRequest.getBody())
        ));
    }

    @DeleteMapping("/{taskId}/comment/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String commentId, @PathVariable String projectId, @PathVariable String taskId) {
        taskService.deleteComment(projectId,taskId,commentId);
        return ResponseEntity.ok(ApiResponse.success("deleted", null));
    }

    @PutMapping("/{taskId}/comment/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable String projectId,
            @PathVariable String commentId,
            @RequestBody @Valid CommentRequest commentRequest, @PathVariable String taskId) {
        return ResponseEntity.ok(ApiResponse.success(
                taskService.updateComment(projectId,taskId,commentId,commentRequest.getBody())
        ));
    }
}