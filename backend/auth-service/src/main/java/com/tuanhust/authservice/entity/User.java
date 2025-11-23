package com.tuanhust.authservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
@Table(name = "users",
        indexes = {
                @Index(name = "idx_fullName", columnList = "fullName"),
                @Index(name = "idx_email", columnList = "email"),
                @Index(name = "idx_oauth_provider_id", columnList = "oauth_provider,oauth_provider_id")
        })
@SQLRestriction("status NOT IN ('DELETED', 'SUSPENDED')")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String userId;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;

    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider oauthProvider;

    @Column(unique = true, nullable = false)
    private String oauthProviderId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;


    public enum OAuthProvider {
        GOOGLE,FACEBOOK, GITHUB
    }

    public enum UserStatus {
        ACTIVE, SUSPENDED, DELETED
    }

    public enum Role {
        USER, ADMIN
    }
}