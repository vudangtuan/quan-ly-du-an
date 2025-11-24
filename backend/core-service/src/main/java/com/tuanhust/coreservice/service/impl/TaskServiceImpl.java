package com.tuanhust.coreservice.service.impl;

import com.tuanhust.coreservice.config.UserPrincipal;
import com.tuanhust.coreservice.entity.*;
import com.tuanhust.coreservice.entity.enums.Status;
import com.tuanhust.coreservice.repository.*;
import com.tuanhust.coreservice.request.TaskRequest;
import com.tuanhust.coreservice.response.CheckListResponse;
import com.tuanhust.coreservice.response.CommentResponse;
import com.tuanhust.coreservice.response.TaskDetailResponse;
import com.tuanhust.coreservice.response.TaskResponse;
import com.tuanhust.coreservice.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
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
                .dueAt(taskRequest.getDueAt())
                .priority(taskRequest.getPriority())
                .creatorId(creator.getUserId())
                .sortOrder(Math.ceil(maxSortOrder) + 1)
                .build();

        if (taskRequest.getAssigneeIds() != null && !taskRequest.getAssigneeIds().isEmpty()) {
            Set<TaskAssignee> assignees = taskRequest.getAssigneeIds().stream()
                    .map(assigneeId -> TaskAssignee.builder().assigneeId(assigneeId).task(task).build())
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
        Task savedTask = taskRepository.save(task);


        return TaskResponse.builder()
                .projectId(projectId)
                .taskId(savedTask.getTaskId())
                .title(savedTask.getTitle())
                .priority(savedTask.getPriority())
                .dueAt(savedTask.getDueAt())
                .completed(savedTask.getCompleted())
                .sortOrder(savedTask.getSortOrder())
                .status(savedTask.getStatus())
                .boardColumnId(taskRequest.getBoardColumnId())
                .creatorId(savedTask.getCreatorId())
                .assigneeIds(taskRequest.getAssigneeIds())
                .labelIds(taskRequest.getLabelIds())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTaskForProject(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dự án không tồn tại"));
        List<Task> tasks = project.getTasks().stream().toList();
        return tasks.stream().map(this::maptoTaskResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskResponse archiveTask(String projectId, String taskId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        task.setStatus(Status.ARCHIVED);
        task.setSortOrder(null);
        return maptoTaskResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse restoreTask(String projectId, String taskId, Double sortOrder) {
        Task task = taskRepository.findArchiveTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        task.setStatus(Status.ACTIVE);
        if (sortOrder == null || sortOrder.isNaN()) {
            Double maxSortOrder = taskRepository.getMaxSortOrder(projectId, task.getBoardColumnId())
                    .orElse(0.0);
            task.setSortOrder(Math.ceil(maxSortOrder) + 1);
        } else {
            task.setSortOrder(sortOrder);
        }
        return maptoTaskResponse(task);
    }

    @Override
    @Transactional
    public void deleteTask(String projectId, String taskId) {
        taskRepository.deleteTask(projectId, taskId);
    }

    @Override
    @Transactional
    public TaskResponse moveTask(String projectId, String taskId, Double sortOrder, String boardColumnId) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
                );
        BoardColumn boardColumn = boardColumnRepository.getReferenceById(boardColumnId);
        task.setBoardColumn(boardColumn);
        task.setSortOrder(sortOrder);
        return maptoTaskResponse(task);
    }

    @Override
    @Transactional
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
    public void updateTask(String projectId, String taskId, TaskRequest taskRequest) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        if (taskRequest.getTitle() != null && !taskRequest.getTitle().isBlank()) {
            task.setTitle(taskRequest.getTitle());
        }
        if (taskRequest.getLabelIds() != null) {
            if (!taskRequest.getLabelIds().isEmpty()) {
                long count = labelRepository.countByProjectIdAndLabelIdIn(projectId, taskRequest.getLabelIds());
                if (count != taskRequest.getLabelIds().size()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một số nhãn không thuộc dự án này");
                }
            }
            Set<TaskLabel> labels = taskRequest.getLabelIds().stream()
                    .map(labelId -> {
                        Label labelRef = labelRepository.getReferenceById(labelId);
                        return TaskLabel.builder().label(labelRef).task(task).build();
                    })
                    .collect(Collectors.toSet());
            task.getTaskLabels().clear();
            taskRepository.flush();
            task.getTaskLabels().addAll(labels);
        }


        if (taskRequest.getAssigneeIds() != null) {
            if (!taskRequest.getAssigneeIds().isEmpty()) {
                long count = projectMemberRepository.countByProjectIdAndMemberIdIn(projectId, taskRequest.getAssigneeIds());
                if (count != taskRequest.getAssigneeIds().size()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một số thành viên không thuộc dự án này");
                }
            }
            Set<TaskAssignee> assignees = taskRequest.getAssigneeIds().stream()
                    .map(assigneeId -> TaskAssignee.builder().assigneeId(assigneeId).task(task).build())
                    .collect(Collectors.toSet());
            task.getAssignees().clear();
            taskRepository.flush();
            task.getAssignees().addAll(assignees);
        }
        if (taskRequest.getDescription() != null) {
            task.setDescription(taskRequest.getDescription());
        }
        if (taskRequest.getDueAt() != null) {
            if (taskRequest.getDueAt().equals(Instant.MIN)) {
                task.setDueAt(null);
            } else {
                task.setDueAt(taskRequest.getDueAt());
            }
        }
        if (taskRequest.getPriority() != null) {
            task.setPriority(taskRequest.getPriority());
        }
    }

    @Override
    @Transactional
    public void updateCompletedTask(String projectId, String taskId, Boolean completed) {
        Task task = taskRepository.findTaskByProjectIdAndTaskId(projectId, taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại")
        );
        task.setCompleted(completed);
    }

    @Override
    @Transactional
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
    public CheckListResponse updateCheckList(String checkListId, String body, Boolean done) {
        CheckList checkList = checkListRepository.findById(checkListId).orElseThrow();
        if (body != null && !body.isBlank()) {
            checkList.setBody(body);
        }
        if (done != null) {
            checkList.setDone(done);
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
    public void deleteCheckList(String checkListId) {
        checkListRepository.deleteById(checkListId);
    }

    @Override
    @Transactional
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
    public void deleteComment(String commentId) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        if (Objects.equals(comment.getCreatorId(), getCurrentUser().getUserId())) {
            commentRepository.delete(comment);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn ko có quyền");
        }
    }

    @Override
    @Transactional
    public CommentResponse updateComment(String projectId, String commentId, String body) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        if (!Objects.equals(comment.getCreatorId(), getCurrentUser().getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn ko có quyền");
        }
        if (!body.equals(comment.getBody())) {
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
        return tasks.stream().map(task->TaskResponse.builder()
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
                .boardColumnId(task.getBoardColumnId())
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
}