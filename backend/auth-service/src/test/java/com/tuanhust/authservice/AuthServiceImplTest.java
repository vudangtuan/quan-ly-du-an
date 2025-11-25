package com.tuanhust.authservice;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.entity.Session;
import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.provider.JwtTokenProvider;
import com.tuanhust.authservice.repository.UserRepository;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.request.CreatePassword;
import com.tuanhust.authservice.request.LoginRequest;
import com.tuanhust.authservice.request.UpdatePassword;
import com.tuanhust.authservice.service.SessionService;
import com.tuanhust.authservice.service.impl.AuthServiceImpl;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private SessionService sessionService;
    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private AuthServiceImpl authService;

    // --- Test Case: Đăng nhập thành công ---
    @Test
    @DisplayName("Login Success: Should return AuthResponse with tokens")
    void login_Success() {
        // 1. Giả lập dữ liệu đầu vào
        LoginRequest request = new LoginRequest();
        request.setEmail("test@gmail.com");
        request.setPassword("password123");

        User mockUser = User.builder()
                .userId("user-id-1")
                .email("test@gmail.com")
                .passwordHash("encodedPass")
                .status(User.UserStatus.ACTIVE)
                .role(User.Role.USER)
                .build();

        // 2. Mock hành vi
        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password123", "encodedPass")).thenReturn(true);
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("refresh-token-123");
        when(jwtTokenProvider.generateAccessToken(any(User.class), anyString())).thenReturn("access-token-123");

        // MOCK Claims thay vì new DefaultClaims()
        Claims mockClaims = mock(Claims.class);
        when(mockClaims.getExpiration()).thenReturn(new Date(System.currentTimeMillis() + 3600000)); // 1 giờ sau
        when(jwtTokenProvider.getClaims("access-token-123")).thenReturn(mockClaims);

        // 3. Gọi hàm
        AuthResponse response = authService.login(request, httpServletRequest);

        // 4. Assert
        assertNotNull(response);
        assertEquals("access-token-123", response.getAccessToken());
        assertEquals("refresh-token-123", response.getRefreshToken());

        verify(sessionService, times(1)).createSession(any(Session.class));
    }

    // --- Test Case: Refresh Token ---
    @Test
    @DisplayName("Refresh Token Success")
    void refreshToken_Success() {
        String refreshToken = "old-refresh-token";
        String accessToken = "expired-access-token";
        String sessionId = "session-1";
        String email = "test@gmail.com";

        // MOCK Claims cho token cũ
        Claims oldClaims = mock(Claims.class);
        when(oldClaims.get("sessionId", String.class)).thenReturn(sessionId);
        when(oldClaims.getSubject()).thenReturn(email);

        User mockUser = User.builder().userId("u1").email(email).role(User.Role.USER).build();

        // Mock hành vi
        when(jwtTokenProvider.getClaimsFromExpiredToken(accessToken)).thenReturn(oldClaims);
        when(sessionService.validateSessionWithRefreshToken(sessionId, refreshToken)).thenReturn(true);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mockUser));
        when(jwtTokenProvider.generateRefreshToken()).thenReturn("new-refresh-token");
        when(jwtTokenProvider.generateAccessToken(eq(mockUser), eq(sessionId))).thenReturn("new-access-token");

        // MOCK Claims cho token mới để tính expiresIn
        Claims newClaims = mock(Claims.class);
        when(newClaims.getExpiration()).thenReturn(new Date(System.currentTimeMillis() + 3600000));
        when(jwtTokenProvider.getClaims("new-access-token")).thenReturn(newClaims);

        // Gọi hàm
        AuthResponse response = authService.refreshToken(refreshToken, accessToken);

        // Assert
        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        verify(sessionService).updateSession(eq(sessionId), eq("new-refresh-token"));
    }

    // --- Các test case lỗi vẫn giữ nguyên ---
    @Test
    @DisplayName("Login Fail: Wrong password")
    void login_WrongPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@gmail.com");
        request.setPassword("wrongpass");

        User mockUser = User.builder().email("test@gmail.com").passwordHash("encodedPass").build();

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongpass", "encodedPass")).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> authService.login(request, httpServletRequest));
    }

    @Test
    @DisplayName("Login Fail: User is not ACTIVE")
    void login_UserNotActive() {
        LoginRequest request = new LoginRequest();
        request.setEmail("blocked@gmail.com");
        request.setPassword("password123");

        User mockUser = User.builder()
                .email("blocked@gmail.com")
                .passwordHash("encodedPass")
                .status(User.UserStatus.SUSPENDED) // User bị khóa
                .build();

        when(userRepository.findByEmail("blocked@gmail.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password123", "encodedPass")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                authService.login(request, httpServletRequest)
        );
        assertEquals(403, exception.getStatusCode().value()); // Expect Forbidden
    }

    // --- Test Case: Refresh Token - Session Invalid ---
    @Test
    @DisplayName("Refresh Token Fail: Session invalid or mismatch")
    void refreshToken_SessionInvalid() {
        String refreshToken = "refresh-token";
        String accessToken = "access-token";
        String sessionId = "session-1";
        String email = "test@gmail.com";

        // Mock claims
        Claims oldClaims = mock(Claims.class);
        when(oldClaims.get("sessionId", String.class)).thenReturn(sessionId);
        when(oldClaims.getSubject()).thenReturn(email);
        when(jwtTokenProvider.getClaimsFromExpiredToken(accessToken)).thenReturn(oldClaims);

        // Mock session validation fail (false)
        when(sessionService.validateSessionWithRefreshToken(sessionId, refreshToken)).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                authService.refreshToken(refreshToken, accessToken)
        );
        assertEquals(403, exception.getStatusCode().value());
    }

    // --- Test Case: Logout ---
    @Test
    @DisplayName("Logout Success: Should delete session")
    void logout_Success() {
        UserPrincipal userPrincipal = new UserPrincipal("u1", "test@a.com", "Test User");
        userPrincipal.setSessionId("session-123");

        authService.logout(userPrincipal);

        verify(sessionService, times(1)).deleteSession("u1", "session-123");
    }

    // --- Test Case: Create Password - Success ---
    @Test
    @DisplayName("Create Password Success")
    void createPassword_Success() {
        String userId = "user-1";
        CreatePassword request = new CreatePassword();
        request.setPassword("newPass123");
        request.setConfirmPassword("newPass123");

        User mockUser = new User();
        mockUser.setUserId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.encode("newPass123")).thenReturn("encodedNewPass");

        authService.createPassword(userId, request);

        assertEquals("encodedNewPass", mockUser.getPasswordHash());
        verify(userRepository, times(1)).findById(userId); // User được save gián tiếp do @Transactional (JPA managed state)
    }

    // --- Test Case: Create Password - Mismatch ---
    @Test
    @DisplayName("Create Password Fail: Passwords do not match")
    void createPassword_Mismatch() {
        CreatePassword request = new CreatePassword();
        request.setPassword("pass1");
        request.setConfirmPassword("pass2"); // Khác nhau

        when(userRepository.findById(anyString())).thenReturn(Optional.of(new User()));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                authService.createPassword("user-1", request)
        );
        assertEquals(400, exception.getStatusCode().value());
    }

    // --- Test Case: Update Password - Success ---
    @Test
    @DisplayName("Update Password Success")
    void updatePassword_Success() {
        String userId = "user-1";
        UpdatePassword request = new UpdatePassword();
        request.setPassword("oldPass");
        request.setNewPassword("newPass");
        request.setConfirmPassword("newPass");

        User mockUser = User.builder()
                .userId(userId)
                .passwordHash("encodedOldPass")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("oldPass", "encodedOldPass")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPass");

        authService.updatePassword(userId, request);

        assertEquals("encodedNewPass", mockUser.getPasswordHash());
    }

    // --- Test Case: Update Password - Wrong Old Password ---
    @Test
    @DisplayName("Update Password Fail: Wrong old password")
    void updatePassword_WrongOldPassword() {
        UpdatePassword request = new UpdatePassword();
        request.setPassword("wrongOldPass");
        request.setNewPassword("newPass");
        request.setConfirmPassword("newPass");

        User mockUser = User.builder().passwordHash("encodedOldPass").build();

        when(userRepository.findById(anyString())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongOldPass", "encodedOldPass")).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                authService.updatePassword("user-1", request)
        );
        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    @DisplayName("Refresh Token Fail: User not found")
    void refreshToken_UserNotFound() {
        String refreshToken = "refresh-token";
        String accessToken = "access-token";
        String sessionId = "session-1";
        String email = "ghost@gmail.com";

        Claims oldClaims = mock(Claims.class);
        when(oldClaims.get("sessionId", String.class)).thenReturn(sessionId);
        when(oldClaims.getSubject()).thenReturn(email);
        when(jwtTokenProvider.getClaimsFromExpiredToken(accessToken)).thenReturn(oldClaims);
        when(sessionService.validateSessionWithRefreshToken(sessionId, refreshToken)).thenReturn(true);

        // Mock tìm user trả về empty
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                authService.refreshToken(refreshToken, accessToken)
        );
    }

    @Test
    @DisplayName("Update Password Fail: User not found")
    void updatePassword_UserNotFound() {
        UpdatePassword request = new UpdatePassword();
        request.setNewPassword("pass");
        request.setConfirmPassword("pass");

        when(userRepository.findById("unknown-id")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.updatePassword("unknown-id", request)
        );
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("Update Password Fail: Confirm password mismatch")
    void updatePassword_ConfirmMismatch() {
        UpdatePassword request = new UpdatePassword();
        request.setNewPassword("pass1");
        request.setConfirmPassword("pass2"); // Khác nhau

        User mockUser = User.builder().userId("uuid").passwordHash("encodedOldPass").build();

        when(userRepository.findById(anyString())).thenReturn(Optional.of(mockUser));

        // Service check mismatch trước khi gọi DB -> nên không cần mock DB
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.updatePassword(mockUser.getUserId(), request)
        );
        assertEquals(400, ex.getStatusCode().value());
    }
}