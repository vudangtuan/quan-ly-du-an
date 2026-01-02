  Nhiệm vụ: Thiết lập không gian làm việc thông minh cho dự án: "{projectName}"
  THÔNG TIN ĐẦU VÀO:
    - Thời gian hiện tại: {now}

  BƯỚC 1: PHÂN TÍCH NGỮ CẢNH
    - Phân tích tên dự án để xác định lĩnh vực và đối tượng người dùng
        - Ví dụ:
            + IT/Phần mềm → Agile: Backlog, In Sprint, In Review, Testing, Done
            + Marketing → Campaign: Planning, Content Creation, Review, Publishing, Analytics
            + Xây dựng → Construction: Design, Procurement, Execution, QC, Handover
            + Sự kiện/Đám cưới → Event Planning: Ideas, Planning, Vendors, Execution, Follow-up
            + Học tập → Study Flow: To Learn, Studying, Review, Mastered
            + Cá nhân → Personal: Inbox, Next, In Progress, Waiting, Completed

  BƯỚC 2: TẠO CẤU TRÚC THEO YÊU CẦU
    1. **Board Columns:**
        - Đặt tên ngắn gọn, phản ánh quy trình thực tế của lĩnh vực (bằng tiếng anh)
        - description: ngắn gọn bằng tiếng việt
        - Sắp xếp theo thứ tự logic từ trái sang phải (sortOrder: 0, 1, 2...)
        - TRÁNH dùng tên chung chung như "To Do", "Done" trừ khi dự án quá đơn giản

    2. **Labels:**
        - Tạo nhãn phân loại theo BẢN CHẤT công việc, KHÔNG theo mức độ ưu tiên (bằng tiếng anh)
        - TUYỆT ĐỐI KHÔNG dùng: "Low", "Medium", "High"
        - description: ngắn gọn bằng tiếng việt
        - Gợi ý theo lĩnh vực:
            + IT: "Backend", "Frontend", "Bug", "Feature", "DevOps",...
            + Marketing: "Social", "SEO", "Email", "Design", "Analytics",...
            + Sự kiện: "Venue", "Catering", "Guest", "Decoration", "Budget",...
        - Màu sắc: Chọn hex code (#rrggbb) phù hợp với ý nghĩa nhãn

    3. **Thông tin dự án:**
        - name: Giữ nguyên hoặc cải tiến tên gốc nếu cần (ngắn gọn, súc tích)
        - description: Viết MÔ TẢ dự án (bằng tiếng Việt)
            * KHÔNG liệt kê các bước thực hiện
            * KHÔNG mô tả quy trình hay workflow
            * TẬP TRUNG vào: Mục đích là gì? Giải quyết vấn đề gì? Kết quả mong đợi?
        - dueAt: Ước tính thời gian hoàn thành hợp lý (ISO 8601 format) và lấy giờ là cuối ngày

  YÊU CẦU ĐẦU RA:
        - Trả về ĐÚNG JSON thuần túy theo format: {format}
        - KHÔNG thêm markdown (```json), KHÔNG giải thích
        - Đảm bảo valid JSON với cú pháp chính xác