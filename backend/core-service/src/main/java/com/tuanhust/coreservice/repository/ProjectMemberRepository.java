package com.tuanhust.coreservice.repository;

import com.tuanhust.coreservice.entity.ProjectMember;
import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.entity.ids.ProjectMemberID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;


public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberID> {

    @Query(value = """
    select pm.role from ProjectMember pm where pm.projectId=:projectId and pm.memberId=:memberId
    """)
    Optional<Role> getRole(String projectId, String memberId);

    int countByProjectId(String projectId);

    long countByProjectIdAndMemberIdIn(String projectId, List<String> userIds);

    List<ProjectMember> findByMemberIdInAndProjectId(List<String> assigneeIds, String projectId);
}