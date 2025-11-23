package com.tuanhust.authservice.service;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.request.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;



public interface AuthService {
    AuthResponse login(LoginRequest loginRequest, HttpServletRequest request);
    AuthResponse refreshToken(String refreshToken,String accessToken);
    void logout(UserPrincipal userPrincipal);
    UserPrincipal verifyToken(String accessToken);
    AuthResponse loginWithGoogle(String token, HttpServletRequest request);
}
