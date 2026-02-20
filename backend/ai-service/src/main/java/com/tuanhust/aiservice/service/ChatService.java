package com.tuanhust.aiservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuanhust.aiservice.client.CoreServiceClient;
import com.tuanhust.aiservice.config.CustomChatMemory;
import com.tuanhust.aiservice.config.ProjectAdvisor;
import com.tuanhust.aiservice.config.UserPrincipal;
import com.tuanhust.aiservice.dto.ChatHistory;
import com.tuanhust.aiservice.dto.ProjectChatBotRequest;
import com.tuanhust.aiservice.tool.AiTools;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@SuppressWarnings("unchecked")
public class ChatService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final AiTools aiTools;
    private final CoreServiceClient coreServiceClient;
    private final CustomChatMemory customChatMemory;

    @Value("classpath:prompts/chatbot_project.st")
    private Resource systemText;

    @Autowired
    public ChatService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore,
                       AiTools aiTools, ProjectAdvisor projectAdvisor, CoreServiceClient coreServiceClient, CustomChatMemory customChatMemory) {
        this.coreServiceClient = coreServiceClient;
        this.customChatMemory = customChatMemory;
        this.chatClient = chatClientBuilder
                .defaultAdvisors(projectAdvisor)
                .build();
        this.vectorStore = vectorStore;
        this.aiTools = aiTools;
    }

    public String chat(String projectId, ProjectChatBotRequest request) {
        String userId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
        try {
            coreServiceClient.isUserInProject(projectId, userId);
        } catch (Exception e) {
            log.error(e.getMessage(),e);
            return "Xin lỗi, bạn không phải là thành viên của dự án này.";
        }

        String context = buildContext(projectId, request);
        ZoneId systemZone = ZoneId.systemDefault();
        String timeZoneInfo = systemZone.getId();
        String currentTime = Instant.now().toString();

        return chatClient
                .prompt()
                .system(s -> s.text(systemText)
                        .params(Map.of(
                                "context", context,
                                "projectId", projectId,
                                "userId", userId,
                                "timezone", timeZoneInfo,
                                "now", currentTime)))
                .user(request.body())
                .advisors(a -> a.param("projectId", projectId)
                        .param("userId", userId))
                .tools(aiTools)
                .call()
                .content();
    }


    private String buildContext(String projectId, ProjectChatBotRequest request) {
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append(getProject(projectId));

        SearchRequest searchRequest = SearchRequest.builder()
                .query(request.body())
                .topK(5)
                .filterExpression(String.format("projectId == '%s'", projectId))
                .build();
        List<Document> documents = vectorStore.similaritySearch(searchRequest);

        if (!documents.isEmpty()) {
            contextBuilder.append("--- [THÔNG TIN LIÊN QUAN] ---\n");
            for (Document doc : documents) {
                contextBuilder.append(doc.getFormattedContent()).append("\n\n");
            }
        }
        return contextBuilder.toString();
    }

    private String getProject(String projectId) {
        try {
            Map<String, Object> project = coreServiceClient.getProject(projectId);
            if (project == null || project.isEmpty()) {
                return "";
            }
            List<Map<String, Object>> cols = (List<Map<String, Object>>) project.getOrDefault("boardColumns", List.of());
            List<Map<String, Object>> members = (List<Map<String, Object>>) project.getOrDefault("members", List.of());
            List<Map<String, Object>> labels = (List<Map<String, Object>>) project.getOrDefault("labels", List.of());
            String name = (String) project.get("name");
            String desc = (String) project.getOrDefault("description", "Không có mô tả");
            String status = (String) project.get("status");
            String createdAt = (String) project.get("createdAt");
            String dueAt = (String) project.get("dueAt");
            ObjectMapper objectMapper = new ObjectMapper();
            String colsPretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(cols);
            String membersPretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(members);
            String labelsPretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(labels);

            return """
                THÔNG TIN CHI TIẾT DỰ ÁN:
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
                    projectId,
                    status,
                    desc,
                    createdAt,
                    dueAt,
                    colsPretty,
                    members.size(),
                    membersPretty,
                    labelsPretty
            );
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return "";
        }
    }

    @Transactional(readOnly = true)
    public List<ChatHistory> getMessage(String projectId, Instant createdAt) {
        try {
            String userId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
            return customChatMemory.getHistoryBefore(userId, projectId, createdAt, 30);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @Transactional
    public void deleteMessage(String projectId) {
        try {
            String userId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
            customChatMemory.clearChatHistory(userId,projectId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
