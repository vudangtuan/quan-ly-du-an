package com.tuanhust.aiservice.service;

import com.tuanhust.aiservice.client.CoreServiceClient;
import com.tuanhust.aiservice.config.CustomChatMemory;
import com.tuanhust.aiservice.config.ProjectAdvisor;
import com.tuanhust.aiservice.config.UserPrincipal;
import com.tuanhust.aiservice.dto.ChatHistory;
import com.tuanhust.aiservice.dto.ProjectChatBotRequest;
import com.tuanhust.aiservice.tool.AiTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final JdbcTemplate jdbcTemplate;
    private final AiTools aiTools;
    private final CoreServiceClient coreServiceClient;
    private final CustomChatMemory customChatMemory;

    @Value("classpath:prompts/chatbot_project.st")
    private Resource systemText;

    @Autowired
    public ChatService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore,
                       JdbcTemplate jdbcTemplate, AiTools aiTools, ProjectAdvisor projectAdvisor, CoreServiceClient coreServiceClient, CustomChatMemory customChatMemory) {
        this.coreServiceClient = coreServiceClient;
        this.customChatMemory = customChatMemory;
        this.chatClient = chatClientBuilder
                .defaultAdvisors(projectAdvisor)
                .build();
        this.vectorStore = vectorStore;
        this.jdbcTemplate = jdbcTemplate;
        this.aiTools = aiTools;
    }

    public String chat(String projectId, ProjectChatBotRequest request) {
        String userId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
        try {
            String roleUser = coreServiceClient.isUserInProject(projectId, userId);
        } catch (Exception e) {
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

        List<Document> projects = getProjectDocument(projectId);
        if (!projects.isEmpty()) {
            contextBuilder.append("--- [THÔNG TIN MỚI NHÂT CỦA DỰ ÁN] ---\n");
            contextBuilder.append(projects.getFirst().getFormattedContent()).append("\n\n");
            if (request.memberIds() != null && !request.memberIds().isEmpty()) {
                List<Document> members = getUserDocument(request.memberIds());
                if (!members.isEmpty()) {
                    contextBuilder.append("--- [THÔNG TIN THÀNH VIÊN TRONG DỰ ÁN] ---\n");
                    for (Document doc : members) {
                        contextBuilder.append(doc.getFormattedContent()).append("\n\n");
                    }
                }
            }

            SearchRequest searchRequest = SearchRequest.builder()
                    .query(request.body())
                    .topK(5)
                    .filterExpression(String.format("projectId == '%s' and doc_type == 'INFO'", projectId))
                    .build();
            List<Document> documents = vectorStore.similaritySearch(searchRequest);

            if (!documents.isEmpty()) {
                contextBuilder.append("--- [THÔNG TIN LIÊN QUAN] ---\n");
                for (Document doc : documents) {
                    contextBuilder.append(doc.getFormattedContent()).append("\n\n");
                }
            }
        }
        return contextBuilder.toString();
    }

    private List<Document> getProjectDocument(String projectId) {
        String sql = """
                    SELECT id, content, metadata
                    FROM vector_store
                    WHERE id = ?::uuid
                """;
        return jdbcTemplate.query(sql, aiTools::mapRow, projectId);
    }

    private List<Document> getUserDocument(List<String> userIds) {
        String pgArrayStringUsers = "{" + String.join(",", userIds) + "}";
        String sql = """
                    SELECT id, content, metadata
                    FROM vector_store
                    WHERE id = ANY(?::uuid[])
                    AND metadata ->> 'doc_type' = 'INFO'
                """;
        return jdbcTemplate.query(sql, aiTools::mapRow, pgArrayStringUsers);
    }

    @Transactional(readOnly = true)
    public List<ChatHistory> getMessage(String projectId, Instant createdAt) {
        try {
            String userId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
            return customChatMemory.getHistoryBefore(userId, projectId, createdAt, 10);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
