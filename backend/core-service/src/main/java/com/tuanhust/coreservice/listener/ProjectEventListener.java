package com.tuanhust.coreservice.listener;

import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.dto.ActivityEvent;
import com.tuanhust.coreservice.dto.NotificationEvent;
import com.tuanhust.coreservice.publisher.ActivityPublisher;
import com.tuanhust.coreservice.publisher.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectEventListener {
    private final ActivityPublisher activityPublisher;
    private final NotificationPublisher notificationPublisher;


    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleProjectEvent(ProjectEvent event) {
        if (event.actionType() != ActionType.INVITE_MEMBER) {
            sendActivityLog(event);
        }

        if (event.actionType() == ActionType.INVITE_MEMBER) {
            sendInvitationEmail(event);
        }
    }

    private void sendInvitationEmail(ProjectEvent event) {
        Map<String, Object> meta = event.metadata();
        if (meta == null) {
            return;
        }
        try {
            Map<String, Object> props = event.metadata();
            props.put("template", "email-invite");
            props.put("creatorName", event.actor().getFullName());
            props.put("creatorId", event.actor().getUserId());
            props.put("projectName", event.project().getName());
            props.put("expiryDays", 7);
            props.put("type", "INVITE_MEMBER");
            props.put("recipientName", event.recipient().getFullName());

            NotificationEvent notificationEvent = NotificationEvent.builder()
                    .channel("ALL")
                    .recipient(event.recipient().getEmail())
                    .recipientId(event.recipient().getUserId())
                    .subject("Lời mời tham gia dự án: " + event.project().getName())
                    .content("Bạn nhận được lời mời tham gia dự án.")
                    .properties(props)
                    .build();

            notificationPublisher.publish(notificationEvent);

        } catch (Exception e) {
            log.error(e.toString());
        }
    }

    private void sendActivityLog(ProjectEvent event) {
        try {
            ActivityEvent activity = ActivityEvent.builder()
                    .projectId(event.project().getProjectId())
                    .actorId(event.actor().getUserId())
                    .actorName(event.actor().getFullName())
                    .actorEmail(event.actor().getEmail())
                    .actionType(event.actionType())
                    .description(event.description())
                    .targetId(event.targetId())
                    .targetName(event.targetName())
                    .metadata(event.metadata())
                    .createdAt(Instant.now())
                    .build();
            activityPublisher.publish(activity);
        } catch (Exception e) {
            log.error(e.toString());
        }
    }
}
