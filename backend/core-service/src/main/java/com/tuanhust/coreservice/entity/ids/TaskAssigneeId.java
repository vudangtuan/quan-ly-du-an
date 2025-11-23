package com.tuanhust.coreservice.entity.ids;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskAssigneeId implements Serializable {
    private String assigneeId;
    private String task;
}