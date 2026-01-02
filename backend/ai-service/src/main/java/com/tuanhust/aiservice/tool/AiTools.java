package com.tuanhust.aiservice.tool;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;


import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;


@Component
@RequiredArgsConstructor
public class AiTools {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Tool(description = """
        Lấy lịch sử hoạt động TỔNG QUAN của toàn bộ dự án.
        
        Trả về các hoạt động gần đây nhất trên toàn dự án (tạo task mới, cập nhật trạng thái,
        thay đổi thành viên, v.v.) để có cái nhìn tổng quan về diễn biến dự án.
        
        CHÚ Ý QUAN TRỌNG:
            - SỬ DỤNG KHI: Người dùng hỏi về "dự án có gì mới?", "hoạt động gần đây của dự án",
              "tổng quan dự án" hoặc không chỉ định task cụ thể.
            - TUYỆT ĐỐI KHÔNG DÙNG KHI: Người dùng hỏi về một Task/nhiệm vụ CỤ THỂ
              (ví dụ: "task ABC có gì thay đổi?") → Dùng getHistoryForTask thay thế.
        """)
    public String getRecentHistoryForProject(
            @ToolParam(description = "ID của dự án cần tra cứu (định dạng UUID, ví dụ: '123e4567-e89b-12d3-a456-426614174000')")
            String projectId,

            @ToolParam(description = "Số lượng bản ghi lịch sử muốn lấy (giá trị từ 1-20, mặc định là 5 nếu không chỉ định hoặc ngoài khoảng)")
            int limit
    ) {
        int realLimit = (limit > 0 && limit <= 20) ? limit : 5;
        String sql = """
                SELECT id, content, metadata
                FROM vector_store
                WHERE metadata ->> 'projectId' = ?
                  AND metadata ->> 'doc_type' = 'HISTORY'
                ORDER BY metadata ->> 'createdAt' DESC
                LIMIT ?
            """;
        try {
            List<Document> documents = jdbcTemplate.query(sql, this::mapRow, projectId, realLimit);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(documents);
        } catch (Exception e) {
            return "Lỗi khi lấy lịch sử dự án, vui lòng thử lại";
        }
    }

    @Tool(description = """
        Lấy lịch sử hoạt động CỤ THỂ của MỘT NHIỆM VỤ (task).
        
        Trả về các thay đổi, cập nhật liên quan đến một task cụ thể (thay đổi trạng thái,
        gán người thực hiện, cập nhật deadline, bình luận, v.v.).
        
        SỬ DỤNG KHI:
            - Người dùng hỏi về lịch sử của một task cụ thể
            - Cần xem chi tiết các thay đổi của một nhiệm vụ
            - Ví dụ: "task ABC có gì thay đổi?", "lịch sử của task XYZ"
        """)
    public String getHistoryForTask(
            @ToolParam(description = "ID của dự án chứa task (định dạng UUID)")
            String projectId,

            @ToolParam(description = "ID của nhiệm vụ/task cần xem lịch sử (định dạng UUID)")
            String taskId,

            @ToolParam(description = "Số lượng bản ghi lịch sử muốn lấy (giá trị từ 1-20, mặc định là 5)")
            int limit
    ) {
        int realLimit = (limit > 0 && limit <= 20) ? limit : 5;
        String sql = """
                SELECT id, content, metadata
                FROM vector_store
                WHERE metadata ->> 'projectId' = ?
                  AND metadata ->> 'taskId' = ?
                  AND metadata ->> 'doc_type' = 'HISTORY'
                ORDER BY metadata ->> 'createdAt' DESC
                LIMIT ?
            """;
        try {
            List<Document> documents = jdbcTemplate.query(sql, this::mapRow, projectId, taskId, realLimit);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(documents);
        } catch (Exception e) {
            return "Lỗi khi lấy lịch sử task, vui lòng thử lại";
        }
    }

    @Tool(description = """
            Lấy lịch sử hoạt động của MỘT THÀNH VIÊN cụ thể trong dự án.
            
            Trả về tất cả các hoạt động mà một thành viên đã thực hiện trong dự án
            (tạo task, cập nhật trạng thái, bình luận, thay đổi deadline, v.v.).
            
            SỬ DỤNG KHI:
            - Cần xem một thành viên đã làm gì trong dự án
            - Theo dõi đóng góp/hoạt động của một người cụ thể
            - Ví dụ: "Anh Minh đã làm gì?", "hoạt động của user@example.com",
                    "cho tôi xem công việc của thành viên X"
            """)
    public String getHistoryForMember(
            @ToolParam(description = "ID của dự án (định dạng UUID)")
            String projectId,

            @ToolParam(description = "Email của thành viên cần xem lịch sử hoạt động")
            String memberEmail,

            @ToolParam(description = "Số lượng bản ghi lịch sử muốn lấy (giá trị từ 1-20, mặc định là 5)") Integer limit) {
            int realLimit = (limit > 0 && limit <= 20) ? limit : 5;
        String sql = """
                SELECT id, content, metadata
                FROM vector_store
                WHERE metadata ->> 'projectId' = ?
                  AND metadata ->> 'actorEmail' = ?
                  AND metadata ->> 'doc_type' = 'HISTORY'
                ORDER BY metadata ->> 'createdAt' DESC
                LIMIT ?
            """;
        try {
            List<Document> documents = jdbcTemplate.query(sql, this::mapRow, projectId, memberEmail, realLimit);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(documents);
        } catch (Exception e) {
            return "Lỗi khi lấy lịch sử task, vui lòng thử lại";
        }
    }

    @Tool(description = """
        Lấy thông tin TRẠNG THÁI HIỆN TẠI của nhiều nhiệm vụ (task).
        
        Trả về thông tin mới nhất của các task được chỉ định,
        KHÔNG phải lịch sử thay đổi. Dùng để xem tình trạng hiện tại của nhiều task cùng lúc.
        
        SỬ DỤNG KHI:
            - Cần xem thông tin hiện tại của nhiều task
            - Ví dụ: "cho tôi xem task A, B, C", "trạng thái của các task này"
        
        KHÔNG DÙNG KHI:
            - Cần xem LỊCH SỬ thay đổi → Dùng getHistoryForTask hoặc getRecentHistoryForProject
        """)
    public String getTaskInfo(
            @ToolParam(description = "Danh sách ID của các nhiệm vụ/task cần xem (mỗi taskId có định dạng UUID)")
            List<String> taskIds
    ){
        String pgArrayString = "{" + String.join(",", taskIds) + "}";
        String sql = """
                SELECT id, content, metadata
                FROM vector_store
                WHERE id = ANY(?::uuid[])
            """;
        try {
            List<Document> documents = jdbcTemplate.query(sql, this::mapRow, pgArrayString);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(documents);
        } catch (Exception e) {
            return "Lỗi khi lấy thông tin task, vui lòng thử lại";
        }
    }


    public Document mapRow(ResultSet rs, int rowNum) throws SQLException {
        try {
            String id = rs.getString("id");
            String content = rs.getString("content");
            String metadataJson = rs.getString("metadata");

            Map<String, Object> metadata = objectMapper.readValue(
                    metadataJson,
                    new TypeReference<>() {
                    }
            );

            return new Document(id, content, metadata);

        } catch (JsonProcessingException e) {
            throw new SQLException("Error parsing metadata JSON", e);
        }
    }
}
