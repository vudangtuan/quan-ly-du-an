package com.tuanhust.coreservice.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import com.tuanhust.coreservice.entity.Project;

import java.util.Optional;


public interface ProjectRepository extends JpaRepository<Project, String> {
    @Query(value = """
             select p from Project p left join ProjectMember m
             on p.projectId=m.projectId where m.memberId=:userId
            """)
    Page<Project> findAllByUserId(Pageable pageable, String userId);

    @Query(value = """
            select * from projects where project_id=:projectId and status='ARCHIVED'
            """, nativeQuery = true)
    Optional<Project> findArchivedById(String projectId);

    @Modifying
    @Query(value = """
            delete from projects where project_id=:projectId
            """, nativeQuery = true)
    int removeProject(String projectId);

    @EntityGraph(attributePaths = {"members", "labels", "boardColumns"})
    @Query(value = "select p from Project p where p.projectId=:id")
    Optional<Project> findDetailById(String id);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Project p WHERE p.projectId = :projectId")
    Optional<Project> findByIdWithPessimisticWrite(String projectId);
}