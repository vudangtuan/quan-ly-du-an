package com.tuanhust.authservice.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
@Slf4j
public class CookieUtil {
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    @Value("${cookie.domain:localhost}")
    private String cookieDomain;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${jwt.refresh-token-expiration:2592000000}") // 30 days
    private Long refreshTokenExpiration;

    public void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
//        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
//        cookie.setHttpOnly(true);
//        cookie.setSecure(cookieSecure);
//        cookie.setPath("/");
//        cookie.setDomain(cookieDomain);
//        cookie.setMaxAge((int) (refreshTokenExpiration / 1000));
//
//        // SameSite attribute (Spring Boot 3.x automatically handles this)
//        response.addCookie(cookie);

        // Manually add SameSite if needed
        response.addHeader("Set-Cookie",
                String.format("%s=%s; Path=/; Domain=%s; Max-Age=%d; HttpOnly; %s SameSite=%s",
                        REFRESH_TOKEN_COOKIE_NAME,
                        refreshToken,
                        cookieDomain,
                        (int) (refreshTokenExpiration / 1000),
                        cookieSecure ? "Secure;" : "",
                        cookieSameSite));
        log.debug("Add cookie to response");

    }

    public Optional<String> getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setDomain(cookieDomain);
        cookie.setMaxAge(0); // Delete immediately

        response.addCookie(cookie);
        log.debug("Delete cookie from response");
    }
}
