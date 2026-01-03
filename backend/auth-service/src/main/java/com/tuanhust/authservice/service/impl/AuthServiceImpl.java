package com.tuanhust.authservice.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.Session;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.event.ActivityEvent;
import com.tuanhust.authservice.event.ActivityType;
import com.tuanhust.authservice.provider.JwtTokenProvider;
import com.tuanhust.authservice.repository.UserRepository;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.repsonse.UserInfo;
import com.tuanhust.authservice.request.CreatePassword;
import com.tuanhust.authservice.request.LoginRequest;
import com.tuanhust.authservice.request.UpdatePassword;
import com.tuanhust.authservice.service.AuthService;
import com.tuanhust.authservice.service.SessionService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.time.Instant;
import java.util.*;


@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SessionService sessionService;
    private final ApplicationEventPublisher eventPublisher;


    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest loginRequest, HttpServletRequest request) {
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong Password");
        }
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is " + user.getStatus());
        }

        String sessionId = UUID.randomUUID().toString();
        String refreshToken = jwtTokenProvider.generateRefreshToken();

        Session session = getSession(request, user.getUserId(), sessionId, refreshToken);
        sessionService.createSession(session);

        Map<String, Object> data = new HashMap<>();
        data.put("device", session.getDeviceInfo());
        data.put("ipAddress", session.getIpAddress());

        eventPublisher.publishEvent(new ActivityEvent(
                user.getUserId(), user.getFullName(), user.getEmail(),
                ActivityType.LOGIN, "đã đăng nhập", data,
                Instant.now()
        ));

        return userMapToAuthResponse(user, sessionId, refreshToken);
    }


    @Override
    public AuthResponse refreshToken(String refreshToken, String accessToken) {
        Claims claims = jwtTokenProvider.getClaimsFromExpiredToken(accessToken);
        String sessionId = claims.get("sessionId", String.class);
        String email = claims.getSubject();

        if (!sessionService.validateSessionWithRefreshToken(sessionId, refreshToken)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Session is invalid or expired");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not found"));
        String newRefreshToken = jwtTokenProvider.generateRefreshToken();
        sessionService.updateSession(sessionId, newRefreshToken);

        return userMapToAuthResponse(user, sessionId, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(UserPrincipal user) {
        sessionService.deleteSession(user.getUserId(), user.getSessionId());

        eventPublisher.publishEvent(new ActivityEvent(
                user.getUserId(), user.getFullName(), user.getEmail(),
                ActivityType.LOGOUT, "đã đăng xuất", Map.of(),
                Instant.now()
        ));
    }


    @Override
    @Transactional
    public AuthResponse loginWithGoogle(String token, HttpServletRequest request) {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
                .Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google Id token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String userIdFromGoogle = payload.getSubject();

        User user = userRepository.findByEmail(email).orElseGet(() -> {

            User savedUser = userRepository.save(User.builder()
                    .email(email)
                    .fullName(name)
                    .oauthProvider(User.OAuthProvider.GOOGLE)
                    .oauthProviderId(userIdFromGoogle)
                    .role(User.Role.USER)
                    .status(User.UserStatus.ACTIVE)
                    .build());


            eventPublisher.publishEvent(new ActivityEvent(
                    savedUser.getUserId(), savedUser.getFullName(), savedUser.getEmail(),
                    ActivityType.CREATE_ACCOUNT,
                    "đã tạo tài khoản mới", Map.of(),
                    Instant.now()
            ));

            return savedUser;
        });

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is " + user.getStatus());
        }

        String sessionId = UUID.randomUUID().toString();
        String refreshToken = jwtTokenProvider.generateRefreshToken();

        Session session = getSession(request, user.getUserId(), sessionId, refreshToken);
        sessionService.createSession(session);


        Map<String, Object> data = new HashMap<>();
        data.put("device", session.getDeviceInfo());
        data.put("ipAddress", session.getIpAddress());

        eventPublisher.publishEvent(new ActivityEvent(
                user.getUserId(), user.getFullName(), user.getEmail(),
                ActivityType.LOGIN, "đã đăng nhập", data,
                Instant.now()
        ));

        return userMapToAuthResponse(user, sessionId, refreshToken);
    }

    @Override
    @Transactional
    public void createPassword(String userId, CreatePassword createPassword) {
        User user = userRepository.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!Objects.equals(createPassword.getPassword(), createPassword.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
        user.setPasswordHash(passwordEncoder.encode(createPassword.getPassword()));

    }

    @Override
    @Transactional
    public void updatePassword(String userId, UpdatePassword updatePassword) {
        User user = userRepository.findById(userId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!Objects.equals(updatePassword.getNewPassword(), updatePassword.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
        if (!passwordEncoder.matches(updatePassword.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wrong Password");
        }
        user.setPasswordHash(passwordEncoder.encode(updatePassword.getNewPassword()));
    }


    private AuthResponse userMapToAuthResponse(User user, String sessionId, String refreshToken) {
        String accessToken = jwtTokenProvider.generateAccessToken(user, sessionId);
        Long expiresIn = jwtTokenProvider.getClaims(accessToken)
                .getExpiration().getTime() - System.currentTimeMillis();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(expiresIn)
                .userInfo(UserInfo.builder()
                        .userId(user.getUserId())
                        .hasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isBlank())
                        .role(user.getRole().toString())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .createdAt(user.getCreatedAt())
                        .build())
                .build();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_X_FORWARDED",
                "HTTP_X_CLUSTER_CLIENT_IP",
                "HTTP_CLIENT_IP",
                "HTTP_FORWARDED_FOR",
                "HTTP_FORWARDED",
                "HTTP_VIA",
                "REMOTE_ADDR"
        };

        for (String headerName : headerNames) {
            String ip = request.getHeader(headerName);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }

        return request.getRemoteAddr();
    }


    private Session getSession(HttpServletRequest request,
                               String userId,
                               String sessionId,
                               String refreshToken) {
        String deviceInfo = request.getHeader("User-Agent");
        String ipAddress = getClientIpAddress(request);

        return Session.builder()
                .sessionId(sessionId)
                .userId(userId)
                .refreshToken(refreshToken)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .createdAt(Instant.now())
                .lastAccessedAt(Instant.now())
                .build();
    }
}
