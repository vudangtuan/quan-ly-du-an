package com.tuanhust.authservice;

import com.tuanhust.authservice.entity.Session;
import com.tuanhust.authservice.service.impl.SessionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.TimeUnit;

@ExtendWith(MockitoExtension.class)
public class SessionServiceTest {
    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private SessionServiceImpl sessionService;

    @BeforeEach
    void setUp() {
        // Mock hành vi của RedisTemplate để trả về valueOperations
        Mockito.lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        // Set giá trị ttl thủ công vì @Value không hoạt động trong Unit Test thuần
        org.springframework.test.util.ReflectionTestUtils.setField(sessionService, "ttl", 604800000L);
    }

    @Test
    void updateSession_ShouldResetTTL() {
        // 1. Giả lập dữ liệu
        String sessionId = "test-session-id";
        String newRefreshToken = "new-refresh-token";
        Session mockSession = Session.builder()
                .sessionId(sessionId)
                .userId("user-1")
                .build();

        // Giả lập redis tìm thấy session cũ
        Mockito.when(valueOperations.get("session:" + sessionId)).thenReturn(mockSession);

        // 2. Gọi hàm cần test
        sessionService.updateSession(sessionId, newRefreshToken);

        // 3. VERIFY (Quan trọng nhất): Kiểm tra xem hàm set có được gọi với đúng tham số TTL không
        Mockito.verify(valueOperations).set(
                Mockito.eq("session:" + sessionId), // Key phải đúng
                Mockito.any(Session.class),         // Object session
                Mockito.eq(604800000L),             // TTL phải là giá trị gốc (reset)
                Mockito.eq(TimeUnit.MILLISECONDS)
        );
    }
}
