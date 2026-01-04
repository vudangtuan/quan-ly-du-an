package com.tuanhust.authservice.config;

import com.tuanhust.authservice.entity.User;
import com.tuanhust.authservice.provider.JwtTokenProvider;
import com.tuanhust.authservice.repository.UserRepository;
import com.tuanhust.authservice.service.SessionService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final SessionService sessionService;
    private final UserRepository userRepository;
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try{
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }
            String token = authHeader.substring(7);
            if (!jwtTokenProvider.validateToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }
            Claims claims = jwtTokenProvider.getClaims(token);
            String sessionId = claims.get("sessionId", String.class);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);

            if (!sessionService.validateSession(sessionId)) {
                log.debug("Session is invalid or expired: {}", sessionId);
                return;
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if(user == null){
                log.debug("User not found: {}", email);
                return;
            }

            List<SimpleGrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority("ROLE_" + role));
            UserPrincipal userPrincipal = UserPrincipal.builder()
                    .userId(user.getUserId())
                    .email(email)
                    .fullName(user.getFullName())
                    .sessionId(sessionId)
                    .roles(Set.of(user.getRole().toString()))
                    .authorities(authorities)
                    .build();
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userPrincipal,
                    null,
                     authorities);

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        catch (Exception e){
            log.error("Cannot set user authentication: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/auth/login") ||
                path.startsWith("/internal/") ||
                path.startsWith("/auth/refresh")||
                path.startsWith("/auth/google");
    }
}
