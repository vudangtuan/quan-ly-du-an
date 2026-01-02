package com.tuanhust.activityservice.service;

import com.tuanhust.activityservice.config.RabbitMQConfig;
import com.tuanhust.activityservice.controller.ActivityStreamController;
import com.tuanhust.activityservice.entity.Activity;
import com.tuanhust.activityservice.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityConsumer {
    private final ActivityRepository activityRepository;
    private final ActivityStreamController streamController;

    @RabbitListener(queues = RabbitMQConfig.ACTIVITY_QUEUE)
    public void handleActivityEvent(Activity event) {
        try {
           Activity saved = activityRepository.save(event);
           streamController.broadcastActivitiesByProject(saved);
        }catch (Exception e){
            log.error(e.getMessage(),e);
        }

    }
}
