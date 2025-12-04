package com.tuanhust.notificationservice.service.impl;

import com.tuanhust.notificationservice.dto.PaginatedResponse;
import com.tuanhust.notificationservice.entity.Notification;
import com.tuanhust.notificationservice.repository.NotificationRepository;
import com.tuanhust.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<Notification> getAllNotification(String userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.
                findAllByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        return PaginatedResponse.<Notification>builder()
                .first(page.isFirst())
                .last(page.isLast())
                .content(page.getContent())
                .number(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    @Transactional
    public void markRead(List<String> ids) {
        notificationRepository.markRead(ids);
    }

    @Override
    @Transactional
    public void markAllRead(String userId) {
        notificationRepository.markAllRead(userId);
    }
}
