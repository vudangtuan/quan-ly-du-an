package com.tuanhust.coreservice.entity.ids;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskLabelId implements Serializable {
    private String task;
    private String label;
}