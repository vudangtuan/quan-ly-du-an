package com.tuanhust.coreservice.listener;

import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.entity.Project;

import java.util.Map;


public record ProjectEvent(Project project,
                           UserPrincipal actor,
                           UserPrincipal recipient,
                           ActionType actionType,
                           String description,
                           String targetId,
                           String targetName,
                           Map<String, Object> metadata) {
    public ProjectEvent(Project project, UserPrincipal actor,
                        ActionType actionType, String description,
                        String targetId, String targetName, Map<String, Object> metadata) {
        this(project, actor, null, actionType, description,
                targetId, targetName, metadata);
    }
}
