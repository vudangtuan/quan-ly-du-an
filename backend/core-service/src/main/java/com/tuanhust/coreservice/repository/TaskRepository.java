package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.Task;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, String> {

    @Query(value = """
            select max(t.sortOrder) from Task t where t.boardColumnId=:boardColumnId and
                        t.projectId=:projectId
            """)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Double> getMaxSortOrder(String projectId, String boardColumnId);

    List<Task> findAllByProjectId(String projectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Task> findTaskByProjectIdAndTaskId(String projectId, String taskId);

    @Query(value = """
            select * from tasks where project_id=:projectId and task_id=:taskId and status='ARCHIVED' for no key update
            """, nativeQuery = true)
    Optional<Task> findArchiveTaskByProjectIdAndTaskId(String projectId, String taskId);

    @Modifying
    @Query(value = """
            delete from tasks where project_id=:projectId and task_id=:taskId
            """,nativeQuery = true)
    void deleteTask(String projectId, String taskId);
}