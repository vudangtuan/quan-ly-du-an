package com.tuanhust.coreservice.listener;


import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActivityEvent;
import com.tuanhust.coreservice.dto.NotificationEvent;
import com.tuanhust.coreservice.entity.CommentMentions;
import com.tuanhust.coreservice.entity.ProjectMember;
import com.tuanhust.coreservice.publisher.ActivityPublisher;
import com.tuanhust.coreservice.publisher.NotificationPublisher;
import com.tuanhust.coreservice.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
@RequiredArgsConstructor
public class TaskEventListener {
    private final ActivityPublisher activityPublisher;
    private final NotificationPublisher notificationPublisher;
    private final AuthServiceClient authServiceClient;
    private final ProjectMemberRepository projectMemberRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskEvent(TaskEvent event) {
        sendActivityLog(event);
        switch (event.actionType()) {
            case ADD_COMMENT, UPDATE_COMMENT -> {
                sendNotificationLogForComment(event);
            }
            case CREATE_TASK, ADD_MEMBER_TASK -> {
                sendNotificationLogForAssigneeTask(event);
            }
            case DELETE_MEMBER_TASK -> {
                sendNotificationLogForDeleteAssignee(event);
            }
            default -> {
                return;
            }
        }
    }



    private void sendActivityLog(TaskEvent event) {
        ActivityEvent activity = ActivityEvent.builder()
                .projectId(event.projectId())
                .taskId(event.task().getTaskId())
                .actorId(event.actor().getUserId())
                .actorName(event.actor().getFullName())
                .actorEmail(event.actor().getEmail())
                .actionType(event.actionType())
                .description(event.description())
                .targetId(event.targetId())
                .targetName(event.targetName())
                .metadata(event.metadata())
                .build();

        activityPublisher.publish(activity);
    }

    private void sendNotificationLogForComment(TaskEvent event) {
        try {
            String taskLink = frontendUrl + "/projects/" + event.projectId() + "/kanban?taskId="
                    + event.task().getTaskId();
            Map<String, Object> props = new HashMap<>();
            props.put("link", taskLink);
            props.put("creatorId", event.actor().getUserId());
            props.put("creatorName", event.actor().getFullName());
            props.put("type", "MENTION");
            Set<CommentMentions> commentMentions =
                    (Set<CommentMentions>) event.notifyProps().get("commentMentions");
            commentMentions
                    .stream().filter(
                            c -> !Objects.equals(c.getMentionId(), event.actor().getUserId()))
                    .forEach(c -> {
                        NotificationEvent notificationEvent = NotificationEvent.builder()
                                .channel("IN_APP")
                                .content("Đã nhắc đến bạn trong 1 bình luận")
                                .recipientId(c.getMentionId())
                                .properties(props)
                                .build();
                        notificationPublisher.publish(notificationEvent);
                    });
        } catch (Exception e) {
            return;
        }

    }

    private void sendNotificationLogForAssigneeTask(TaskEvent event) {
        try {
            String taskLink = frontendUrl + "/projects/" + event.projectId() + "/kanban?taskId="
                    + event.task().getTaskId();
            Map<String, Object> props = new HashMap<>();
            props.put("template", "email_add_assignee_task");
            props.put("creatorId", event.actor().getUserId());
            props.put("creatorName", event.actor().getFullName());
            props.put("titleTask", event.task().getTitle());
            props.put("projectName", event.task().getProject().getName());
            props.put("priority", event.task().getPriority());
            props.put("type", "ASSIGN_TASK");
            if (event.task().getDueAt() != null) {
                LocalDateTime dueAt = LocalDateTime.ofInstant(
                        event.task().getDueAt(),
                        ZoneId.systemDefault()
                );
                props.put("dueAt", dueAt.toString());
            }
            props.put("link", taskLink);
            List<ProjectMember> assignees = (List<ProjectMember>) event.notifyProps().get("assignees");
            assignees.forEach(a -> {
                NotificationEvent notificationEvent = NotificationEvent.builder()
                        .channel("ALL")
                        .recipientId(a.getMemberId())
                        .recipient(a.getEmail())
                        .subject("Bạn đã được thêm vào 1 nhiệm vụ")
                        .properties(props)
                        .build();
                notificationPublisher.publish(notificationEvent);
            });

        } catch (Exception e) {
            return;
        }
    }

    private void sendNotificationLogForDeleteAssignee(TaskEvent event) {
        try {
            UserPrincipal assignee = (UserPrincipal) event.notifyProps().get("assignee");
            if(!Objects.equals(assignee.getUserId(), event.actor().getUserId())){
                Map<String, Object> props = new HashMap<>();
                props.put("template", "email_delete_assignee_task");
                props.put("creatorId", event.actor().getUserId());
                props.put("creatorName", event.actor().getFullName());
                props.put("taskTitle",event.task().getTitle());
                props.put("projectName", event.task().getProject().getName());
                props.put("type", "REMOVE_ASSIGNEE_TASK");
                props.put("recipientName", assignee.getFullName());

                NotificationEvent notificationEvent = NotificationEvent.builder()
                        .channel("ALL")
                        .recipient(assignee.getEmail())
                        .recipientId(assignee.getUserId())
                        .subject("Bạn đã được xóa khỏi 1 nhiệm vụ")
                        .properties(props)
                        .build();
                notificationPublisher.publish(notificationEvent);
            }
        } catch (Exception e) {
            return;
        }

    }

}
