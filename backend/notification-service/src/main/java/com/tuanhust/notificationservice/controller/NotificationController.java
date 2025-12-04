package com.tuanhust.notificationservice.controller;

import com.tuanhust.notificationservice.config.UserPrincipal;
import com.tuanhust.notificationservice.dto.ApiResponse;
import com.tuanhust.notificationservice.dto.MarkReadRequest;
import com.tuanhust.notificationservice.dto.PaginatedResponse;
import com.tuanhust.notificationservice.entity.Notification;
import com.tuanhust.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<Notification>>> getAllNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getAllNotification(userPrincipal.getUserId(), pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> markRead(
            @RequestBody MarkReadRequest markReadRequest) {
        notificationService.markRead(markReadRequest.getIds());
        return ResponseEntity.ok(ApiResponse.success("done", null));
    }

    @PostMapping("/allRead")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.markAllRead(userPrincipal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("done", null));
    }
}
