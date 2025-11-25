package com.tuanhust.activityservice.entity;


import com.tuanhust.activityservice.entity.enums.ActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "activities")
public class Activity {
    @Id
    private String id;
    @Indexed
    private String projectId;
    @Indexed
    private String taskId;
    @Indexed
    private String actorId;

    private String actorName;
    private String actorEmail;

    private ActionType actionType;
    private String description;

    private String targetId;
    private String targetName;

    private Map<String, Object> metadata;

    @CreatedDate
    @Indexed(expireAfter = "7776000") //90 days
    private Instant createdAt;
}
