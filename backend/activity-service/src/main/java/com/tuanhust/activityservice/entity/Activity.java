package com.tuanhust.activityservice.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "activities")
@CompoundIndexes({
        @CompoundIndex(name = "idx_project_created_desc", def = "{'projectId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_task_created_desc", def = "{'taskId': 1, 'createdAt': -1}")
})
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

    private String actionType;
    private String description;

    private String targetId;
    private String targetName;

    private Map<String, Object> metadata;

    @Indexed(expireAfter = "90d")
    private Instant createdAt;
}
