-- Script tạo 100 tài khoản mẫu cho PostgreSQL
-- Mật khẩu mặc định cho tất cả: password123
-- Hash Bcrypt: $2a$10$8.UnVuG9TgH5Bg1S6W8iP.Q9VvE9V9V9V9V9V9V9V9V9V9V9V9V9

DO $$
BEGIN
FOR i IN 1..1000 LOOP
        INSERT INTO users (
            user_id,
            email,
            password_hash,
            full_name,
            oauth_provider,
            oauth_provider_id,
            status,
            role,
            created_at,
            updated_at
        )
        VALUES (
            'perf_user_' || LPAD(i::text, 4, '0'),           -- user_id: perf_user_001...
            'tester' || i || '@hust.edu.vn',                -- email
            '$2a$10$Y2Ox8oqI9oX02Y91Uv/52OB6BcVxFsgmqSvjJoZQ14JRfcv0uejou', -- password_hash
            'HUST Tester ' || i,                            -- full_name
            'GOOGLE',                                       -- oauth_provider
            'google_id_' || i,                              -- oauth_provider_id
            'ACTIVE',                                       -- status
            'USER',                                         -- role
            NOW(),
            NOW()
        );
END LOOP;
END $$;