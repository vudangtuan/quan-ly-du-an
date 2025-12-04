package com.tuanhust.notificationservice.service;

import com.tuanhust.notificationservice.dto.PaginatedResponse;
import com.tuanhust.notificationservice.entity.Notification;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    PaginatedResponse<Notification> getAllNotification(String userId, Pageable pageable);

    void markRead(List<String> ids);

    void markAllRead(String userId);
}
