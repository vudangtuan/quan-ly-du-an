package com.tuanhust.coreservice.filters;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TokenVerificationFilter extends OncePerRequestFilter {
    private final AuthServiceClient authServiceClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws IOException {
        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                sendJsonError(response,
                        "No token provided");
                return;
            }
            String token = authHeader.substring(7);
            UserPrincipal userPrincipal = authServiceClient.verifyToken(token);
            String role = userPrincipal.getRoles().stream().findFirst().orElseThrow(
                    () -> new RuntimeException("Role invalid")
            );
            List<SimpleGrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority(
                            "ROLE_" + role));
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userPrincipal,
                            null,
                            authorities
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            sendJsonError(response,
                    "Token invalid: " + e.getMessage());
        }
    }

    private void sendJsonError(HttpServletResponse response, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Tạo JSON response
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);

        String jsonResponse = objectMapper.writeValueAsString(errorMap);
        response.getOutputStream().write(jsonResponse.getBytes(StandardCharsets.UTF_8));
        response.getOutputStream().flush();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/internal/");
    }
}