package com.tuanhust.activityservice.dto;


import com.tuanhust.activityservice.entity.enums.ActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ActivityEvent implements Serializable {
    private String projectId;
    private String taskId;
    private String actorId;
    private String actorName;
    private String actorEmail;
    private ActionType actionType;
    private String description;
    private Map<String, Object> metadata;
    private String targetId;
    private String targetName;
}