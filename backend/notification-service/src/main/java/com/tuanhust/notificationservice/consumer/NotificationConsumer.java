package com.tuanhust.notificationservice.consumer;

import com.tuanhust.notificationservice.config.RabbitMQConfig;
import com.tuanhust.notificationservice.dto.NotificationEvent;
import com.tuanhust.notificationservice.service.NotificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {
    private final List<NotificationChannel> channels;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleNotification(NotificationEvent event) {
        channels.stream()
                .filter(channel -> channel.supports(event.getChannel()))
                .forEach(channel -> channel.send(event));
    }
}
