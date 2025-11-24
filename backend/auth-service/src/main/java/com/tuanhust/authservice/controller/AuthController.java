package com.tuanhust.authservice.controller;

import com.tuanhust.authservice.config.UserPrincipal;
import com.tuanhust.authservice.repsonse.ApiResponse;
import com.tuanhust.authservice.repsonse.AuthResponse;
import com.tuanhust.authservice.request.CreatePassword;
import com.tuanhust.authservice.request.GoogleLoginRequest;
import com.tuanhust.authservice.request.LoginRequest;
import com.tuanhust.authservice.request.UpdatePassword;
import com.tuanhust.authservice.service.AuthService;
import com.tuanhust.authservice.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody @Valid LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.login(loginRequest,request);

        cookieUtil.addRefreshTokenCookie(response,authResponse.getRefreshToken());

        authResponse.setRefreshToken(null);

        log.info("Login Success");
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @RequestBody @Valid GoogleLoginRequest googleLoginRequest,
            HttpServletRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.loginWithGoogle(googleLoginRequest.getToken(),request);

        cookieUtil.addRefreshTokenCookie(response,authResponse.getRefreshToken());

        authResponse.setRefreshToken(null);

        return ResponseEntity.ok(authResponse);
    }


    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response
    ){
        String refreshToken = cookieUtil.getRefreshTokenFromCookie(request)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Refresh token not found in cookie"));
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED
                    ,"Access token not found in Authorization header");
        }
        String accessToken = authHeader.substring(7);
        AuthResponse authResponse = authService.refreshToken(refreshToken,accessToken);
        cookieUtil.addRefreshTokenCookie(response,authResponse.getRefreshToken());
        authResponse.setRefreshToken(null);
        log.info("Refresh Success");
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                      HttpServletResponse response){
        authService.logout(userPrincipal);
        cookieUtil.deleteRefreshTokenCookie(response);
        return ResponseEntity.ok(ApiResponse.success("logout success",null));
    }

    @PostMapping("/password")
    public ResponseEntity<ApiResponse<Void>> create(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid CreatePassword createPassword){
        authService.createPassword(userPrincipal.getUserId(),createPassword);
        return ResponseEntity.ok(ApiResponse.success("created",null));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid UpdatePassword updatePassword){
        authService.updatePassword(userPrincipal.getUserId(),updatePassword);
        return ResponseEntity.ok(ApiResponse.success("updated",null));
    }
}
