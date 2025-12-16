package com.tuanhust.notificationservice.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "notifications")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;
    @Indexed
    private String recipientId;
    private String subject;
    private String content;
    private Boolean isRead;
    private Map<String, Object> properties;
    @CreatedDate
    @Indexed(expireAfter = "90d")
    private Instant createdAt;
}
