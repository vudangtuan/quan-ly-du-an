package com.tuanhust.aiservice.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class FeignConfig {
    @Value("${internal.secret-key}")
    private String internalToken;

    @Bean
    public RequestInterceptor smartTokenInterceptor() {
        return requestTemplate -> {
            if (internalToken != null && !internalToken.isEmpty()) {
                requestTemplate.header("X-Internal-Secret", internalToken);
            }
        };
    }
    @Bean
    public RequestInterceptor aiToCoreHeaderInterceptor() {
        return template -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                template.header("X-User-Id", principal.getUserId());
                template.header("X-User-Email", principal.getEmail());
                template.header("X-User-Role", principal.getRoles().iterator().next());
                String encodedName = URLEncoder.encode(principal.getFullName(), StandardCharsets.UTF_8);
                template.header("X-Full-Name", encodedName);
            }
        };
    }
}