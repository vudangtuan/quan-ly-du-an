// components/TaskDetailModal/TaskComments.tsx
import React, {useState, useMemo} from "react";
import {MessageSquare, Loader2} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {TaskService} from "@features/projects/services/TaskService";
import toast from "react-hot-toast";
import {MentionsInput, Mention} from "react-mentions";
import {Avatar} from "@components/Avatar";
import {CommentResponse, TaskDetailResponse} from "@features/projects/types/task.types";
import {ProjectMemberResponse} from "@features/projects/types/project.types";
import {CommentItem} from "./CommentItem";

interface TaskCommentsProps {
    taskId: string;
    comments: CommentResponse[];
}

export const TaskComments: React.FC<TaskCommentsProps> = ({taskId, comments}) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();
    const queryClient = useQueryClient();

    const [newComment, setNewComment] = useState("");
    const [isAddingComment, setIsAddingComment] = useState(false);

    const mentionData = useMemo(() =>
            project.members.map((member: ProjectMemberResponse) => ({
                id: member.userId,
                display: member.fullName,
                email: member.email
            })),
        [project.members]
    );

    const createCommentMutation = useMutation({
        mutationFn: (content: string) =>
            TaskService.createComment(project.projectId, taskId, content),
        onSuccess: (newComment) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    comments: [...(old.comments || []), newComment]
                };
            });
            setNewComment("");
            setIsAddingComment(false);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) =>
            TaskService.deleteComment(project.projectId, taskId, commentId),
        onSuccess: (_, commentId) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    comments: old.comments.filter(c => c.commentId !== commentId)
                };
            });
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const updateCommentMutation = useMutation({
        mutationFn: ({commentId, body}: { commentId: string, body: string }) =>
            TaskService.updateComment(project.projectId, taskId, commentId, body),
        onSuccess: (data: CommentResponse, {commentId}) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    comments: old.comments.map(c => c.commentId === commentId ? data : c)
                };
            });
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        createCommentMutation.mutate(newComment.trim());
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4"/>
                    Bình luận ({comments.length})
                </label>
            </div>

            {/* Add comment */}
            <div className="space-y-2">
                {isAddingComment ? (
                    <div className="space-y-2">
                        <MentionsInput
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                                    handleAddComment();
                                }
                            }}
                            autoFocus
                            value={newComment}
                            onChange={(_, newValue) => setNewComment(newValue)}
                            placeholder="Thêm bình luận... (Dùng @ để mention)"
                            style={{
                                control: {fontSize: 14},
                                "&multiLine": {
                                    control: {minHeight: 80},
                                    highlighter: {padding: 9, border: "1px solid transparent"},
                                    input: {padding: 9, border: "1px solid silver", borderRadius: "0.5rem", lineHeight: 1.5}
                                },
                                suggestions: {
                                    list: {
                                        backgroundColor: "white",
                                        overflowY: 'auto',
                                        border: "1px solid rgba(0,0,0,0.15)",
                                        fontSize: 14,
                                        maxHeight: "200px",
                                        zIndex: 10000
                                    },
                                    item: {padding: "5px 15px", "&focused": {backgroundColor: "#eff6ff"}}
                                },
                            }}
                        >
                            <Mention
                                className="bg-blue-100"
                                trigger="@"
                                data={mentionData}
                                displayTransform={(_, display) => `@${display}`}
                                markup="@[__display__](__id__)"
                                renderSuggestion={(suggestion: any, _, highlightedDisplay) => (
                                    <div className="flex items-center gap-2">
                                        <Avatar fullname={suggestion.display} className="h-6 w-6"/>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-900">
                                                {highlightedDisplay}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {suggestion.email}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                appendSpaceOnAdd
                            />
                        </MentionsInput>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAddComment}
                                disabled={createCommentMutation.isPending || !newComment.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700
                                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                {createCommentMutation.isPending && (
                                    <Loader2 className="h-3 w-3 animate-spin"/>
                                )}
                                Gửi
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingComment(false);
                                    setNewComment("");
                                }}
                                disabled={createCommentMutation.isPending}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        hidden={project.currentRoleInProject === "VIEWER"}
                        onClick={() => setIsAddingComment(true)}
                        className="w-full px-3 py-2 text-sm text-left text-gray-500 border border-dashed rounded-lg
                            hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                        Thêm bình luận...
                    </button>
                )}
            </div>

            {/* Comments list */}
            {comments.length > 0 ? (
                <div className="space-y-3">
                    {comments.map(comment => (
                        <CommentItem
                            key={comment.commentId}
                            comment={comment}
                            onDelete={deleteCommentMutation.mutate}
                            isLoading={deleteCommentMutation.isPending || updateCommentMutation.isPending}
                            onUpdate={updateCommentMutation.mutate}
                            isError={updateCommentMutation.isError}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                    Chưa có bình luận nào
                </div>
            )}
        </div>
    );
};