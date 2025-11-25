package com.tuanhust.coreservice.dto;


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

    private Map<String, ?> metadata;

    private String targetId;

    private String targetName;
}