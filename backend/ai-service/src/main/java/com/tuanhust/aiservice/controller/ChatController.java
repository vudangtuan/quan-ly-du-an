package com.tuanhust.aiservice.controller;


import com.tuanhust.aiservice.dto.ApiResponse;
import com.tuanhust.aiservice.dto.ChatHistory;
import com.tuanhust.aiservice.dto.ProjectChatBotRequest;
import com.tuanhust.aiservice.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/ai")
public class ChatController {

    private final ChatService chatService;


    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @RequestParam String projectId,
            @Valid @RequestBody ProjectChatBotRequest projectChatBotRequest) {
        return ResponseEntity.ok(ApiResponse.success(chatService.chat(projectId, projectChatBotRequest)));
    }

    @GetMapping("/message")
    public ResponseEntity<ApiResponse<List<ChatHistory>>> message(
            @RequestParam String projectId,
            @RequestParam(required = false) Instant createdAt
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getMessage(projectId, createdAt)));
    }
}
