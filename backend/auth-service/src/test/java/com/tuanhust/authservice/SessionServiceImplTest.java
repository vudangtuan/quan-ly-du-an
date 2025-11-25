package com.tuanhust.authservice;

import com.tuanhust.authservice.entity.Session;
import com.tuanhust.authservice.service.impl.SessionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @Mock
    private SetOperations<String, Object> setOperations;

    @InjectMocks
    private SessionServiceImpl sessionService;

    @BeforeEach
    void setUp() {
        // Mock các operations của Redis
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(redisTemplate.opsForSet()).thenReturn(setOperations);
        // Set giá trị ttl (vì @Value không chạy trong unit test thuần)
        ReflectionTestUtils.setField(sessionService, "ttl", 604800000L);
    }

    @Test
    @DisplayName("Create Session: Should save to Redis")
    void createSession_Success() {
        Session session = Session.builder().sessionId("sess-1").userId("user-1").build();

        sessionService.createSession(session);

        // Verify lưu session info
        verify(valueOperations).set(eq("session:sess-1"), eq(session), anyLong(), eq(TimeUnit.MILLISECONDS));
        // Verify lưu mapping user -> session
        verify(setOperations).add(eq("user_sessions:user-1"), eq("sess-1"));
    }

    @Test
    @DisplayName("Validate Session: Return true if exists")
    void validateSession_Exists() {
        when(valueOperations.get("session:sess-1")).thenReturn(new Session());
        assertTrue(sessionService.validateSession("sess-1"));
    }

    @Test
    @DisplayName("Validate Session: Return false if null")
    void validateSession_NotFound() {
        when(valueOperations.get("session:sess-1")).thenReturn(null);
        assertFalse(sessionService.validateSession("sess-1"));
    }

    @Test
    @DisplayName("Validate Refresh Token: Fail if mismatch")
    void validateSessionWithRefreshToken_Mismatch() {
        Session session = Session.builder().refreshToken("token-A").build();
        when(valueOperations.get("session:sess-1")).thenReturn(session);

        boolean result = sessionService.validateSessionWithRefreshToken("sess-1", "token-B");
        assertFalse(result);
    }

    @Test
    @DisplayName("Delete Other Sessions: Should keep current, delete others")
    void deleteOtherUserSessions() {
        String userId = "u1";
        String currentSession = "sess-1";
        Set<Object> allSessions = new HashSet<>();
        allSessions.add("sess-1");
        allSessions.add("sess-2"); // Session khác cần xóa
        allSessions.add("sess-3"); // Session khác cần xóa

        when(setOperations.members("user_sessions:" + userId)).thenReturn(allSessions);

        sessionService.deleteOtherUserSessions(userId, currentSession);

        // Verify xóa sess-2 và sess-3
        verify(redisTemplate).delete("session:sess-2");
        verify(setOperations).remove("user_sessions:" + userId, "sess-2");
        verify(redisTemplate).delete("session:sess-3");
        verify(setOperations).remove("user_sessions:" + userId, "sess-3");

        // Verify KHÔNG xóa sess-1
        verify(redisTemplate, never()).delete("session:sess-1");
    }
}