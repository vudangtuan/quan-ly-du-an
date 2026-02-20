package com.tuanhust.activityservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
public class InternalFilter extends OncePerRequestFilter {
    @Value("${internal.secret-key}")
    private String internalSecretKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String providedSecret = request.getHeader("X-Internal-Secret");
        if (providedSecret == null || providedSecret.trim().isEmpty()) {
            sendJsonError(response,
                    "Missing internal authentication");
            return;
        }
        if (!internalSecretKey.equals(providedSecret)) {
            sendJsonError(response,
                    "Invalid internal authentication");
            return;
        }
        filterChain.doFilter(request, response);
    }
    private void sendJsonError(HttpServletResponse response, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", "Forbidden");
        errorMap.put("message", message);

        String jsonResponse = objectMapper.writeValueAsString(errorMap);
        response.getOutputStream().write(jsonResponse.getBytes(StandardCharsets.UTF_8));
        response.getOutputStream().flush();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getServletPath().startsWith("/internal/");
    }
}
