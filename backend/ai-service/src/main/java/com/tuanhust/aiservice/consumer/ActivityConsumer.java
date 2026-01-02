package com.tuanhust.aiservice.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuanhust.aiservice.client.AuthServiceClient;
import com.tuanhust.aiservice.client.CoreServiceClient;
import com.tuanhust.aiservice.config.RabbitMQConfig;
import com.tuanhust.aiservice.dto.ActivityEvent;
import com.tuanhust.aiservice.dto.UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unchecked")
public class ActivityConsumer {
    private final VectorStore vectorStore;
    private final ObjectMapper objectMapper;
    private final CoreServiceClient coreServiceClient;
    private final AuthServiceClient authServiceClient;

    @RabbitListener(queues = RabbitMQConfig.ACTIVITY_QUEUE)
    public void handleActivityEvent(ActivityEvent event) {
        try {
            switch (event.actionType()) {
                case "CREATE_ACCOUNT", "UPDATE_ACCOUNT": {
                    createDocumentUser(event);
                    createDocumentHistory(event);
                }
                case "CREATE_PROJECT", "UPDATE_PROJECT", "ARCHIVE_PROJECT", "RESTORE_PROJECT",
                     "UPDATE_ROLE", "ADD_MEMBER", "DELETE_MEMBER", "ADD_LABEL", "UPDATE_LABEL",
                     "DELETE_LABEL", "ADD_BOARD_COLUMN", "UPDATE_BOARD_COLUMN", "MOVE_BOARD_COLUMN",
                     "DELETE_BOARD_COLUMN", "ARCHIVE_BOARD_COLUMN", "RESTORE_BOARD_COLUMN": {
                    createDocumentProject(event);
                    createDocumentHistory(event);
                }
                default: {
                    createDocumentTask(event);
                    createDocumentHistory(event);
                }
            }


        } catch (Exception e) {
            log.error("Failed to publish activity event: {}", event, e);
        }
    }

    private void createDocumentHistory(ActivityEvent event) {
        Map<String, Object> data = objectMapper.convertValue(event, Map.class);

        data.entrySet().removeIf(entry -> entry.getValue() == null);

        data.put("doc_type", "HISTORY");

        StringBuilder changeDetails = new StringBuilder();
        if (data.containsKey("metadata")) {
            Map<String, Object> meta = (Map<String, Object>) data.get("metadata");
            if (meta.containsKey("new") && meta.containsKey("old")) {
                Map<String, Object> newVal = (Map<String, Object>) meta.get("new");
                Map<String, Object> oldVal = (Map<String, Object>) meta.get("old");

                newVal.forEach((key, value) -> {
                    Object oldValue = oldVal.getOrDefault(key, "trống");
                    changeDetails.append(String.format("- Thay đổi %s từ '%s' sang '%s'. ", key, oldValue, value));
                });
            }
        }
        if (changeDetails.isEmpty()) {
            changeDetails.append(event.description());
        }

        String historyContent = """
                Lịch sử: %s (%s) đã thực hiện hành động trên %s (id: %s).
                Chi tiết: %s
                Thời gian: %s
                """.formatted(
                event.actorName(),
                event.actorEmail(),
                event.targetName(),
                event.targetId(),
                changeDetails.toString(),
                event.createdAt()
        );
        vectorStore.add(List.of(new Document(historyContent, data)));
    }

    private void createDocumentUser(ActivityEvent event) {
        List<UserInfo> users = authServiceClient.getUsers(List.of(event.actorId()));

        if (users == null || users.isEmpty()) {
            return;
        }
        UserInfo user = users.getFirst();
        String content = """
                Thông tin user:
                - Họ và tên: %s
                - Email liên hệ: %s
                - Vai trò: %s
                - User ID: %s
                """.formatted(
                user.fullName(),
                user.email(),
                user.roles(),
                user.userId()
        );
        Map<String, Object> data = objectMapper.convertValue(user, new TypeReference<>() {
        });
        data.put("doc_type", "INFO");
        data.entrySet().removeIf(entry -> entry.getValue() == null);
        vectorStore.add(List.of(new Document(user.userId(), content, data)));
    }

    private void createDocumentProject(ActivityEvent event) {
        Map<String, Object> project = coreServiceClient.getProject(event.projectId());
        if (project == null || project.isEmpty()) {
            return;
        }
        List<Map<String, Object>> cols = (List<Map<String, Object>>) project.getOrDefault("boardColumns", new ArrayList<>());
        cols.sort(Comparator.comparingDouble(c -> ((Number) c.get("sortOrder")).doubleValue()));
        String workflow = cols.stream()
                .map(c -> (String) c.get("name"))
                .collect(Collectors.joining(" -> "));

        List<Map<String, Object>> members = (List<Map<String, Object>>) project.getOrDefault("members", new ArrayList<>());
        String memberList = members.stream()
                .map(m -> String.format("%s (%s - %s)",
                        m.get("fullName"),
                        m.get("email"),
                        m.get("roleInProject")))
                .collect(Collectors.joining(", "));

        List<Map<String, Object>> labels = (List<Map<String, Object>>) project.getOrDefault("labels", new ArrayList<>());
        String labelList = labels.stream()
                .map(l -> (String) l.get("name"))
                .collect(Collectors.joining(", "));

        String name = (String) project.get("name");
        String desc = (String) project.getOrDefault("description", "Không có mô tả");
        String status = (String) project.get("status");
        String createdAt = (String) project.get("createdAt");
        String dueAt = (String) project.get("dueAt");

        String content = """
                HỒ SƠ DỰ ÁN CHI TIẾT:
                - Tên dự án: %s
                - ID Dự án: %s
                - Trạng thái: %s
                - Mô tả: %s
                - Ngày tạo: %s
                - Hạn chót: %s
                QUY TRÌNH LÀM VIỆC (KANBAN FLOW):
                %s
                DANH SÁCH THÀNH VIÊN (%d người):
                %s
                DANH SÁCH NHÃN ĐƯỢC DÙNG:
                %s
                """.formatted(
                name,
                event.projectId(),
                status,
                desc,
                createdAt,
                dueAt,
                workflow,
                members.size(),
                memberList,
                labelList
        );

        project.put("doc_type", "INFO");
        project.entrySet().removeIf(entry -> entry.getValue() == null);
        vectorStore.add(List.of(new Document(event.projectId(), content, project)));
    }

    private void createDocumentTask(ActivityEvent event) {
        Map<String, Object> task = coreServiceClient.getTask(event.projectId(), event.taskId());
        if (task == null || task.isEmpty()) {
            return;
        }
        String taskId = (String) task.get("taskId");
        String title = (String) task.get("title");
        String description = (String) task.get("description");
        String status = (String) task.get("status");
        String priority = (String) task.get("priority");
        String createdAt = (String) task.get("createdAt");
        String dueAt = (String) task.get("dueAt");
        String updatedAt = (String) task.get("updatedAt");

        String content = """
                THÔNG TIN NHIỆM VỤ (TASK) MỚI NHẤT:
                - Mã TaskId: %s
                - Tiêu đề: %s
                - Mô tả: %s
                - Trạng thái: %s
                - Độ ưu tiên: %s
                - Hạn chót (Deadline): %s
                - Ngày tạo: %s
                - Cập nhập cuối: %s
                """.formatted(
                taskId,
                title,
                description,
                status,
                priority,
                dueAt,
                createdAt,
                updatedAt
        );
        task.put("doc_type", "INFO");
        task.entrySet().removeIf(entry -> entry.getValue() == null);
        vectorStore.add(List.of(new Document(taskId, content, task)));
    }
}


