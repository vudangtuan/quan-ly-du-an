package com.tuanhust.activityservice.service;

import com.tuanhust.activityservice.config.RabbitMQConfig;
import com.tuanhust.activityservice.controller.ActivityStreamController;
import com.tuanhust.activityservice.dto.ActivityEvent;
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
    public void handleActivityEvent(ActivityEvent event) {
        try {
            Activity activity = Activity.builder()
                    .projectId(event.getProjectId())
                    .taskId(event.getTaskId())
                    .actorId(event.getActorId())
                    .actorName(event.getActorName())
                    .actorEmail(event.getActorEmail())
                    .actionType(event.getActionType())
                    .description(event.getDescription())
                    .metadata(event.getMetadata())
                    .targetId(event.getTargetId())
                    .targetName(event.getTargetName())
                    .createdAt(Instant.now())
                    .build();
           Activity saved = activityRepository.save(activity);
           streamController.broadcastActivitiesByProject(saved);
        }catch (Exception e){
            log.error(e.getMessage(),e);
        }

    }
}
