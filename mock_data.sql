-- KẾT NỐI VÀO core_db TRƯỚC KHI CHẠY
-- \c core_db

-- QUAN TRỌNG: Set mã hóa để hiển thị tiếng Việt không lỗi
SET client_encoding TO 'UTF8';

-- Xóa sạch dữ liệu cũ để tạo mới từ đầu
TRUNCATE TABLE comment_mentions, comments, check_list, task_labels, task_assignee, tasks, board_columns, labels, project_members, projects CASCADE;

DO $$
DECLARE
    -- 4 USER THẬT CỦA BẠN
v_user_ids TEXT[] := ARRAY[
        '99ca853c-c418-40b1-ad7c-6c57961361d0', -- Tuấn Vũ Đăng
        'd4d969d6-e903-4e06-8995-3c4812fe1222', -- Vũ Đăng Tuấn
        '61479d01-2c1c-44bd-80b5-4342dbdf22df', -- Thương Phạm
        '2eb5c52c-d567-40a3-a193-8d8fec1891d9'  -- Tuấn
    ];

    v_project_count INT := 5;
    v_task_min INT := 5;
    v_task_max INT := 10;

    v_project_id TEXT; v_col_id TEXT; v_task_id TEXT;
    v_owner_id TEXT; v_member_id TEXT; v_role TEXT;

    v_i INT; v_j INT; v_k INT; v_rand_num INT; v_rand_role FLOAT;

    -- Cấu hình Cột
    v_columns_software TEXT[] := ARRAY['Backlog', 'Design', 'In Progress', 'Code Review', 'Testing', 'Done'];
    v_columns_marketing TEXT[] := ARRAY['Brainstorming', 'Content Plan', 'Writing', 'Design', 'Review', 'Published'];
    v_columns_basic TEXT[] := ARRAY['To Do', 'Doing', 'Pending', 'Done'];

    -- Cấu hình Label
    v_labels_tech TEXT[][] := ARRAY[
        ['Frontend', '#3B82F6'], ['Backend', '#10B981'], ['Database', '#F59E0B'],
        ['Bug', '#DC2626'], ['DevOps', '#6366F1'], ['Security', '#000000']
    ];
    v_labels_marketing TEXT[][] := ARRAY[
        ['Social Media', '#EC4899'], ['Blog', '#8B5CF6'], ['Ads', '#EF4444'],
        ['Event', '#F97316'], ['PR', '#14B8A6']
    ];

    v_current_labels TEXT[][];
    v_current_cols TEXT[];
    v_label_ids TEXT[];
    v_label_info TEXT[];
    v_col_name TEXT;
    v_sort_order FLOAT;

BEGIN
FOR v_i IN 1..v_project_count LOOP
        v_project_id := gen_random_uuid();

        -- 1. CHỌN CHỦ DỰ ÁN (Xoay vòng để ai cũng được làm chủ ít nhất 1 cái)
        v_owner_id := v_user_ids[((v_i - 1) % array_length(v_user_ids, 1)) + 1];

        -- Tên dự án đa dạng
INSERT INTO projects (project_id, name, description, creator_id, status, created_at, updated_at, due_at)
VALUES (
           v_project_id,
           CASE v_i
               WHEN 1 THEN 'Phát triển Siêu Ứng dụng (Super App)'
               WHEN 2 THEN 'Marketing: Ra mắt sản phẩm Mới'
               WHEN 3 THEN 'Tuyển dụng Nhân sự IT 2025'
               WHEN 4 THEN 'Nâng cấp hệ thống Server'
               ELSE 'Dự án Cá nhân: Học React & Spring Boot'
               END,
           'Dự án số ' || v_i || ' do ' || v_owner_id || ' làm chủ nhiệm. Cần sự phối hợp của các thành viên EDITOR và COMMENTER.',
           v_owner_id, 'ACTIVE', NOW(), NOW(),
           NOW() + (random() * 40 + 10) * '1 day'::INTERVAL
       );

-- 2. PHÂN VAI TRÒ (ROLE) ĐA DẠNG
FOREACH v_member_id IN ARRAY v_user_ids LOOP
            v_rand_role := random();

            IF v_member_id = v_owner_id THEN
                v_role := 'OWNER';
            ELSIF v_rand_role < 0.3 THEN
                v_role := 'EDITOR';    -- 30% cơ hội là Editor
            ELSIF v_rand_role < 0.6 THEN
                v_role := 'COMMENTER'; -- 30% cơ hội là Commenter
ELSE
                v_role := 'VIEWER';    -- 40% cơ hội là Viewer
END IF;

INSERT INTO project_members (project_id, member_id, role, joined_at)
VALUES (v_project_id, v_member_id, v_role, NOW());
END LOOP;

        -- Chọn Template
        IF v_i = 2 THEN v_current_labels := v_labels_marketing; v_current_cols := v_columns_marketing;
ELSE v_current_labels := v_labels_tech; v_current_cols := v_columns_software;
END IF;

        -- Tạo Labels
        v_label_ids := ARRAY[]::TEXT[];
        FOREACH v_label_info SLICE 1 IN ARRAY v_current_labels LOOP
            v_col_id := gen_random_uuid();
INSERT INTO labels (label_id, project_id, name, color)
VALUES (v_col_id, v_project_id, v_label_info[1], v_label_info[2]);
v_label_ids := array_append(v_label_ids, v_col_id);
END LOOP;

        -- Tạo Columns & Tasks
        v_sort_order := 1.0;
        FOREACH v_col_name IN ARRAY v_current_cols LOOP
            v_col_id := gen_random_uuid();
INSERT INTO board_columns (board_column_id, project_id, name, sort_order, status)
VALUES (v_col_id, v_project_id, v_col_name, v_sort_order, 'ACTIVE');
v_sort_order := v_sort_order + 1.0;

            -- Random số task (5-10 task/cột)
            v_rand_num := floor(random() * (v_task_max - v_task_min + 1) + v_task_min)::int;

FOR v_j IN 1..v_rand_num LOOP
                v_task_id := gen_random_uuid();
INSERT INTO tasks (
    task_id, title, description, status, priority, completed,
    due_at, created_at, updated_at, creator_id,
    sort_order, project_id, board_column_id
)
VALUES (
           v_task_id,
           v_col_name || ': ' || (ARRAY['Họp team', 'Review Code', 'Fix Bug UI', 'Viết Document', 'Design DB', 'Deploy CI/CD'])[floor(random()*6)+1] || ' #' || v_j,
           'Mô tả chi tiết công việc. Người được giao cần cập nhật tiến độ hằng ngày.',
           'ACTIVE',
           (ARRAY['LOW', 'MEDIUM', 'HIGH'])[floor(random()*3)+1], -- Priority ngẫu nhiên
           (random() < 0.25), -- 25% hoàn thành
           NOW() + (random() * 30 - 10) * '1 day'::INTERVAL,
           NOW(), NOW(),
           v_owner_id,
           v_j::float, v_project_id, v_col_id
       );

-- 3. BẮT BUỘC CÓ ASSIGNEE (1-3 người)
FOR v_k IN 1..(floor(random() * 3) + 1)::int LOOP
                    INSERT INTO task_assignee (task_id, assignee_id, join_at)
                    VALUES (v_task_id, v_user_ids[1 + floor(random() * 4)::int], NOW())
                    ON CONFLICT DO NOTHING;
END LOOP;

                -- 4. BẮT BUỘC CÓ LABEL (1-2 nhãn)
                IF array_length(v_label_ids, 1) > 0 THEN
                    FOR v_k IN 1..(floor(random() * 2) + 1)::int LOOP
                        INSERT INTO task_labels (task_id, label_id)
                        VALUES (v_task_id, v_label_ids[1 + floor(random() * array_length(v_label_ids, 1))::int])
                        ON CONFLICT DO NOTHING;
END LOOP;
END IF;

                -- 5. CHECKLIST (3-6 items)
FOR v_k IN 1..(floor(random() * 4 + 3))::int LOOP
                    INSERT INTO check_list (check_list_id, body, task_id, done, creator_id, created_at, updated_at)
                    VALUES (gen_random_uuid(), 'Công việc con ' || v_k, v_task_id, (random() < 0.4), v_owner_id, NOW(), NOW());
END LOOP;

                -- 6. COMMENT (1-3 comment)
FOR v_k IN 1..(floor(random() * 3) + 1)::int LOOP
                    DECLARE
v_cmt_id TEXT := gen_random_uuid();
                        v_cmt_user TEXT := v_user_ids[1 + floor(random() * 4)::int];
                        v_tag_user TEXT := v_user_ids[1 + floor(random() * 4)::int];
BEGIN
                        IF random() < 0.6 THEN
                            INSERT INTO comments (comment_id, body, creator_id, task_id, created_at, updated_at)
                            VALUES (v_cmt_id, 'Nhờ @[User](' || v_tag_user || ') check giúp nhé!', v_cmt_user, v_task_id, NOW(), NOW());
INSERT INTO comment_mentions (comment_id, mention_id) VALUES (v_cmt_id, v_tag_user);
ELSE
                            INSERT INTO comments (comment_id, body, creator_id, task_id, created_at, updated_at)
                            VALUES (v_cmt_id, 'Đã cập nhật tiến độ.', v_cmt_user, v_task_id, NOW(), NOW());
END IF;
END;
END LOOP;

END LOOP;
END LOOP;
END LOOP;
END $$;