package com.tuanhust.coreservice.controller;

import com.tuanhust.coreservice.response.ApiResponse;
import com.tuanhust.coreservice.response.TaskResponse;
import com.tuanhust.coreservice.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tasks")
public class PersonalTaskController {
    private final TaskService taskService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks() {
        return ResponseEntity.ok(
                ApiResponse.success(taskService.getMyTasks())
        );
    }
}
