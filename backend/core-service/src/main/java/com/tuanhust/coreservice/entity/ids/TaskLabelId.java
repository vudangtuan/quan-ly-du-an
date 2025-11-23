package com.tuanhust.coreservice.entity.ids;

import lombok.Data;

import java.io.Serializable;

@Data
public class TaskLabelId implements Serializable {
    private String task;
    private String label;
}