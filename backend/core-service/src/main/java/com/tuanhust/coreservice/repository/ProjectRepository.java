package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.response.ArchivedItemResponse;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import com.tuanhust.coreservice.entity.Project;

import java.util.List;
import java.util.Optional;


public interface ProjectRepository extends JpaRepository<Project, String> {
    @Query(value = """
             select p from Project p left join ProjectMember m
             on p.projectId=m.projectId where m.memberId=:userId order by p.createdAt desc
            """)
    Page<Project> findAllByUserId(Pageable pageable, String userId);

    @Query(value = """
            select * from projects where project_id=:projectId and status='ARCHIVED'
            """, nativeQuery = true)
    Optional<Project> findArchivedById(String projectId);




    @Query(value = """
            delete from projects where project_id=:projectId
                        RETURNING *
            """, nativeQuery = true)
    Optional<Project> removeProject(String projectId);

    @EntityGraph(attributePaths = {"members", "labels", "boardColumns"})
    @Query(value = "select p from Project p where p.projectId=:id")
    Optional<Project> findDetailById(String id);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Project p WHERE p.projectId = :projectId")
    Optional<Project> findByIdWithPessimisticWrite(String projectId);

    @Query(value = """
            select * from (
                        select t.task_id as itemId,t.title as name,'TASK' as type,t.archived_at as archivedAt
                                    from tasks t join board_columns bc using (board_column_id) 
                                                where t.project_id=:projectId and t.status='ARCHIVED' and bc.status='ACTIVE'
                        union all 
                        select bc.board_column_id as itemId,bc.name as name,'COLUMN' as type,bc.archived_at as archivedAt
                                    from board_columns bc where bc.project_id=:projectId and bc.status='ARCHIVED'
            ) as combined_data
                                 order by archivedAt desc
            """,
            countQuery = """
                    SELECT count(*) FROM (
                            SELECT 1 FROM tasks t join board_columns bc using (board_column_id)
                                                         WHERE t.project_id = :projectId AND t.status = 'ARCHIVED' and bc.status='ACTIVE'
                            UNION ALL
                            SELECT 1 FROM board_columns WHERE project_id = :projectId AND status = 'ARCHIVED'
                        ) AS count_table
                    """,
            nativeQuery = true)
    Page<ArchivedItemResponse> findArchivedByProjectId(String projectId, Pageable pageable);

    @Query(value = """
            SELECT p.project_id as itemId,p.name as name,'PROJECT' as type,p.archived_at as archivedAt
                        FROM projects p 
            JOIN project_members pm using (project_id)
            WHERE pm.member_id = :userId 
            AND pm.role = 'OWNER' 
            AND p.status = 'ARCHIVED'
            ORDER BY p.updated_at DESC
            """, nativeQuery = true)
    List<ArchivedItemResponse> findArchivedProjectsByOwnerId(String userId);
}