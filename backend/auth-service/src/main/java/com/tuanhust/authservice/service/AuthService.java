package com.tuanhust.authservice.service;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.request.CreatePassword;
import com.tuanhust.authservice.request.LoginRequest;
import com.tuanhust.authservice.request.UpdatePassword;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;


public interface AuthService {
    AuthResponse login(LoginRequest loginRequest, HttpServletRequest request);
    AuthResponse refreshToken(String refreshToken,String accessToken);
    void logout(UserPrincipal userPrincipal);
    UserPrincipal verifyToken(String accessToken);
    AuthResponse loginWithGoogle(String token, HttpServletRequest request);
    void createPassword(String userId, CreatePassword createPassword);

    void updatePassword(String userId, @Valid UpdatePassword updatePassword);
}
