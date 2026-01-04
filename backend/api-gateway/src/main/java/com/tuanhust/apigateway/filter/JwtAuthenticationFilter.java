package com.tuanhust.apigateway.filter;

import com.tuanhust.apigateway.jwt.JwtVerifier;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthenticationFilter extends
        AbstractGatewayFilterFactory<JwtAuthenticationFilter.NameConfig> {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String SESSION_PREFIX = "session:";

    private final JwtVerifier jwtVerifier;
    private final ReactiveRedisTemplate<String, Object> redisTemplate;

    @Autowired
    public JwtAuthenticationFilter(JwtVerifier jwtVerifier,
                                   ReactiveRedisTemplate<String, Object> redisTemplate) {
        super(NameConfig.class);
        this.jwtVerifier = jwtVerifier;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public GatewayFilter apply(NameConfig config) {
        return ((exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "Missing authorization header");
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                return onError(exchange, "Invalid authorization header");
            }

            String token = authHeader.substring(BEARER_PREFIX.length());

            try {
                Claims claims = jwtVerifier.verify(token);
                String sessionId = claims.get("sessionId", String.class);
                String userId = claims.get("userId", String.class);
                String fullName = claims.get("fullName", String.class);
                String email = claims.getSubject();
                String role = claims.get("role", String.class);

                return redisTemplate.hasKey(SESSION_PREFIX + sessionId).flatMap(
                        (exists -> {
                            if (!exists) {
                                return onError(exchange, "Session expired or invalid");
                            }
                            String encodedName = fullName != null
                                    ? URLEncoder.encode(fullName, StandardCharsets.UTF_8)
                                    : "";
                            ServerHttpRequest modifiedRequest = request.mutate()
                                    .header("X-User-Id", userId)
                                    .header("X-User-Email", email)
                                    .header("X-User-Role", role)
                                    .header("X-Full-Name", encodedName)
                                    .header("X-Session-Id", sessionId)
                                    .build();

                            ServerWebExchange modifiedExchange = exchange.mutate()
                                    .request(modifiedRequest)
                                    .build();

                            return chain.filter(modifiedExchange);
                        })
                );
            } catch (Exception e) {
                return onError(exchange, "Invalid JWT token: " + e.getMessage());
            }
        });
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");

        String errorResponse = String.format("{\"error\": \"%s\"}", err);
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(errorResponse.getBytes()))
        );
    }
}
