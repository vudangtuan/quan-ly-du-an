package com.tuanhust.coreservice.listener;

import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.entity.Task;


import java.util.Map;

public record TaskEvent(Task task,
                        String projectId,
                        UserPrincipal actor,
                        ActionType actionType,
                        String description,
                        String targetId,
                        String targetName,
                        Map<String, Object> metadata,
                        Map<String, Object> notifyProps) {
    public TaskEvent(Task task, String projectId, UserPrincipal actor,
                     ActionType actionType, String description,
                     String targetId, String targetName, Map<String, Object> metadata) {
        this(task, projectId, actor,
                actionType, description, targetId, targetName, metadata, null);
    }
}
