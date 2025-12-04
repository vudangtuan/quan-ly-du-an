package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.TaskLabel;
import com.tuanhust.coreservice.entity.ids.TaskLabelId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskLabelRepository extends JpaRepository<TaskLabel, TaskLabelId> {
}
