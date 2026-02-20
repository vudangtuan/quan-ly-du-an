package com.tuanhust.aiservice.tool;


import com.tuanhust.aiservice.client.ActivityServiceClient;
import com.tuanhust.aiservice.client.CoreServiceClient;
import com.tuanhust.aiservice.dto.ApiResponse;
import com.tuanhust.aiservice.dto.TaskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;


import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Component
@RequiredArgsConstructor
public class AiTools {
    private final CoreServiceClient coreServiceClient;
    private final ActivityServiceClient activityServiceClient;
    private final VectorStore vectorStore;


    @Tool(description = """
            Tạo một nhiệm vụ (task) mới cho dự án chỉ dành cho những thành viên có
            vài trò là owner và admin.
            """)
    public String createTask(
            @ToolParam(description = "Tiêu đề nhiệm vụ") String title,
            @ToolParam(description = "Mô tả chi tiết nhiệm vụ") String description,
            @ToolParam(description = "Độ ưu tiên là 1 trong [LOW,HIGH,MEDIUM]") String priority,
            @ToolParam(description = "Hạn chót của nhiệm vụ dạng ISO String") String dueAt,
            @ToolParam(description = "ID của dự án chứa nhiệm vụ") String projectId,
            @ToolParam(description = "Id cột chứa nhiệm vụ") String boardColumnId,
            @ToolParam(description = "Danh sách id thành viên làm nhiệm vụ") List<String> assigneeIds,
            @ToolParam(description = "Danh sách id nhãn của nhiệm vụ") List<String> labelIds,
            @ToolParam(description = "Danh sách các công việc con cần làm của nhiệm vụ") List<String> checkLists
    ) {
        TaskRequest taskRequest = new TaskRequest(title, description, priority, dueAt,
                projectId, boardColumnId, assigneeIds, labelIds, checkLists);
        try {
            ResponseEntity<ApiResponse<?>> response =
                    coreServiceClient.createTask(projectId, taskRequest);
            if (response.getStatusCode().is2xxSuccessful()) {
                return "Hệ thống đã tạo thành công nhiệm vụ: " + title;
            } else {
                return "Không thể tạo nhiệm vụ. Phản hồi từ hệ thống: " + response.getBody();
            }
        } catch (Exception e) {
            return "Lỗi khi tạo nhiệm vụ: " + e.getMessage();
        }
    }


    @Tool(description = "Lấy thông tin chi tiết mới nhất của task")
    public Map<String, Object> getTask(
            @ToolParam(description = "Id của dự án") String projectId,
            @ToolParam(description = "Id của nhiệm vụ") String taskId
    ) {
        return coreServiceClient.getTask(projectId, taskId);
    }

    @Tool(description = "Lấy lịch sử hoạt động mới nhất của 1 project")
    public Object getHistoryForProject(
            @ToolParam(description = "Id của dự án") String projectId,
            @ToolParam(description = "Trang muốn lấy mặc định là 0") int page,
            @ToolParam(description = "Số lượng muốn lấy mặc định là 10") int size
    ) {
        return activityServiceClient.getActivity(projectId, page, size);
    }

    @Tool(description = "Lấy lịch sử hoạt động mới nhất của thành viên trong project")
    public Object getHistoryForProjectAndMember(
            @ToolParam(description = "Id của dự án") String projectId,
            @ToolParam(description = "Id của thành viên") String memberId,
            @ToolParam(description = "Trang muốn lấy mặc định là 0") int page,
            @ToolParam(description = "Số lượng muốn lấy mặc định là 10") int size
    ) {
        return activityServiceClient.getActivitiesByUserId(projectId, memberId, page, size);
    }

    @Tool(description = "Lấy lịch sử hoạt động mới nhất của 1 nhiệm vụ")
    public Object getHistoryForTask(
            @ToolParam(description = "Id của nhiệm vụ") String taskId,
            @ToolParam(description = "Trang muốn lấy mặc định là 0") int page,
            @ToolParam(description = "Số lượng muốn lấy mặc định là 10") int size
    ) {
        return activityServiceClient.getActivitiesByTask(taskId, page, size);
    }

    @Tool(description = "Lấy lịch sử hoạt động mới nhất của 1 thành viên trong 1 task")
    public Object getHistoryForTaskAndMember(
            @ToolParam(description = "Id của nhiệm vụ") String taskId,
            @ToolParam(description = "Id của thành viên") String memberId,
            @ToolParam(description = "Trang muốn lấy mặc định là 0") int page,
            @ToolParam(description = "Số lượng muốn lấy mặc định là 10") int size
    ) {
        return activityServiceClient.getActivitiesByTaskAndUser(taskId, memberId, page, size);
    }

    @Tool(description = "Tìm kiếm thông tin trong các tài liệu/file đính kèm của một Task cụ thể.")
    public String searchTaskAttachments(
            @ToolParam(description = "ID của Task") String taskId,
            @ToolParam(description = "Câu hỏi hoặc từ khóa cần tìm") String query
    ) {
        try {
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            Filter.Expression e = b.and(
                    b.eq("taskId", taskId),
                    b.eq("type", "ATTACHMENT")
            ).build();
            SearchRequest searchRequest = SearchRequest.builder()
                    .query(query)
                    .topK(5)
                    .filterExpression(e)
                    .build();
            List<Document> docs = vectorStore.similaritySearch(searchRequest);

            if (docs.isEmpty()) return "Không tìm thấy thông tin trong tài liệu của task này.";
            return docs.stream()
                    .map(d -> String.format("- [Trích từ %s]: %s",
                            d.getMetadata().get("fileKey"),
                            d.getFormattedContent()))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            return "Lỗi khi truy cập tài liệu.";
        }
    }
}
