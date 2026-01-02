package com.tuanhust.aiservice.config;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuanhust.aiservice.dto.ChatHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;


import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;


@Component
@RequiredArgsConstructor
@Log4j2
public class CustomChatMemory {
    private final JdbcTemplate jdbcTemplate;

    public void saveMessage(String userId, String projectId, String role, String content) {
        String sql = """
                    INSERT INTO project_chat_history (user_id, project_id, role, content)
                    VALUES (?, ?, ?, ?)
                """;

        try {
            jdbcTemplate.update(sql, userId, projectId, role, content);
        } catch (Exception e) {
            log.error("Error saving message to database", e);
        }
    }

    public List<Message> getChatHistory(String userId, String projectId, int limit) {
        String sql = """
                    SELECT role, content
                    FROM project_chat_history
                    WHERE user_id = ? AND project_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """;

        try {
            return jdbcTemplate.query(sql,
                    (rs, _) -> {
                        String role = rs.getString("role");
                        String content = rs.getString("content");

                        return switch (role.toLowerCase()) {
                            case "user" -> new UserMessage(content);
                            case "assistant" -> new AssistantMessage(content);
                            default -> throw new IllegalArgumentException("Unknown role: " + role);
                        };
                    },
                    userId, projectId, limit
            );
        } catch (Exception e) {
            log.error("Error retrieving chat history", e);
            throw new RuntimeException("Failed to retrieve chat history", e);
        }
    }

    public List<ChatHistory> getHistoryBefore(String userId, String projectId, Instant beforeTime, int limit) {
        Instant pivot = (beforeTime != null) ? beforeTime : Instant.now();
        Timestamp sqlPivot = Timestamp.from(pivot);

        String sql = """
                    SELECT id,role,content,created_at
                    FROM project_chat_history
                    WHERE user_id = ?
                      AND project_id = ?
                      AND created_at < ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new ChatHistory(
                rs.getString("id"),
                rs.getString("role"),
                rs.getString("content"),
                rs.getTimestamp("created_at").toInstant()
        ), userId, projectId, sqlPivot, limit).reversed();
    }

    public void clearChatHistory(String userId, String projectId) {
        String sql = "DELETE FROM project_chat_history WHERE user_id = ? AND project_id = ?";

        try {
            jdbcTemplate.update(sql, userId, projectId);
        } catch (Exception e) {
            log.error("Error clearing chat history", e);
        }
    }
}
