package com.tuanhust.coreservice.service;

import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.NotificationEvent;
import com.tuanhust.coreservice.entity.Task;
import com.tuanhust.coreservice.entity.TaskAssignee;
import com.tuanhust.coreservice.publisher.NotificationPublisher;
import com.tuanhust.coreservice.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.event.EventListener;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;


@Service
@RequiredArgsConstructor
@Slf4j
public class TaskReminderService {
    private final TaskRepository taskRepository;
    private final AuthServiceClient authServiceClient;
    private final NotificationPublisher notificationPublisher;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Scheduled(cron = "0 04 10 * * *")
    @Transactional(readOnly = true)
    public void scanAndNotifyDueTasks(){
        ZoneId currentZone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(currentZone);

        Instant startOfDay = today.atStartOfDay(currentZone).toInstant();
        Instant endOfDay = today.atTime(LocalTime.MAX).atZone(currentZone).toInstant();

        List<Task> dueTasks = taskRepository.findTasksDueBetween(startOfDay, endOfDay);

        if (dueTasks.isEmpty()) {
            log.info("No tasks due within the next 24 hours.");
            return;
        }

        Map<String, List<Task>> tasksByUserId = new HashMap<>();
        Set<String> allAssigneeIds = new HashSet<>();


        for (Task task : dueTasks) {
            for (TaskAssignee assignee : task.getAssignees()) {
                String userId = assignee.getAssigneeId();
                tasksByUserId.computeIfAbsent(userId, k -> new ArrayList<>()).add(task);
                allAssigneeIds.add(userId);
            }
        }

        if (allAssigneeIds.isEmpty()) return;

        Map<UserPrincipal, List<Task>> userTasksMap = new HashMap<>();
        try {
            List<UserPrincipal> users = authServiceClient.getUsers(new ArrayList<>(allAssigneeIds));
            for (UserPrincipal user : users) {
                List<Task> tasks = tasksByUserId.get(user.getUserId());
                if (tasks != null && !tasks.isEmpty()) {
                    userTasksMap.put(user, tasks);
                }
            }
        } catch (Exception e) {
            log.error("Error fetching users for reminders", e);
            return;
        }

        userTasksMap.forEach(this::sendReminderEmail);
    }

    private void sendReminderEmail(UserPrincipal user, List<Task> tasks) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                .withZone(ZoneId.systemDefault());
        List<Map<String, String>> taskListDisplay = new ArrayList<>();

        for (Task t : tasks) {
            Map<String, String> taskInfo = new HashMap<>();
            taskInfo.put("title", t.getTitle());
            taskInfo.put("projectName", t.getProject().getName());
            taskInfo.put("dueDate", formatter.format(t.getDueAt()));
            taskInfo.put("link", frontendUrl + "/projects/" + t.getProjectId() + "/kanban?taskId=" + t.getTaskId());
            taskListDisplay.add(taskInfo);
        }
        Map<String, Object> props = new HashMap<>();
        props.put("template", "email-task-due-soon");
        props.put("recipientName", user.getFullName());
        props.put("taskCount", tasks.size());
        props.put("tasks", taskListDisplay);
        props.put("dashboardLink", frontendUrl + "/mytasks");

        NotificationEvent event = NotificationEvent.builder()
                .channel("EMAIL")
                .recipient(user.getEmail())
                .subject("Bạn có " + tasks.size() + " nhiệm vụ đến hạn trong hôm nay")
                .content("Danh sách các nhiệm vụ đến hạn hôm nay.")
                .properties(props)
                .build();

        notificationPublisher.publish(event);
    }
}
