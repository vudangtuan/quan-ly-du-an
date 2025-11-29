package com.tuanhust.notificationservice.service;

import com.tuanhust.notificationservice.dto.NotificationEvent;

public interface NotificationChannel {
    boolean supports(String channelType);
    void send(NotificationEvent event);
}
