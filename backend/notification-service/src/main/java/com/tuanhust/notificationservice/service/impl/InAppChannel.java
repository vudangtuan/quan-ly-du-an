package com.tuanhust.notificationservice.service.impl;

import com.tuanhust.notificationservice.controller.NotificationStreamController;
import com.tuanhust.notificationservice.dto.NotificationEvent;
import com.tuanhust.notificationservice.entity.Notification;
import com.tuanhust.notificationservice.repository.NotificationRepository;
import com.tuanhust.notificationservice.service.NotificationChannel;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class InAppChannel implements NotificationChannel {
    private NotificationRepository notificationRepository;
    private NotificationStreamController notificationStreamController;
    @Override
    public boolean supports(String channelType) {
        return channelType.equalsIgnoreCase("IN_APP")||
                channelType.equalsIgnoreCase("ALL");
    }

    @Override
    public void send(NotificationEvent event) {
        Notification notification = Notification.builder()
                .recipientId(event.getRecipientId())
                .subject(event.getSubject())
                .content(event.getContent())
                .properties(event.getProperties())
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);
        notificationStreamController.sendToUser(saved.getRecipientId(), saved);
    }
}
