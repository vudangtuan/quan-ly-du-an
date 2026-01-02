package com.tuanhust.aiservice.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
}