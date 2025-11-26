package com.tuanhust.coreservice.service.impl;

import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.dto.ActivityEvent;
import com.tuanhust.coreservice.entity.BoardColumn;
import com.tuanhust.coreservice.entity.Label;
import com.tuanhust.coreservice.entity.Project;
import com.tuanhust.coreservice.entity.ProjectMember;
import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.entity.enums.Status;
import com.tuanhust.coreservice.entity.ids.ProjectMemberID;
import com.tuanhust.coreservice.publisher.ActivityPublisher;
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
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    private final ActivityPublisher activityPublisher;


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
                .peek(bc -> bc.setStatus(Status.ACTIVE))
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

        publishProjectActivity(savedProject.getProjectId(), ActionType.CREATE_PROJECT,
                "Đã tạo dự án", savedProject.getProjectId(),
                savedProject.getName(), null);


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
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void updateProject(String projectId, ProjectRequest request) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );

        List<Map<String, Object>> changes = new ArrayList<>();


        if (!Objects.equals(project.getName(), request.getName()) &&
                request.getName() != null && !request.getName().trim().isEmpty()) {
            changes.add(createChangeLog("Tên dự án", project.getName(), request.getName()));

            project.setName(request.getName());
        }
        if (!Objects.equals(project.getDescription(), request.getDescription())) {
            changes.add(createChangeLog("Mô tả", project.getDescription(), request.getDescription()));
            project.setDescription(request.getDescription());
        }

        if (!Objects.equals(project.getDueAt(), request.getDueAt())) {
            changes.add(createChangeLog("Hạn chót", project.getDueAt(), request.getDueAt()));

            project.setDueAt(request.getDueAt());
        }

        if (!changes.isEmpty()) {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("changes", changes);
            String description = "đã cập nhật thông tin dự án";
            publishProjectActivity(projectId, ActionType.UPDATE_PROJECT, description,
                    projectId, project.getName(), metadata);
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void archiveProject(String projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        project.setStatus(Status.ARCHIVED);

        publishProjectActivity(projectId, ActionType.ARCHIVE_PROJECT, "Đã lưu trữ dự án",
                projectId, project.getName(), null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void unarchiveProject(String projectId) {
        Project project = projectRepository.findArchivedById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Dự án không tồn tại or chưa được lưu trữ")
        );
        project.setStatus(Status.ACTIVE);

        publishProjectActivity(projectId, ActionType.RESTORE_PROJECT, "Đã khôi phục dự án",
                projectId, project.getName(), null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void deleteProject(String projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        projectRepository.delete(project);
        publishProjectActivity(projectId, ActionType.DELETE_PROJECT, "Đã xóa dự án",
                projectId, project.getName(), null);
    }


    @Transactional(readOnly = true)
    @Cacheable(value = "projectDetail", key = "#id")
    public ProjectDetailResponse getProject(String id) {
        Project project = projectRepository.findDetailById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
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
                .dueAt(project.getDueAt())
                .status(project.getStatus())
                .labels(labes)
                .boardColumns(boardColumns)
                .members(members)
                .build();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "roleICurrentProject", key = "#id+':'+" +
            "#root.target.getCurrentUser().userId")
    @Override
    public Role getCurrentRoleInProject(String id) {
        return projectMemberRepository.getRole(id, getCurrentUser().getUserId())
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Bạn không có trong dự án or đã bị xóa")
                );
    }


    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projectDetail", key = "#projectId"),
            @CacheEvict(value = "roleICurrentProject", key = "#projectId+':'+" +
                    "#userId")
    })
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
            UserPrincipal userPrincipal = authClient.getUsers(List.of(projectMember.getMemberId()))
                    .stream().findFirst().orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy user")
                    );
            List<Map<String, Object>> changes = new ArrayList<>();
            changes.add(createChangeLog("Vai trò", projectMember.getRole(), role));
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("changes", changes);

            projectMember.setRole(role);

            publishProjectActivity(projectId, ActionType.UPDATE_ROLE,
                    "Đã cập nhập vai trò",
                    projectMember.getMemberId(), userPrincipal.getFullName(), metadata);
        }
    }


    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#inviteMemberRequest.projectId")
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

            publishProjectActivity(project.getProjectId(), ActionType.ADD_MEMBER,
                    "Đã thêm thành viên",
                    project.getProjectId(), userPrincipal.getFullName(), null);

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
    @Caching(evict = {
            @CacheEvict(value = {"projectDetail"}, key = "#projectId"),
            @CacheEvict(value = "roleICurrentProject", key = "#projectId+':'+" +
                    "#memberId")
    })
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

        UserPrincipal userPrincipal = authClient.getUsers(List.of(memberId))
                .stream().findFirst().orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy user")
                );

        publishProjectActivity(projectId, ActionType.DELETE_MEMBER,
                "Đã xóa thành viên",
                memberId, userPrincipal.getFullName(), null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
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

        publishProjectActivity(projectId, ActionType.ADD_LABEL, "Đã tạo nhãn",
                saved.getLabelId(), saved.getName(), null);
        return LabelResponse.builder()
                .labelId(saved.getLabelId())
                .name(saved.getName())
                .color(saved.getColor())
                .projectId(projectId)
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public LabelResponse updateLabel(String projectId, String labelId,
                                     LabelRequest request) {
        Label label = labelRepository.findByProjectIdAndLabelId(projectId, labelId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Nhãn không tồn tại trong dự án or đã bị xóa")
                );

        List<Map<String, Object>> changes = new ArrayList<>();

        if (!label.getName().equals(request.getName())) {
            changes.add(createChangeLog("Tên", label.getName(), request.getName()));
            label.setName(request.getName());
        }
        if (!label.getColor().equals(request.getColor())) {
            changes.add(createChangeLog("Color", label.getColor(), request.getColor()));
            label.setColor(request.getColor());
        }
        if (!changes.isEmpty()) {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("changes", changes);
            publishProjectActivity(projectId, ActionType.UPDATE_LABEL,
                    "Đã cập nhập nhãn", label.getLabelId(), label.getName(), metadata);
        }

        return LabelResponse.builder()
                .labelId(labelId)
                .name(label.getName())
                .color(label.getColor())
                .projectId(projectId)
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void deleteLabel(String projectId, String labelId) {
        Label label = labelRepository.findByProjectIdAndLabelId(projectId, labelId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Nhãn không tồn tại trong dự án or đã bị xóa")
                );
        labelRepository.delete(label);
        publishProjectActivity(projectId, ActionType.DELETE_LABEL, "Đã xóa",
                label.getLabelId(), label.getName(), null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
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
        publishProjectActivity(projectId, ActionType.ADD_BOARD_COLUMN, "Đã tạo cột",
                savedBoardColumn.getBoardColumnId(), savedBoardColumn.getName(), null);
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
    @CacheEvict(value = "projectDetail", key = "#projectId")
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
            List<Map<String, Object>> changes = new ArrayList<>();
            changes.add(createChangeLog("Tên", boardColumn.getName(), name));
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("changes", changes);

            publishProjectActivity(projectId, ActionType.UPDATE_BOARD_COLUMN,
                    "Đã cập nhập cột", boardColumn.getBoardColumnId(),
                    boardColumn.getName(), metadata);
            boardColumn.setName(name);
        }
        if (sortOrder != null && !sortOrder.isNaN()) {
            publishProjectActivity(projectId, ActionType.MOVE_BOARD_COLUMN, "Đã di chuyển cột",
                    boardColumn.getBoardColumnId(), boardColumn.getName(), null);
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
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void deleteBoardColumn(String projectId, String columnId) {
        BoardColumn boardColumn = boardColumnRepository.
                findByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        boardColumnRepository.delete(boardColumn);
        publishProjectActivity(projectId,ActionType.DELETE_BOARD_COLUMN,"Đã xóa cột",
                boardColumn.getBoardColumnId(), boardColumn.getName(), null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public BoardColumnResponse archiveBoardColumn(String projectId, String columnId) {
        BoardColumn boardColumn = boardColumnRepository.
                findByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        boardColumn.setStatus(Status.ARCHIVED);
        boardColumn.setSortOrder(null);
        publishProjectActivity(projectId,ActionType.ARCHIVE_BOARD_COLUMN,"Đã lưu trữ cột",
                boardColumn.getBoardColumnId(), boardColumn.getName(), null);
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
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public BoardColumnResponse restoreBoardColumn(String projectId, String columnId,
                                                  Double sortOrder) {
        BoardColumn boardColumn = boardColumnRepository.
                findArchivedByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        if (sortOrder == null || sortOrder.isNaN()) {
            boardColumn.setStatus(Status.ACTIVE);
            Double maxSortOrder = boardColumnRepository
                    .getMaxSortOrderFromProject(projectId).orElse(0.0);
            boardColumn.setSortOrder(Math.ceil(maxSortOrder) + 1);
        } else {
            boardColumn.setStatus(Status.ACTIVE);
            boardColumn.setSortOrder(sortOrder);
        }
        publishProjectActivity(projectId,ActionType.RESTORE_BOARD_COLUMN,"Đã khôi phục cột",
                boardColumn.getBoardColumnId(), boardColumn.getName(), null);
        return BoardColumnResponse.builder()
                .name(boardColumn.getName())
                .sortOrder(boardColumn.getSortOrder())
                .boardColumnId(boardColumn.getBoardColumnId())
                .projectId(projectId)
                .status(boardColumn.getStatus())
                .build();
    }


    public UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    private void publishProjectActivity(String projectId,
                                        ActionType actionType,
                                        String description,
                                        String targetId,
                                        String targetName,
                                        Map<String, Object> metadata) {
        UserPrincipal userCurrent = getCurrentUser();

        ActivityEvent event = ActivityEvent.builder()
                .projectId(projectId)
                .actorId(userCurrent.getUserId())
                .actorName(userCurrent.getFullName())
                .actorEmail(userCurrent.getEmail())
                .actionType(actionType)
                .description(description)
                .targetId(targetId)
                .targetName(targetName)
                .metadata(metadata)
                .build();

        activityPublisher.publish(event);
    }

    private Map<String, Object> createChangeLog(String field, Object oldValue, Object newValue) {
        Map<String, Object> map = new HashMap<>();
        map.put("field", field);
        map.put("old", oldValue);
        map.put("new", newValue);
        return map;
    }
}