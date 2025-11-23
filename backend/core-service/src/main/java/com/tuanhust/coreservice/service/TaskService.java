package com.tuanhust.coreservice.service;

import com.tuanhust.coreservice.request.TaskRequest;
import com.tuanhust.coreservice.response.CheckListResponse;
import com.tuanhust.coreservice.response.CommentResponse;
import com.tuanhust.coreservice.response.TaskDetailResponse;
import com.tuanhust.coreservice.response.TaskResponse;

import java.util.List;

public interface TaskService {
    TaskResponse createTask(String projectId, TaskRequest taskRequest);

    List<TaskResponse> getTaskForProject(String projectId);

    TaskResponse archiveTask(String projectId, String taskId);

    TaskResponse restoreTask(String projectId, String taskId, Double sortOrder);

    void deleteTask(String projectId, String taskId);

    TaskResponse moveTask(String projectId, String taskId, Double sortOrder, String boardColumnId);

    TaskDetailResponse getTask(String projectId, String taskId);

    void updateTask(String projectId, String taskId, TaskRequest taskRequest);

    void updateCompletedTask(String projectId, String taskId, Boolean completed);

    CheckListResponse createCheckList(String projectId, String taskId, String body);

    CheckListResponse updateCheckList(String checkListId, String body, Boolean done);

    void deleteCheckList(String checkListId);

    CommentResponse createComment(String projectId, String taskId, String body);

    void deleteComment(String commentId);

    CommentResponse updateComment(String projectId,String commentId, String body);
}