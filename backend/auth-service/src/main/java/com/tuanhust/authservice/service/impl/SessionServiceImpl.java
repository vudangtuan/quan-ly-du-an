package com.tuanhust.authservice.service.impl;

import com.tuanhust.authservice.entity.Session;
import com.tuanhust.authservice.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;


import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionServiceImpl implements SessionService {

    @Value("${jwt.time-to-live:604800000}")
    private long ttl;

    private static final String SESSION_PREFIX = "session:";
    private static final String USER_SESSIONS_PREFIX = "user_sessions:";


    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void createSession(Session session) {
        redisTemplate.opsForValue().set(SESSION_PREFIX + session.getSessionId(),
                session, ttl, TimeUnit.MILLISECONDS);
        redisTemplate.opsForSet().add(USER_SESSIONS_PREFIX + session.getUserId(),
                session.getSessionId());
        log.debug("Session created: {} for user: {}", session.getSessionId(), session.getUserId());
    }

    @Override
    public void deleteSession(String userId, String sessionId) {
        redisTemplate.delete(SESSION_PREFIX + sessionId);
        redisTemplate.opsForSet().remove(USER_SESSIONS_PREFIX + userId, sessionId);
        log.debug("Session deleted: {} for user: {}", sessionId, userId);
    }

    @Override
    public void deleteAllUserSessions(String userId) {
        Set<String> sessionIds = getSessionUserIds(userId);
        sessionIds.forEach(sessionId -> {
            redisTemplate.delete(SESSION_PREFIX + sessionId);
        });
        redisTemplate.delete(USER_SESSIONS_PREFIX + userId);
        log.debug("All {} sessions deleted for user: {}", sessionIds.size(), userId);
    }

    @Override
    public void deleteOtherUserSessions(String userId, String currentSessionId) {
        Set<String> sessionIds = getSessionUserIds(userId);
        sessionIds.stream()
                .filter(sessionId -> !sessionId.equals(currentSessionId))
                .forEach(sessionId -> {
                    redisTemplate.delete(SESSION_PREFIX + sessionId);
                    redisTemplate.opsForSet().remove(USER_SESSIONS_PREFIX + userId, sessionId);
                });
        log.debug("All other sessions deleted for user: {}, kept: {}", userId, currentSessionId);
    }


    @Override
    public boolean validateSession(String sessionId) {
        Optional<Session> sessionOpt = getSession(sessionId);
        if (sessionOpt.isEmpty()) {
            log.debug("Session not found: {}", sessionId);
            return false;
        }
        return true;
    }


    @Override
    public boolean validateSessionWithRefreshToken(String sessionId, String refreshToken) {
        validateSession(sessionId);
        Optional<Session> sessionOpt = getSession(sessionId);
        Session session = sessionOpt.orElseThrow();
        if (!session.getRefreshToken().equals(refreshToken)) {
            log.debug("Refresh token invalid: {}", refreshToken);
            return false;
        }
        return true;
    }

    @Override
    public void updateSession(String sessionId, String newRefreshToken) {
        getSession(sessionId).ifPresent(session -> {
            session.setRefreshToken(newRefreshToken);
            session.setLastAccessedAt(Instant.now());
            redisTemplate.opsForValue().set(SESSION_PREFIX + sessionId,
                    session, ttl, TimeUnit.MILLISECONDS);
            log.debug("Session updated: {} for user: {}",
                    session.getSessionId(), session.getUserId());
        });
    }

    @Override
    public List<Session> getSessionByUserId(String id) {
        Set<String> sessionIds = getSessionUserIds(id);
        return sessionIds.stream().map(s -> getSession(s).orElse(null))
                .filter(Objects::nonNull)
                .peek(s -> s.setRefreshToken(null))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    private Set<String> getSessionUserIds(String userId) {
        Set<Object> members = redisTemplate.opsForSet().members(USER_SESSIONS_PREFIX + userId);

        if (members == null) {
            return Set.of();
        }

        return members.stream()
                .map(String::valueOf)
                .collect(Collectors.toSet());
    }

    private Optional<Session> getSession(String sessionId) {
        return Optional.ofNullable((Session) redisTemplate.opsForValue()
                .get(SESSION_PREFIX + sessionId));
    }
}
