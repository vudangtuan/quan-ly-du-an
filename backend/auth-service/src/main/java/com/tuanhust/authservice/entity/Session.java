package com.tuanhust.authservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session implements Serializable {
    private String sessionId;
    private String userId;
    private String refreshToken;
    private String deviceInfo;
    private String ipAddress;
    private Instant createdAt;
    private Instant lastAccessedAt;
}
