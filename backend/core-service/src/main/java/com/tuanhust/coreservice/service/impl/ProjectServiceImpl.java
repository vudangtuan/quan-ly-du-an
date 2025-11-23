package com.tuanhust.coreservice.service.impl;

import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.entity.BoardColumn;
import com.tuanhust.coreservice.entity.Label;
import com.tuanhust.coreservice.entity.Project;
import com.tuanhust.coreservice.entity.ProjectMember;
import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.entity.enums.Status;
import com.tuanhust.coreservice.entity.ids.ProjectMemberID;
import com.tuanhust.coreservice.repository.BoardColumnRepository;
import com.tuanhust.coreservice.repository.LabelRepository;
import com.tuanhust.coreservice.repository.ProjectMemberRepository;
import com.tuanhust.coreservice.repository.ProjectRepository;
import com.tuanhust.coreservice.request.BoardColumnRequest;
import com.tuanhust.coreservice.request.InviteMemberRequest;
import com.tuanhust.coreservice.request.LabelRequest;
import com.tuanhust.coreservice.request.ProjectRequest;
import com.tuanhust.coreservice.response.*;
import com.tuanhust.coreservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final LabelRepository labelRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final AuthServiceClient authClient;

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectRequest projectRequest) {
        UserPrincipal userCurrent = getCurrentUser();
        String currentUserId = userCurrent.getUserId();
        Project project = Project.builder()
                .name(projectRequest.getName())
                .description(projectRequest.getDescription())
                .dueAt(projectRequest.getDueAt())
                .creatorId(currentUserId)
                .status(Status.ACTIVE)
                .build();

        Set<BoardColumn> boardColumns = projectRequest.getBoardColumns()
                .stream().peek(bc -> bc.setProject(project))
                .peek(bc->bc.setStatus(Status.ACTIVE))
                .collect(Collectors.toSet());
        project.setBoardColumns(boardColumns);

        Set<Label> labels = projectRequest.getLabels()
                .stream().peek(l -> l.setProject(project))
                .collect(Collectors.toSet());
        project.setLabels(labels);

        Set<ProjectMember> members = projectRequest.getMembers()
                .stream().peek(pm -> pm.setProject(project))
                .collect(Collectors.toSet());
        members.add(ProjectMember.builder()
                .project(project)
                .role(Role.OWNER)
                .memberId(currentUserId)
                .build());
        project.setMembers(members);

        Project savedProject = projectRepository.save(project);

        return ProjectResponse.builder()
                .projectId(savedProject.getProjectId())
                .name(savedProject.getName())
                .description(savedProject.getDescription())
                .dueAt(savedProject.getDueAt())
                .currentRoleInProject(Role.OWNER)
                .members(1)
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProjectResponse> getProjectsForUserId(Pageable pageable, String userId) {
        try {
            String currentUserId = getCurrentUser().getUserId();
            Page<Project> projectPage = projectRepository.findAllByUserId(pageable, userId);
            List<Project> projects = projectPage.getContent();

            List<ProjectResponse> projectResponses = projects.stream().map(p -> {
                Role currentRole = projectMemberRepository.getRole(p.getProjectId(), currentUserId)
                        .orElseThrow();
                int members = projectMemberRepository.countByProjectId(p.getProjectId());
                return ProjectResponse.builder()
                        .projectId(p.getProjectId())
                        .name(p.getName())
                        .description(p.getDescription())
                        .dueAt(p.getDueAt())
                        .currentRoleInProject(currentRole)
                        .members(members)
                        .build();
            }).toList();

            return PaginatedResponse.<ProjectResponse>builder()
                    .size(projectPage.getSize())
                    .first(projectPage.isFirst())
                    .last(projectPage.isLast())
                    .totalPages(projectPage.getTotalPages())
                    .totalElements(projectPage.getTotalElements())
                    .number(projectPage.getNumber())
                    .content(projectResponses)
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    e.getMessage());
        }
    }

    @Override
    @Transactional
    public void updateProject(String projectId, ProjectRequest request) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setDueAt(request.getDueAt());
    }

    @Override
    @Transactional
    public void archiveProject(String projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        project.setStatus(Status.ARCHIVED);
    }

    @Override
    @Transactional
    public void unarchiveProject(String projectId) {
        Project project = projectRepository.findArchivedById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Dự án không tồn tại or chưa được lưu trữ")
        );
        project.setStatus(Status.ACTIVE);
    }

    @Override
    @Transactional
    public void deleteProject(String projectId) {
        int row = projectRepository.removeProject(projectId);
        if (row == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Dự án không tồn tại");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getProject(String id) {
        Project project = projectRepository.findDetailById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        Role currentRole = projectMemberRepository.getRole(id, getCurrentUser().getUserId())
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Bạn không có trong dự án or đã bị xóa")
                );
        List<LabelResponse> labes = project.getLabels().stream().map(
                        l -> LabelResponse.builder()
                                .labelId(l.getLabelId())
                                .projectId(l.getProjectId())
                                .color(l.getColor())
                                .name(l.getName())
                                .build())
                .toList();
        List<BoardColumnResponse> boardColumns = project.getBoardColumns().stream()
                .map(bc -> BoardColumnResponse.builder()
                        .boardColumnId(bc.getBoardColumnId())
                        .projectId(bc.getProjectId())
                        .sortOrder(bc.getSortOrder())
                        .status(bc.getStatus())
                        .name(bc.getName())
                        .projectId(bc.getProjectId())
                        .build()).toList();
        Set<ProjectMember> projectMembers = project.getMembers();
        Set<String> memberIds = projectMembers.stream().map(ProjectMember::getMemberId)
                .collect(Collectors.toSet());
        memberIds.add(project.getCreatorId());
        Map<String, UserPrincipal> mapUser;
        try {
            List<UserPrincipal> userPrincipals = authClient.getUsers(new ArrayList<>(memberIds));
            mapUser = userPrincipals.stream().collect(Collectors.toMap(
                    UserPrincipal::getUserId,
                    user -> user));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        List<ProjectMemberResponse> members = projectMembers.stream()
                .map(pm -> ProjectMemberResponse.builder()
                        .roleInProject(pm.getRole())
                        .joinAt(pm.getJoinedAt())
                        .email(mapUser.get(pm.getMemberId()).getEmail())
                        .userId(pm.getMemberId())
                        .fullName(mapUser.get(pm.getMemberId()).getFullName())
                        .projectId(pm.getProjectId())
                        .build()).toList();
        ProjectMemberResponse creator = members.stream()
                .filter(m -> m.getUserId().equals(project.getCreatorId()))
                .findFirst().orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dự án không chủ")
                );

        return ProjectDetailResponse.builder()
                .projectId(id)
                .name(project.getName())
                .description(project.getDescription())
                .creator(creator)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .currentRoleInProject(currentRole)
                .dueAt(project.getDueAt())
                .status(project.getStatus())
                .labels(labes)
                .boardColumns(boardColumns)
                .members(members)
                .build();
    }


    @Override
    @Transactional
    @CacheEvict(value = "projectRoles", key = "#projectId + '_' + #userId")
    public void updateMemberRole(String projectId, String userId, Role role) {
        ProjectMember projectMember = projectMemberRepository
                .findById(new ProjectMemberID(projectId, userId))
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Thành viên không có trong dự án or đã bị xóa")
                );
        if (projectMember.getRole().equals(Role.OWNER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Không thể thay đổi vai trò của quản lý");
        }
        if (!role.equals(projectMember.getRole())) {
            projectMember.setRole(role);
        }
    }


    @Override
    @Transactional
    @CacheEvict(value = "projectRoles", key = "#inviteMemberRequest.projectId + '_' + #inviteMemberRequest.memberId")
    public ProjectMemberResponse inviteMember(InviteMemberRequest inviteMemberRequest) {
        Role role = inviteMemberRequest.getRole();
        if (role == Role.EDITOR || role == Role.VIEWER || role == Role.COMMENTER) {
            Project project = projectRepository.findById(inviteMemberRequest.getProjectId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
            );
            ProjectMemberID id = new ProjectMemberID(
                    inviteMemberRequest.getProjectId(), inviteMemberRequest.getMemberId()
            );
            if (projectMemberRepository.existsById(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Thành viên này đã có trong dự án");
            }
            ProjectMember projectMember = ProjectMember.builder()
                    .memberId(inviteMemberRequest.getMemberId())
                    .project(project)
                    .role(inviteMemberRequest.getRole())
                    .build();
            ProjectMember saved = projectMemberRepository.save(projectMember);
            UserPrincipal userPrincipal = authClient.getUsers(List.of(saved.getMemberId()))
                    .stream().findFirst().orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy user")
                    );
            return ProjectMemberResponse.builder()
                    .userId(saved.getMemberId())
                    .email(userPrincipal.getEmail())
                    .fullName(userPrincipal.getFullName())
                    .projectId(inviteMemberRequest.getProjectId())
                    .joinAt(saved.getJoinedAt())
                    .roleInProject(saved.getRole())
                    .build();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role không đúng");
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectRoles", key = "#projectId + '_' + #memberId")
    public void deleteMember(String memberId, String projectId) {
        ProjectMember projectMember = projectMemberRepository
                .findById(new ProjectMemberID(projectId, memberId))
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Thành viên không có trong dự án or đã bị xóa")
                );
        if (projectMember.getRole().equals(Role.OWNER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể xóa quản lý");
        }
        projectMemberRepository.delete(projectMember);
    }

    @Override
    @Transactional
    public LabelResponse createLabel(String projectId, LabelRequest request) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        Label label = Label.builder()
                .name(request.getName())
                .color(request.getColor())
                .project(project)
                .build();
        Label saved = labelRepository.save(label);
        return LabelResponse.builder()
                .labelId(saved.getLabelId())
                .name(saved.getName())
                .color(saved.getColor())
                .projectId(projectId)
                .build();
    }

    @Override
    @Transactional
    public LabelResponse updateLabel(String projectId, String labelId,
                                     LabelRequest request) {
        Label label = labelRepository.findByProjectIdAndLabelId(projectId, labelId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Nhãn không tồn tại trong dự án or đã bị xóa")
                );
        label.setName(request.getName());
        label.setColor(request.getColor());
        return LabelResponse.builder()
                .labelId(labelId)
                .name(label.getName())
                .color(label.getColor())
                .projectId(projectId)
                .build();
    }

    @Override
    @Transactional
    public void deleteLabel(String projectId, String labelId) {
        try {
            labelRepository.deleteByProjectIdAndLabelId(projectId, labelId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @Override
    @Transactional
    public BoardColumnResponse createBoardColumn(String projectId, BoardColumnRequest request) {
        Project project = projectRepository.findByIdWithPessimisticWrite(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        Double maxSortOrder = boardColumnRepository
                .getMaxSortOrderFromProject(projectId).orElse(0.0);
        BoardColumn boardColumn = BoardColumn.builder()
                .name(request.getName())
                .sortOrder(Math.ceil(maxSortOrder) + 1)
                .project(project)
                .build();
        BoardColumn savedBoardColumn = boardColumnRepository.save(boardColumn);
        return BoardColumnResponse.builder()
                .name(savedBoardColumn.getName())
                .sortOrder(savedBoardColumn.getSortOrder())
                .boardColumnId(savedBoardColumn.getBoardColumnId())
                .projectId(projectId)
                .status(savedBoardColumn.getStatus())
                .build();
    }

    @Override
    @Transactional
    public BoardColumnResponse updateBoardColumn(String projectId,
                                                 String columnId,
                                                 String name,
                                                 Double sortOrder) {
        BoardColumn boardColumn = boardColumnRepository.
                findByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        if (name != null && !name.isBlank()) {
            boardColumn.setName(name);
        }
        if (sortOrder != null && !sortOrder.isNaN()) {
            boardColumn.setSortOrder(sortOrder);
        }
        return BoardColumnResponse.builder()
                .name(boardColumn.getName())
                .sortOrder(boardColumn.getSortOrder())
                .boardColumnId(boardColumn.getBoardColumnId())
                .projectId(projectId)
                .status(boardColumn.getStatus())
                .build();
    }

    @Override
    @Transactional
    public void deleteBoardColumn(String projectId, String columnId) {
        try {
            boardColumnRepository.deleteByProjectIdAndBoardColumnId(projectId, columnId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @Override
    @Transactional
    public BoardColumnResponse archiveBoardColumn(String projectId, String columnId) {
        BoardColumn boardColumn = boardColumnRepository.
                findByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        boardColumn.setStatus(Status.ARCHIVED);
        boardColumn.setSortOrder(null);
        return BoardColumnResponse.builder()
                .name(boardColumn.getName())
                .sortOrder(boardColumn.getSortOrder())
                .boardColumnId(boardColumn.getBoardColumnId())
                .projectId(projectId)
                .status(boardColumn.getStatus())
                .build();
    }

    @Override
    @Transactional
    public BoardColumnResponse restoreBoardColumn(String projectId, String columnId,
                                                  Double sortOrder) {
        BoardColumn boardColumn = boardColumnRepository.
                findArchivedByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        if(sortOrder==null||sortOrder.isNaN()) {
            boardColumn.setStatus(Status.ACTIVE);
            Double maxSortOrder = boardColumnRepository
                    .getMaxSortOrderFromProject(projectId).orElse(0.0);
            boardColumn.setSortOrder(Math.ceil(maxSortOrder) + 1);
        }else {
            boardColumn.setStatus(Status.ACTIVE);
            boardColumn.setSortOrder(sortOrder);
        }
        return BoardColumnResponse.builder()
                .name(boardColumn.getName())
                .sortOrder(boardColumn.getSortOrder())
                .boardColumnId(boardColumn.getBoardColumnId())
                .projectId(projectId)
                .status(boardColumn.getStatus())
                .build();
    }


    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}