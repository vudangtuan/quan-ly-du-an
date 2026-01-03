package com.tuanhust.authservice.service;

import com.tuanhust.authservice.entity.Session;

import java.util.List;

public interface SessionService {
    void createSession(Session session);
    void deleteSession(String userId,String sessionId);
    void deleteAllUserSessions(String userId);
    void deleteOtherUserSessions(String userId,String currentSessionId);
    boolean validateSession(String sessionId);
    boolean validateSessionWithRefreshToken(String sessionId,String refreshToken);
    void updateSession(String sessionId,String newRefreshToken);

    List<Session> getSessionByUserId(String id);
}
