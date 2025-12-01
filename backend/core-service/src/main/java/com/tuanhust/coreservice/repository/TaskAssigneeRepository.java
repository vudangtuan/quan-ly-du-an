package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.Project;
import com.tuanhust.coreservice.entity.TaskAssignee;
import com.tuanhust.coreservice.entity.ids.TaskAssigneeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, TaskAssigneeId> {

    void deleteAllByAssigneeIdAndTaskProjectId(String assigneeId, String projectId);
}
