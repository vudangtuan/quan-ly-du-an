package com.tuanhust.coreservice.service.impl;

import com.tuanhust.coreservice.client.AuthServiceClient;
import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.dto.ActionType;
import com.tuanhust.coreservice.entity.*;
import com.tuanhust.coreservice.entity.enums.Status;
import com.tuanhust.coreservice.entity.ids.TaskAssigneeId;
import com.tuanhust.coreservice.entity.ids.TaskLabelId;
import com.tuanhust.coreservice.listener.TaskEvent;
import com.tuanhust.coreservice.repository.*;
import com.tuanhust.coreservice.request.TaskRequest;
import com.tuanhust.coreservice.response.CheckListResponse;
import com.tuanhust.coreservice.response.CommentResponse;
import com.tuanhust.coreservice.response.TaskDetailResponse;
import com.tuanhust.coreservice.response.TaskResponse;
import com.tuanhust.coreservice.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class TaskServiceImpl implements TaskService {
    private final TaskRepository taskRepository;
    private final CheckListRepository checkListRepository;
    private final CommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final LabelRepository labelRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuthServiceClient authServiceClient;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final TaskLabelRepository taskLabelRepository;


    @Override
    @Transactional
    public TaskResponse createTask(String projectId, TaskRequest taskRequest) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại"));
        BoardColumn boardColumn = boardColumnRepository.findByProjectIdAndBoardColumnId(projectId, taskRequest.getBoardColumnId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cột không tồn tại hoặc không thuộc dự án này"));
        if (taskRequest.getAssigneeIds() != null && !taskRequest.getAssigneeIds().isEmpty()) {
            long count = projectMemberRepository.countByProjectIdAndMemberIdIn(projectId, taskRequest.getAssigneeIds());
            if (count != taskRequest.getAssigneeIds().size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một số thành viên không thuộc dự án này");
            }
        }
        if (taskRequest.getLabelIds() != null && !taskRequest.getLabelIds().isEmpty()) {
            long count = labelRepository.countByProjectIdAndLabelIdIn(projectId, taskRequest.getLabelIds());
            if (count != taskRequest.getLabelIds().size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một số nhãn không thuộc dự án này");
            }
        }
        UserPrincipal creator = getCurrentUser();
        Double maxSortOrder = taskRepository.getMaxSortOrder(projectId, taskRequest.getBoardColumnId())
                .orElse(0.0);
        Task task = Task.builder()
                .project(project)
                .boardColumn(boardColumn)
                .title(taskRequest.getTitle())
                .description(taskRequest.getDescription())
                .status(Status.ACTIVE)
                .completed(false)
                .dueAt(normalizeToEndOfDay(taskRequest.getDueAt()))
                .priority(taskRequest.getPriority())
                .creatorId(creator.getUserId())
                .sortOrder(Math.ceil(maxSortOrder) + 1)
                .build();

        if (taskRequest.getAssigneeIds() != null && !taskRequest.getAssigneeIds().isEmpty()) {
            Set<TaskAssignee> assignees = taskRequest.getAssigneeIds().stream()
                    .map(assigneeId -> TaskAssignee.builder()
                            .assigneeId(assigneeId)
                            .task(task)
                            .build())
                    .collect(Collectors.toSet());
            task.setAssignees(assignees);
        }
        if (taskRequest.getLabelIds() != null && !taskRequest.getLabelIds().isEmpty()) {
            Set<TaskLabel> labels = taskRequest.getLabelIds().stream()
                    .map(labelId -> {
                        Label labelRef = labelRepository.getReferenceById(labelId);
                        return TaskLabel.builder()
                                .label(labelRef)
                                .labelId(labelId)
                                .task(task)
                                .build();
                    })
                    .collect(Collectors.toSet());
            task.setTaskLabels(labels);
        }
        if (taskRequest.getCheckLists() != null && !taskRequest.getCheckLists().isEmpty()) {
            Set<CheckList> checkLists = taskRequest.getCheckLists().stream()
                    .map(c -> CheckList.builder()
                            .body(c)
                            .task(task)
                            .creatorId(creator.getUserId())
                            .build())
                    .collect(Collectors.toSet());
            task.setCheckLists(checkLists);
        }
        Task savedTask = taskRepository.save(task);
        savedTask.setProjectId(projectId);
        savedTask.setBoardColumnId(savedTask.getBoardColumn().getBoardColumnId());
        List<ProjectMember> assignees = projectMemberRepository.findByMemberIdInAndProjectId(
                taskRequest.getAssigneeIds()
                        .stream()
                        .filter(a -> !a.equals(creator.getUserId())).toList()
                , projectId);

        eventPublisher.publishEvent(new TaskEvent(
                savedTask,
                projectId,
                creator,
                ActionType.CREATE_TASK,
                "Đã tạo nhiệm vụ",
                savedTask.getTaskId(),
                savedTask.getTitle(),
                Map.of(),
                Map.of("assignees", assignees)
        ));
        return maptoTaskResponse(savedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTaskForProject(String projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại"));
        List<Task> tasks = taskRepository.getAllTaskByProject(projectId);
        return tasks.stream().map(this::maptoTaskResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public TaskResponse archiveTask(String projectId, String taskId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        oldData.put("status", task.getStatus());
        oldData.put("sortOrder", task.getSortOrder());
        oldData.put("archivedAt", task.getArchivedAt() != null ? task.getArchivedAt().toString() : null);

        task.setStatus(Status.ARCHIVED);
        task.setSortOrder(null);
        task.setArchivedAt(Instant.now());

        newData.put("status", task.getStatus());
        newData.put("sortOrder", task.getSortOrder());
        newData.put("archivedAt", task.getArchivedAt().toString());

        data.put("old", oldData);
        data.put("new", newData);

        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.ARCHIVE_TASK,
                "Đã lưu trữ nhiệm vụ",
                task.getTaskId(),
                task.getTitle(),
                data
        ));
        return maptoTaskResponse(task);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public TaskResponse restoreTask(String projectId, String taskId, Double sortOrder) {
        Task task = taskRepository.findArchiveTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        oldData.put("status", task.getStatus());
        oldData.put("sortOrder", task.getSortOrder());
        oldData.put("archivedAt", task.getArchivedAt().toString());


        task.setStatus(Status.ACTIVE);
        task.setArchivedAt(null);
        if (sortOrder == null || sortOrder.isNaN()) {
            Double maxSortOrder = taskRepository.getMaxSortOrder(projectId, task.getBoardColumnId())
                    .orElse(0.0);
            task.setSortOrder(Math.ceil(maxSortOrder) + 1);
        } else {
            task.setSortOrder(sortOrder);
        }

        newData.put("status", task.getStatus());
        newData.put("sortOrder", task.getSortOrder());
        newData.put("archivedAt", null);

        data.put("old", oldData);
        data.put("new", newData);

        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.RESTORE_TASK,
                "Đã khôi phục nhiệm vụ",
                task.getTaskId(),
                task.getTitle(),
                data
        ));
        return maptoTaskResponse(task);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void deleteTask(String projectId, String taskId) {
        Task task = taskRepository.findArchiveTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        taskRepository.delete(task);
        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.DELETE_TASK,
                "Đã xóa nhiệm vụ",
                taskId,
                task.getTitle(),
                Map.of()
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public TaskResponse moveTask(String projectId, String taskId, Double sortOrder, String boardColumnId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        BoardColumn boardColumn = boardColumnRepository.getReferenceById(boardColumnId);

        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        oldData.put("sortOrder", task.getSortOrder());
        oldData.put("boardColumnId", task.getBoardColumnId());


        if (sortOrder < 0) {
            Double maxSortOrder = taskRepository.getMaxSortOrder(projectId, boardColumnId)
                    .orElse(0.0);
            sortOrder = Math.ceil(maxSortOrder) + 1;
        }

        task.setBoardColumn(boardColumn);
        task.setSortOrder(sortOrder);

        newData.put("sortOrder", task.getSortOrder());
        newData.put("boardColumnId", boardColumn.getBoardColumnId());

        data.put("old", oldData);
        data.put("new", newData);

        String description = "Đã di chuyển nhiệm vụ";
        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.MOVE_TASK,
                description,
                task.getTaskId(),
                task.getTitle(),
                data
        ));
        return maptoTaskResponse(task);
    }

    @Override
    @Transactional
    @Cacheable(value = "taskDetail", key = "#taskId")
    public TaskDetailResponse getTask(String projectId, String taskId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        List<String> labelIds = task.getTaskLabels().stream().map(TaskLabel::getLabelId).toList();
        List<String> assigneeIds = task.getAssignees().stream().map(TaskAssignee::getAssigneeId).toList();
        List<CommentResponse> comments = task.getComments().stream()
                .map(c -> CommentResponse.builder()
                        .commentId(c.getCommentId())
                        .taskId(c.getTaskId())
                        .body(c.getBody())
                        .creatorId(c.getCreatorId())
                        .updatedAt(c.getUpdatedAt())
                        .createdAt(c.getCreatedAt())
                        .mentionIds(c.getCommentMentions().stream().map(CommentMentions::getMentionId).toList())
                        .build()).toList();
        List<CheckListResponse> checkLists = task.getCheckLists().stream()
                .map(c -> CheckListResponse.builder()
                        .checkListId(c.getCheckListId())
                        .taskId(c.getTaskId())
                        .body(c.getBody())
                        .done(c.isDone())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .creatorId(c.getCreatorId())
                        .build()).toList();
        return TaskDetailResponse.builder()
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .sortOrder(task.getSortOrder())
                .priority(task.getPriority())
                .completed(task.getCompleted())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .dueAt(task.getDueAt())
                .projectId(task.getProjectId())
                .boardColumnId(task.getBoardColumnId())
                .creatorId(task.getCreatorId())
                .assigneeIds(assigneeIds)
                .labelIds(labelIds)
                .comments(comments)
                .checkLists(checkLists)
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void updateTask(String projectId, String taskId, TaskRequest taskRequest) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();

        if (taskRequest.getTitle() != null && !taskRequest.getTitle().isBlank() &&
                !taskRequest.getTitle().equals(task.getTitle())) {
            oldData.put("title", task.getTitle());
            task.setTitle(taskRequest.getTitle());
            newData.put("title", task.getTitle());
        }
        if (taskRequest.getDescription() != null &&
                !taskRequest.getDescription().equals(task.getDescription())) {
            oldData.put("description", task.getDescription());
            task.setDescription(taskRequest.getDescription());
            newData.put("description", task.getDescription());
        }
        if (taskRequest.getDueAt() != null && !taskRequest.getDueAt().equals(task.getDueAt())) {
            oldData.put("dueAt", task.getDueAt() != null ? task.getDueAt().toString() : null);
            if (taskRequest.getDueAt().equals(Instant.MIN)) {
                task.setDueAt(null);
            } else {
                task.setDueAt(normalizeToEndOfDay(taskRequest.getDueAt()));
            }
            newData.put("dueAt", task.getDueAt()!=null ? task.getDueAt().toString() : null);
        }
        if (taskRequest.getPriority() != null && taskRequest.getPriority() != task.getPriority()) {
            oldData.put("priority", task.getPriority());
            task.setPriority(taskRequest.getPriority());
            newData.put("priority", task.getPriority());
        }
        if (!newData.isEmpty()) {
            data.put("new", newData);
            data.put("old", oldData);

            String des = "Đã cập nhập nhiệm vụ";
            eventPublisher.publishEvent(new TaskEvent(
                    task,
                    projectId,
                    getCurrentUser(),
                    ActionType.UPDATE_TASK,
                    des,
                    task.getTaskId(),
                    task.getTitle(),
                    data
            ));
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void addAssigneeTask(String projectId, String taskId, String assigneeId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        UserPrincipal assignee = authServiceClient.getUsers(List.of(assigneeId)).getFirst();
        if (assignee == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thành viên không tồn tại");
        }
        TaskAssignee taskAssignee = TaskAssignee.builder()
                .task(task)
                .assigneeId(assigneeId)
                .build();
        taskAssigneeRepository.save(taskAssignee);


        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.ADD_MEMBER_TASK,
                "Đã thêm " + assignee.getFullName() + " vào nhiệm vụ",
                task.getTaskId(),
                task.getTitle(),
                null,
                Map.of("assignees", List.of(ProjectMember.builder()
                        .memberId(assigneeId)
                        .email(assignee.getEmail())
                        .build()))
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void deleteAssigneeTask(String projectId, String taskId, String assigneeId) {
        TaskAssignee taskAssignee = taskAssigneeRepository
                .findById(new TaskAssigneeId(assigneeId, taskId))
                .orElseThrow();
        taskAssigneeRepository.delete(taskAssignee);

        UserPrincipal assignee = authServiceClient.getUsers(List.of(assigneeId)).getFirst();
        if (assignee != null) {
            eventPublisher.publishEvent(new TaskEvent(
                    taskAssignee.getTask(),
                    projectId,
                    getCurrentUser(),
                    ActionType.DELETE_MEMBER_TASK,
                    "Đã xóa " + assignee.getFullName() + " ra khỏi nhiệm vụ",
                    taskId,
                    taskAssignee.getTask().getTitle(),
                    null,
                    Map.of("assignee", assignee)
            ));
        }

    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void addLabelTask(String projectId, String taskId, String labelId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        Label label = labelRepository.findById(labelId).orElseThrow();
        TaskLabel taskLabel = TaskLabel.builder()
                .task(task)
                .label(label)
                .build();
        taskLabelRepository.save(taskLabel);
        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.ADD_LABEL_TASK,
                "Đã thêm nhãn " + label.getName() + " vào nhiệm vụ",
                task.getTaskId(),
                task.getTitle(),
                null
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void deleteLabelTask(String projectId, String taskId, String labelId) {
        TaskLabel taskLabel = taskLabelRepository.findById(new TaskLabelId(taskId, labelId)).orElseThrow();
        taskLabelRepository.delete(taskLabel);
        eventPublisher.publishEvent(new TaskEvent(
                taskLabel.getTask(),
                projectId,
                getCurrentUser(),
                ActionType.DELETE_LABEL_TASK,
                "Đã xóa nhãn " + taskLabel.getLabel().getName() + " khỏi nhiệm vụ",
                taskId,
                taskLabel.getTask().getTitle(),
                null
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void updateCompletedTask(String projectId, String taskId, Boolean completed) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        Map<String, Object> data = new HashMap<>();
        Map<String, Object> newData = new HashMap<>();
        Map<String, Object> oldData = new HashMap<>();
        oldData.put("completed", task.getCompleted());
        task.setCompleted(completed);
        newData.put("completed", task.getCompleted());
        newData.put("updatedAt", Instant.now().toString());
        data.put("old", oldData);
        data.put("new", newData);
        if (completed) {
            eventPublisher.publishEvent(new TaskEvent(
                    task, projectId, getCurrentUser(), ActionType.COMPLETE_TASK,
                    "Đã hoàn thành nhiệm vu",
                    task.getTaskId(), task.getTitle(), data
            ));
        } else {
            eventPublisher.publishEvent(new TaskEvent(
                    task, projectId, getCurrentUser(), ActionType.INCOMPLETE_TASK,
                    "Đã đánh dấu chưa hoàn thành nhiệm vu",
                    task.getTaskId(), task.getTitle(), data
            ));
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public CheckListResponse createCheckList(String projectId, String taskId, String body) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        CheckList checkList = CheckList.builder()
                .task(task)
                .done(false)
                .creatorId(getCurrentUser().getUserId())
                .body(body)
                .build();
        CheckList savedCheckList = checkListRepository.save(checkList);
        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.ADD_CHECKLIST,
                "Đã tạo công việc mới",
                savedCheckList.getCheckListId(),
                savedCheckList.getBody(),
                null
        ));
        return CheckListResponse.builder()
                .taskId(taskId)
                .checkListId(savedCheckList.getCheckListId())
                .creatorId(savedCheckList.getCreatorId())
                .body(savedCheckList.getBody())
                .done(savedCheckList.isDone())
                .createdAt(checkList.getCreatedAt())
                .updatedAt(checkList.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public CheckListResponse updateCheckList(String projectId, String taskId, String checkListId, String body, Boolean done) {
        CheckList checkList = checkListRepository.findById(checkListId).orElseThrow();
        if (done != null && checkList.isDone() != done) {
            checkList.setDone(done);
            if (done) {
                eventPublisher.publishEvent(new TaskEvent(
                        checkList.getTask(), projectId, getCurrentUser(),
                        ActionType.COMPLETE_CHECKLIST,
                        "Đã hoàn thành công việc",
                        checkListId,
                        checkList.getBody(),
                        null
                ));
            } else {
                eventPublisher.publishEvent(new TaskEvent(
                        checkList.getTask(), projectId, getCurrentUser(),
                        ActionType.INCOMPLETE_CHECKLIST,
                        "Đã đánh dấu chưa hoàn thành công việc",
                        checkListId,
                        checkList.getBody(),
                        null
                ));
            }
        }
        if (body != null && !body.isEmpty()) {
            checkList.setBody(body);
            eventPublisher.publishEvent(new TaskEvent(
                    checkList.getTask(), projectId, getCurrentUser(),
                    ActionType.UPDATE_CHECKLIST,
                    "Đã chỉnh sửa công việc",
                    checkListId,
                    checkList.getBody(),
                    null
            ));
        }
        return CheckListResponse.builder()
                .taskId(checkList.getTaskId())
                .checkListId(checkList.getCheckListId())
                .creatorId(checkList.getCreatorId())
                .body(checkList.getBody())
                .done(checkList.isDone())
                .createdAt(checkList.getCreatedAt())
                .updatedAt(checkList.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void deleteCheckList(String projectId, String taskId, String checkListId) {
        CheckList checkList = checkListRepository.findById(checkListId).orElseThrow();
        checkListRepository.delete(checkList);
        eventPublisher.publishEvent(new TaskEvent(
                checkList.getTask(), projectId, getCurrentUser(),
                ActionType.DELETE_CHECKLIST,
                "Đã xóa công việc",
                checkListId,
                checkList.getBody(),
                null
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public CommentResponse createComment(String projectId, String taskId, String body) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        List<String> mentionIds = extractMentions(body);
        Comment comment = Comment.builder()
                .body(body)
                .creatorId(getCurrentUser().getUserId())
                .task(task)
                .build();
        Set<CommentMentions> commentMentions = mentionIds.stream()
                .map(id -> CommentMentions.builder()
                        .comment(comment)
                        .mentionId(id)
                        .build())
                .collect(Collectors.toSet());
        comment.setCommentMentions(commentMentions);
        Comment savedComment = commentRepository.save(comment);

        eventPublisher.publishEvent(new TaskEvent(
                task,
                projectId,
                getCurrentUser(),
                ActionType.ADD_COMMENT,
                "Đã thêm 1 bình luận",
                savedComment.getCommentId(),
                null,
                null,
                Map.of("commentMentions", commentMentions)
        ));


        return CommentResponse.builder()
                .commentId(savedComment.getCommentId())
                .creatorId(savedComment.getCreatorId())
                .body(savedComment.getBody())
                .taskId(taskId)
                .mentionIds(mentionIds)
                .createdAt(savedComment.getCreatedAt())
                .updatedAt(savedComment.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public void deleteComment(String projectId, String taskId, String commentId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        if (Objects.equals(comment.getCreatorId(), getCurrentUser().getUserId())) {
            commentRepository.delete(comment);
            eventPublisher.publishEvent(new TaskEvent(
                    comment.getTask(), projectId, getCurrentUser(),
                    ActionType.DELETE_COMMENT,
                    "Đã xóa 1 bình luận",
                    comment.getCommentId(),
                    null,
                    null
            ));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn ko có quyền");
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "taskDetail", key = "#taskId")
    public CommentResponse updateComment(String projectId, String taskId, String commentId, String body) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        if (!Objects.equals(comment.getCreatorId(), getCurrentUser().getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn ko có quyền");
        }
        if (!body.equals(comment.getBody())) {
            List<Map<String, Object>> changes = new ArrayList<>();

            List<String> mentionIds = extractMentions(body);
            Set<CommentMentions> commentMentions = mentionIds.stream()
                    .map(id -> CommentMentions.builder()
                            .comment(comment)
                            .mentionId(id)
                            .build())
                    .collect(Collectors.toSet());
            comment.getCommentMentions().clear();
            commentRepository.flush();
            comment.getCommentMentions().addAll(commentMentions);
            comment.setBody(body);
            comment.setUpdatedAt(Instant.now());

            eventPublisher.publishEvent(new TaskEvent(
                    comment.getTask(),
                    projectId,
                    getCurrentUser(),
                    ActionType.UPDATE_COMMENT,
                    "Đã chỉnh sửa 1 bình luận",
                    comment.getCommentId(),
                    null,
                    null,
                    Map.of("commentMentions", commentMentions)
            ));
        }


        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .creatorId(comment.getCreatorId())
                .body(comment.getBody())
                .taskId(comment.getTaskId())
                .mentionIds(comment.getCommentMentions().stream()
                        .map(CommentMentions::getMentionId)
                        .collect(Collectors.toList()))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks() {
        List<Task> tasks = taskRepository.findAllByAssigneeId(getCurrentUser().getUserId());
        return tasks.stream().map(task -> TaskResponse.builder()
                .projectId(task.getProjectId())
                .taskId(task.getTaskId())
                .priority(task.getPriority())
                .title(task.getTitle())
                .dueAt(task.getDueAt())
                .createdAt(task.getCreatedAt())
                .completed(task.getCompleted())
                .status(task.getStatus())
                .creatorId(task.getCreatorId())
                .projectName(task.getProject().getName())
                .build()).toList();
    }


    private TaskResponse maptoTaskResponse(Task task) {
        return TaskResponse.builder()
                .projectId(task.getProjectId())
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .priority(task.getPriority())
                .dueAt(task.getDueAt())
                .createdAt(task.getCreatedAt())
                .completed(task.getCompleted())
                .sortOrder(task.getSortOrder())
                .status(task.getStatus())
                .boardColumnId(task.getBoardColumn().getBoardColumnId())
                .creatorId(task.getCreatorId())
                .assigneeIds(task.getAssignees() != null ?
                        task.getAssignees().stream().map(TaskAssignee::getAssigneeId).collect(Collectors.toList()) :
                        List.of())
                .labelIds(task.getTaskLabels() != null ?
                        task.getTaskLabels().stream().map(TaskLabel::getLabelId).collect(Collectors.toList()) :
                        List.of())
                .projectName(task.getProject().getName())
                .build();
    }

    private UserPrincipal getCurrentUser() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return (UserPrincipal) securityContext.getAuthentication().getPrincipal();
    }

    private List<String> extractMentions(String body) {
        Pattern pattern = Pattern.compile("@\\[([^]]+)]\\(([^)]+)\\)");
        Matcher matcher = pattern.matcher(body);
        Set<String> userIds = new HashSet<>();

        while (matcher.find()) {
            userIds.add(matcher.group(2));
        }
        return new ArrayList<>(userIds);
    }

    private Instant normalizeToEndOfDay(Instant input) {
        if (input == null) return null;
        return input.atZone(ZoneId.systemDefault())
                .with(LocalTime.of(23, 59, 59))
                .toInstant();
    }
}