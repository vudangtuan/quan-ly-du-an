package com.tuanhust.aiservice.consumer;


import com.tuanhust.aiservice.client.CoreServiceClient;
import com.tuanhust.aiservice.client.StorageServiceClient;
import com.tuanhust.aiservice.config.RabbitMQConfig;
import com.tuanhust.aiservice.dto.ActivityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Media;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;


import java.util.*;


@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityConsumer {
    private final VectorStore vectorStore;
    private final CoreServiceClient coreServiceClient;
    private final StorageServiceClient storageServiceClient;
    private final JdbcTemplate jdbcTemplate;
    private final ChatModel chatModel;

    @RabbitListener(queues = RabbitMQConfig.ACTIVITY_QUEUE)
    public void handleActivityEvent(ActivityEvent event) {
        try {
            switch (event.actionType()) {
                case "CREATE_TASK", "UPDATE_TASK": {
                    Map<String, Object> task = coreServiceClient.getTask(event.projectId(), event.taskId());
                    if (task == null || task.isEmpty()) {
                        break;
                    }
                    String taskId = (String) task.get("taskId");
                    String title = (String) task.get("title");
                    String description = (String) task.get("description");
                    String priority = (String) task.get("priority");
                    String dueAt = (String) task.get("dueAt");
                    String content = """
                            THÔNG TIN NHIỆM VỤ (TASK) của dự án có id là %s:
                             - Mã TaskId: %s
                             - Tiêu đề: %s
                             - Mô tả: %s
                             - Độ ưu tiên: %s
                             - Hạn chót (Deadline): %s
                            """.formatted(
                            event.projectId(),
                            taskId,
                            title,
                            description,
                            priority,
                            dueAt
                    );
                    vectorStore.add(List.of(new Document(taskId, content,
                            Map.of("projectId", event.projectId()))));
                    break;
                }
                case "DELETE_TASK": {
                    vectorStore.delete(List.of(event.taskId()));
                    String sql = "DELETE FROM vector_store WHERE metadata ->> 'taskId' = ?";
                    jdbcTemplate.update(sql, event.taskId());
                    break;
                }
                case "DELETE_PROJECT": {
                    String sql = "DELETE FROM vector_store WHERE metadata ->> 'projectId' = ?";
                    jdbcTemplate.update(sql, event.projectId());
                    String sql1 = "DELETE FROM project_chat_history WHERE projectId = ?";
                    jdbcTemplate.update(sql1, event.projectId());
                }
                case "UPLOAD_FILE": {
                    String fileKey = event.metadata().get("fileKey").toString();
                    ResponseEntity<Resource> response = storageServiceClient.viewFile(fileKey);
                    if (response.getBody() == null) return;
                    String mimeType = event.metadata().get("fileType").toString();
                    if (mimeType.startsWith("image/")) {
                        Media media = new Media(MimeType.valueOf(mimeType), response.getBody());
                        String promptText = """
                            Bạn là một trợ lý ảo phân tích tài liệu xuất sắc.
                            Nhiệm vụ của bạn:
                            1. Trích xuất TOÀN BỘ văn bản có trong ảnh (nếu có).
                            2. Mô tả chi tiết nội dung bức ảnh này.
                            3. Nếu là sơ đồ/biểu đồ, hãy giải thích luồng hoạt động hoặc các số liệu chính.
                            Hãy trả về nội dung dưới dạng văn bản rõ ràng, mạch lạc.
                            """;
                        UserMessage userMessage = UserMessage.builder()
                                .media(media)
                                .text(promptText)
                                .build();
                        ChatResponse aiResponse = chatModel.call(new Prompt(userMessage));
                        String imageDescription = aiResponse.getResult().getOutput().getText();
                        log.info("AI đã mô tả xong ảnh {}: \n{}", fileKey, imageDescription);
                        String enrichedContent = String.format("Tên file ảnh: %s\nNội dung chi tiết:\n%s", fileKey, imageDescription);
                        Document doc = new Document(enrichedContent, Map.of(
                                "projectId", event.projectId(),
                                "taskId", event.taskId(),
                                "fileKey", fileKey,
                                "doc_type", "ATTACHMENT"
                        ));
                        vectorStore.add(List.of(doc));
                    }else {
                        try {
                            TikaDocumentReader reader = new TikaDocumentReader(response.getBody());
                            List<Document> documents = reader.get();
                            for (Document doc : documents) {
                                doc.getMetadata().put("projectId", event.projectId());
                                doc.getMetadata().put("taskId", event.taskId());
                                doc.getMetadata().put("fileKey", fileKey);
                                doc.getMetadata().put("type", "ATTACHMENT");
                            }
                            TokenTextSplitter splitter = new TokenTextSplitter(800, 300, 10, 100, true);
                            List<Document> splitDocuments = splitter.apply(documents);
                            vectorStore.add(splitDocuments);
                        }catch (Exception e) {
                            log.error("Lỗi xử lý file key {}: {}", fileKey, e.getMessage());
                        }
                    }
                    break;
                }
                case "DELETE_FILE": {
                    String fileKey = event.metadata().get("fileKey").toString();
                    String sql = "DELETE FROM vector_store WHERE metadata ->> 'fileKey' = ?";
                    jdbcTemplate.update(sql, fileKey);
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


