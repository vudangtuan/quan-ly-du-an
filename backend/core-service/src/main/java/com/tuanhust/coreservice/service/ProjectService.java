package com.tuanhust.coreservice.service;

import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.request.BoardColumnRequest;
import com.tuanhust.coreservice.request.InviteMemberRequest;
import com.tuanhust.coreservice.request.LabelRequest;
import com.tuanhust.coreservice.request.ProjectRequest;
import com.tuanhust.coreservice.response.*;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


public interface ProjectService {
    ProjectResponse createProject(ProjectRequest projectRequest);

    PaginatedResponse<ProjectResponse> getProjectsForUserId(Pageable pageable);

    void sendInvitation(InviteMemberRequest request);

    ProjectMemberResponse acceptInvitation(String token);

    void deleteMember(String memberId, String projectId);

    ProjectDetailResponse getProject(String id);

    Role getCurrentRoleInProject(String id);

    void updateMemberRole(String projectId, String userId, Role role);

    void updateProject(String projectId, ProjectRequest request);

    void archiveProject(String projectId);

    void unarchiveProject(String projectId);

    void deleteProject(String projectId);

    LabelResponse createLabel(String projectId, LabelRequest request);

    LabelResponse updateLabel(String projectId, String labelId, LabelRequest request);

    void deleteLabel(String projectId, String labelId);

    BoardColumnResponse createBoardColumn(String projectId, BoardColumnRequest request);

    BoardColumnResponse updateBoardColumn(String projectId, String columnId, String name, Double sortOrder);

    void deleteBoardColumn(String projectId, String columnId);

    BoardColumnResponse archiveBoardColumn(String projectId, String columnId);

    BoardColumnResponse restoreBoardColumn(String projectId, String columnId,Double sortOrder);

    PaginatedResponse<ArchivedItemResponse> getArchivedItem(String projectId,Pageable pageable);

    List<ArchivedItemResponse> getMyArchivedProjects();
}