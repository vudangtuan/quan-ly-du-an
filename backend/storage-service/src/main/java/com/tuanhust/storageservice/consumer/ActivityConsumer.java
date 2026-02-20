package com.tuanhust.storageservice.consumer;


import com.tuanhust.storageservice.config.RabbitMQConfig;
import com.tuanhust.storageservice.dto.ActivityEvent;
import com.tuanhust.storageservice.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityConsumer {
    private final StorageService storageService;

    @RabbitListener(queues = RabbitMQConfig.ACTIVITY_QUEUE)
    public void handleActivityEvent(ActivityEvent event) {
        try {
            switch (event.actionType()) {
                case "DELETE_TASK": {
                    storageService.deleteFilesByTask(event.projectId(), event.taskId());
                    break;
                }
                case "DELETE_PROJECT": {
                    storageService.deleteFilesByProject(event.projectId());
                    break;
                }
                default: {

                }
            }


        } catch (Exception e) {
            log.error("Failed to publish activity event: {}", event, e);
        }
    }
}


