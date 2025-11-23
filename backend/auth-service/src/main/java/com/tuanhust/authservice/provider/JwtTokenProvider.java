package com.tuanhust.authservice.provider;

import com.tuanhust.authservice.entity.User;
import io.jsonwebtoken.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;


@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {
    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;


    public String generateAccessToken(User user,String sessionId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getUserId())
                .claim("sessionId", sessionId)
                .claim("role",user.getRole())
                .claim("fullName",user.getFullName())
                .claim("tokenId", UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiration)))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public String generateRefreshToken() {
        return java.util.UUID.randomUUID().toString();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("Token expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            log.debug("Unsupported token: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            log.debug("Invalid token: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.debug("Token is empty: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Token validation error: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token) {
        return  Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public String getSessionId(String token) {
        return getClaims(token).get("sessionId", String.class);
    }
    public String getUserId(String token) {
        return getClaims(token).get("userId", String.class);
    }
    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public Claims getClaimsFromExpiredToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("Extracting claims from expired token");
            return e.getClaims();
        } catch (Exception e) {
            log.error("Cannot extract claims from token: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid token", e);
        }
    }
}
