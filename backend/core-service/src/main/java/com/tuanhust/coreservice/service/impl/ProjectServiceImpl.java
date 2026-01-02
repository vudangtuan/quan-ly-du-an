package com.tuanhust.coreservice.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.dto.InvitationData;
import com.tuanhust.coreservice.entity.BoardColumn;
import com.tuanhust.coreservice.entity.Label;
import com.tuanhust.coreservice.entity.Project;
import com.tuanhust.coreservice.entity.ProjectMember;
import com.tuanhust.coreservice.entity.enums.Role;
import com.tuanhust.coreservice.entity.enums.Status;
import com.tuanhust.coreservice.entity.ids.ProjectMemberID;
import com.tuanhust.coreservice.listener.ProjectEvent;
import com.tuanhust.coreservice.repository.*;
import com.tuanhust.coreservice.request.BoardColumnRequest;
import com.tuanhust.coreservice.request.InviteMemberRequest;
import com.tuanhust.coreservice.request.LabelRequest;
import com.tuanhust.coreservice.request.ProjectRequest;
import com.tuanhust.coreservice.response.*;
import com.tuanhust.coreservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final LabelRepository labelRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final AuthServiceClient authClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url}")
    private String frontendUrl;


    @Override
    @Transactional
    public ProjectResponse createProject(ProjectRequest projectRequest) {
        UserPrincipal userCurrent = getCurrentUser();
        String currentUserId = userCurrent.getUserId();
        Project project = Project.builder()
                .name(projectRequest.getName())
                .description(projectRequest.getDescription())
                .dueAt(normalizeToEndOfDay(projectRequest.getDueAt()))
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

        Set<ProjectMember> members = new HashSet<>();
        members.add(ProjectMember.builder()
                .project(project)
                .role(Role.OWNER)
                .email(userCurrent.getEmail())
                .memberId(currentUserId)
                .build());
        project.setMembers(members);

        Project savedProject = projectRepository.save(project);

        eventPublisher.publishEvent(new ProjectEvent(
                savedProject, userCurrent, ActionType.CREATE_PROJECT, "đã tạo dự án",
                savedProject.getProjectId(), savedProject.getName(), Map.of()
        ));


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
    public PaginatedResponse<ProjectResponse> getProjectsForUserId(Pageable pageable) {
        try {
            String currentUserId = getCurrentUser().getUserId();
            Page<Project> projectPage = projectRepository.findAllByUserId(pageable, currentUserId);
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

        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        if (!Objects.equals(project.getName(), request.getName()) &&
                request.getName() != null && !request.getName().trim().isEmpty()) {
            oldData.put("name", project.getName());
            project.setName(request.getName());
            newData.put("name", project.getName());
        }
        if (!Objects.equals(project.getDescription(), request.getDescription())) {
            oldData.put("description", project.getDescription());
            project.setDescription(request.getDescription());
            newData.put("description", project.getDescription());
        }

        if (!Objects.equals(project.getDueAt(), request.getDueAt())) {
            oldData.put("dueAt", project.getDueAt() != null ? project.getUpdatedAt().toString() : null);
            project.setDueAt(normalizeToEndOfDay(request.getDueAt()));
            newData.put("dueAt", project.getDueAt() != null ? project.getUpdatedAt().toString() : null);
        }

        if (!newData.isEmpty()) {
            Map<String, Object> data = new HashMap<>();
            data.put("old", oldData);
            data.put("new", newData);
            String description = "đã cập nhật thông tin dự án";
            eventPublisher.publishEvent(new ProjectEvent(
                    project, getCurrentUser(), ActionType.UPDATE_PROJECT,
                    description, projectId, project.getName(), data
            ));
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void archiveProject(String projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại")
        );
        Map<String, Object> old = new HashMap<>();
        old.put("status", project.getStatus().name());

        project.setStatus(Status.ARCHIVED);
        project.setArchivedAt(Instant.now());

        Map<String, Object> data = new HashMap<>();
        data.put("old", old);
        data.put("new", Map.of("status", Status.ARCHIVED.name(),
                "archivedAt", project.getArchivedAt().toString()));


        eventPublisher.publishEvent(new ProjectEvent(
                project, getCurrentUser(), ActionType.ARCHIVE_PROJECT,
                "đã lưu trữ dự án", projectId, project.getName(),
                data
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#projectId")
    public void unarchiveProject(String projectId) {
        Project project = projectRepository.findArchivedById(projectId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Dự án không tồn tại or chưa được lưu trữ")
        );
        Map<String, Object> old = new HashMap<>();
        old.put("status", project.getStatus().name());
        old.put("archivedAt", project.getArchivedAt().toString());

        project.setStatus(Status.ACTIVE);
        project.setArchivedAt(null);

        Map<String, Object> data = new HashMap<>();

        data.put("old", old);
        data.put("new", Map.of("status", Status.ACTIVE.name(),
                "archivedAt", ""));


        eventPublisher.publishEvent(new ProjectEvent(
                project, getCurrentUser(), ActionType.RESTORE_PROJECT,
                "đã khôi phục dự án", projectId, project.getName(), data
        ));
    }

    @Override
    @Transactional
    @Caching(
            evict = {
                    @CacheEvict(value = "projectDetail", key = "#projectId"),
                    @CacheEvict(value = "roleInCurrentProject", key = "#projectId+':'+" +
                            "#root.target.getCurrentUser().userId")
            }
    )
    public void deleteProject(String projectId) {
        projectRepository.removeProject(projectId);
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
                        .email(pm.getEmail())
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
    @Cacheable(value = "roleInCurrentProject", key = "#id+':'+" +
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
            @CacheEvict(value = "roleInCurrentProject", key = "#projectId+':'+" +
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

            Map<String, Object> data = new HashMap<>();
            data.put("old", Map.of("role", projectMember.getRole()));
            projectMember.setRole(role);
            data.put("new", Map.of("role", projectMember.getRole()));

            eventPublisher.publishEvent(new ProjectEvent(
                    projectMember.getProject(),
                    getCurrentUser(),
                    ActionType.UPDATE_ROLE,
                    "Đã cập nhập vai trò",
                    projectMember.getMemberId(),
                    userPrincipal.getFullName(),
                    data
            ));
        }
    }


    @Override
    public void sendInvitation(InviteMemberRequest request) {
        Role role = request.getRole();
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Dự án không tồn tại"));

        if (projectMemberRepository.existsById(new ProjectMemberID(request.getProjectId(), request.getMemberId()))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Thành viên này đã có trong dự án");
        }
        String pendingKey = "invitation_pending:" + request.getProjectId() + ":" + request.getMemberId();
        if (redisTemplate.hasKey(pendingKey)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Đã gửi lời mời cho thành viên này rồi.");
        }
        if (role == Role.EDITOR || role == Role.VIEWER || role == Role.COMMENTER) {
            UserPrincipal currentUser = getCurrentUser();
            UserPrincipal recipientUser = authClient.getUsers(List.of(request.getMemberId()))
                    .stream().findFirst().orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "User không tồn tại"));
            String token = UUID.randomUUID().toString();
            InvitationData invitation = InvitationData.builder()
                    .projectId(request.getProjectId())
                    .memberId(request.getMemberId())
                    .emailMember(recipientUser.getEmail())
                    .memberName(recipientUser.getFullName())
                    .role(request.getRole())
                    .inviterId(currentUser.getUserId())
                    .inviterName(currentUser.getFullName())
                    .build();
            String redisKey = "invitation:" + token;

            String inviteLink = frontendUrl + "/accept-invite?token=" + token;

            Map<String, Object> props = new HashMap<>();
            props.put("role", request.getRole().toString());
            props.put("link", inviteLink);

            eventPublisher.publishEvent(new ProjectEvent(
                    project, currentUser, recipientUser, ActionType.INVITE_MEMBER,
                    "", "", "", props
            ));


            redisTemplate.opsForValue().set(redisKey, invitation, 7, TimeUnit.DAYS);
            redisTemplate.opsForValue().set(pendingKey, token, 7, TimeUnit.DAYS);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role không đúng");
        }

    }

    @Override
    @Transactional
    @CacheEvict(value = "projectDetail", key = "#result.projectId")
    public ProjectMemberResponse acceptInvitation(String token) {
        String tokenKey = "invitation:" + token;

        InvitationData invitation = (InvitationData) redisTemplate.opsForValue().get(tokenKey);
        if (invitation == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Lời mời không hợp lệ hoặc đã hết hạn");
        }
        if (!Objects.equals(invitation.getMemberId(), getCurrentUser().getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Link mời này không dành cho tài khoản của bạn." +
                            "   Vui lòng đăng nhập đúng tài khoản được mời.");
        }
        String pendingKey = "invitation_pending:" + invitation.getProjectId() + ":" + invitation.getMemberId();
        Project project = projectRepository.findById(invitation.getProjectId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Dự án không tồn tại"));


        ProjectMember projectMember = ProjectMember.builder()
                .memberId(invitation.getMemberId())
                .project(project)
                .email(invitation.getEmailMember())
                .role(invitation.getRole())
                .build();
        ProjectMember saved = projectMemberRepository.save(projectMember);

        eventPublisher.publishEvent(new ProjectEvent(
                project,
                getCurrentUser(),
                ActionType.ADD_MEMBER,
                "Đã tham gia dự án qua lời mời",
                project.getProjectId(),
                invitation.getInviterName(),
                Map.of("member", projectMember)
        ));

        redisTemplate.delete(tokenKey);
        redisTemplate.delete(pendingKey);

        return ProjectMemberResponse.builder()
                .projectId(project.getProjectId())
                .userId(saved.getMemberId())
                .email(saved.getEmail())
                .fullName(invitation.getMemberName())
                .roleInProject(saved.getRole())
                .build();
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "projectDetail", key = "#projectId"),
            @CacheEvict(value = "roleInCurrentProject", key = "#projectId+':'+" +
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
        taskAssigneeRepository.deleteAllByAssigneeIdAndTaskProjectId(memberId, projectId);

        UserPrincipal userPrincipal = authClient.getUsers(List.of(memberId))
                .stream().findFirst().orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy user")
                );


        eventPublisher.publishEvent(new ProjectEvent(
                projectMember.getProject(),
                getCurrentUser(),
                ActionType.DELETE_MEMBER,
                "Đã xóa thành viên",
                memberId,
                userPrincipal.getFullName(),
                Map.of("member", projectMember)
        ));
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

        eventPublisher.publishEvent(new ProjectEvent(
                saved.getProject(),
                getCurrentUser(),
                ActionType.ADD_LABEL,
                "Đã tạo nhãn",
                saved.getLabelId(),
                saved.getName(),
                Map.of("label", label)
        ));
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

        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        if (!label.getName().equals(request.getName())) {
            oldData.put("name", label.getName());
            label.setName(request.getName());
            newData.put("name", label.getName());
        }
        if (!label.getColor().equals(request.getColor())) {
            oldData.put("color", label.getColor());
            label.setColor(request.getColor());
            newData.put("color", label.getColor());
        }
        if (!newData.isEmpty()) {
            Map<String, Object> data = new HashMap<>();
            data.put("new", newData);
            data.put("old", oldData);
            eventPublisher.publishEvent(new ProjectEvent(
                    label.getProject(), getCurrentUser(),
                    ActionType.UPDATE_LABEL, "Đã cập nhập nhãn",
                    label.getLabelId(), label.getName(), data
            ));
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
        eventPublisher.publishEvent(new ProjectEvent(
                label.getProject(), getCurrentUser(),
                ActionType.DELETE_LABEL, "Đã xóa nhãn",
                label.getLabelId(), label.getName(), Map.of("label", label)
        ));
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
                .status(Status.ACTIVE)
                .project(project)
                .build();
        BoardColumn saved = boardColumnRepository.save(boardColumn);
        eventPublisher.publishEvent(new ProjectEvent(
                saved.getProject(), getCurrentUser(),
                ActionType.ADD_BOARD_COLUMN, "Đã tạo cột",
                saved.getBoardColumnId(), saved.getName(), Map.of("column", saved)
        ));
        return BoardColumnResponse.builder()
                .name(saved.getName())
                .sortOrder(saved.getSortOrder())
                .boardColumnId(saved.getBoardColumnId())
                .projectId(projectId)
                .status(saved.getStatus())
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
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        if (name != null && !name.isBlank() && !name.equals(boardColumn.getName())) {
            oldData.put("name", boardColumn.getName());
            boardColumn.setName(name);
            newData.put("name", boardColumn.getName());
            data.put("old", oldData);
            data.put("new", newData);
            eventPublisher.publishEvent(new ProjectEvent(
                    boardColumn.getProject(), getCurrentUser(),
                    ActionType.UPDATE_BOARD_COLUMN, "Đã cập nhập cột",
                    boardColumn.getBoardColumnId(), boardColumn.getName(), data
            ));
        } else if (sortOrder != null && !sortOrder.isNaN() && !sortOrder.equals(boardColumn.getSortOrder())) {
            oldData.put("sortOrder", sortOrder);
            boardColumn.setSortOrder(sortOrder);
            newData.put("sortOrder", boardColumn.getSortOrder());
            data.put("old", oldData);
            data.put("new", newData);
            eventPublisher.publishEvent(new ProjectEvent(
                    boardColumn.getProject(), getCurrentUser(),
                    ActionType.MOVE_BOARD_COLUMN, "Đã di chuyển cột",
                    boardColumn.getBoardColumnId(), boardColumn.getName(), data
            ));
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
        BoardColumn boardColumn = boardColumnRepository.
                findArchivedByProjectIdAndBoardColumnId(projectId, columnId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Cột không tồn tại")
                );
        boardColumnRepository.delete(boardColumn);
        eventPublisher.publishEvent(new ProjectEvent(
                boardColumn.getProject(), getCurrentUser(),
                ActionType.DELETE_BOARD_COLUMN, "Đã xóa cột",
                boardColumn.getBoardColumnId(), boardColumn.getName(),
                Map.of("column", boardColumn)
        ));
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
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        oldData.put("status", boardColumn.getStatus());
        oldData.put("archivedAt", boardColumn.getArchivedAt());
        oldData.put("sortOrder", boardColumn.getSortOrder());

        boardColumn.setStatus(Status.ARCHIVED);
        boardColumn.setArchivedAt(Instant.now());
        boardColumn.setSortOrder(null);

        newData.put("status", boardColumn.getStatus());
        newData.put("archivedAt", boardColumn.getArchivedAt());
        newData.put("sortOrder", boardColumn.getSortOrder());

        data.put("old", oldData);
        data.put("new", newData);

        eventPublisher.publishEvent(new ProjectEvent(
                boardColumn.getProject(), getCurrentUser(),
                ActionType.ARCHIVE_BOARD_COLUMN, "Đã lưu trữ cột",
                boardColumn.getBoardColumnId(), boardColumn.getName(), data
        ));
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
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        oldData.put("status", boardColumn.getStatus());
        oldData.put("archivedAt", boardColumn.getArchivedAt());
        oldData.put("sortOrder", boardColumn.getSortOrder());

        if (sortOrder == null || sortOrder.isNaN()) {
            Double maxSortOrder = boardColumnRepository
                    .getMaxSortOrderFromProject(projectId).orElse(0.0);
            boardColumn.setSortOrder(Math.ceil(maxSortOrder) + 1);
        } else {
            boardColumn.setSortOrder(sortOrder);
        }
        boardColumn.setStatus(Status.ACTIVE);
        boardColumn.setArchivedAt(null);

        newData.put("status", boardColumn.getStatus());
        newData.put("archivedAt", boardColumn.getArchivedAt());
        newData.put("sortOrder", boardColumn.getSortOrder());

        data.put("old", oldData);
        data.put("new", newData);

        eventPublisher.publishEvent(new ProjectEvent(
                boardColumn.getProject(), getCurrentUser(),
                ActionType.RESTORE_BOARD_COLUMN, "Đã khôi phục cột",
                boardColumn.getBoardColumnId(), boardColumn.getName(), data
        ));

        return BoardColumnResponse.builder()
                .name(boardColumn.getName())
                .sortOrder(boardColumn.getSortOrder())
                .boardColumnId(boardColumn.getBoardColumnId())
                .projectId(projectId)
                .status(boardColumn.getStatus())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ArchivedItemResponse> getArchivedItem(String projectId, Pageable pageable) {
        Page<ArchivedItemResponse> page = projectRepository.findArchivedByProjectId(projectId, pageable);
        return PaginatedResponse.<ArchivedItemResponse>builder()
                .content(page.getContent())
                .first(page.isFirst())
                .last(page.isLast())
                .number(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArchivedItemResponse> getMyArchivedProjects() {
        String userId = getCurrentUser().getUserId();
        return projectRepository.findArchivedProjectsByOwnerId(userId);
    }


    public UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }


    private Instant normalizeToEndOfDay(Instant input) {
        if (input == null) return null;
        return input.atZone(ZoneId.systemDefault())
                .with(LocalTime.of(23, 59, 59))
                .toInstant();
    }
}