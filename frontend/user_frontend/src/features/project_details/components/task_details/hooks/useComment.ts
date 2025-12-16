import type {TaskDetailResponse} from "@/shared/types";
import {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {TaskService} from "@/shared/services";
import toast from "react-hot-toast";
import {useConfirm} from "@/confirm_dialog";


export const useComment = (task: TaskDetailResponse) => {
    const [newComment, setNewComment] = useState("");
    const queryClient = useQueryClient();
    const {projectId, taskId} = task;
    const confirm = useConfirm();

    const createCommentMutation = useMutation({
        mutationFn: (content: string) =>
            TaskService.createComment(projectId, taskId, content),
        onSuccess: (newComment) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    comments: [newComment, ...(old.comments || [])]
                };
            });
            setNewComment("");
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) =>
            TaskService.deleteComment(projectId, taskId, commentId),
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
            TaskService.updateComment(projectId, taskId, commentId, body),
        onSuccess: (data) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    comments: old.comments.map(c => c.commentId === data.commentId ? data : c)
                };
            });
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const handleDeleteComment = async (id: string) => {
        const confirmed = await confirm({
            title: 'Xóa bình luận?',
            description: `Bạn có chắc chắn muốn xóa?`,
            confirmText: 'Xóa',
            isLoading: deleteCommentMutation.isPending,
            type: 'danger',
        });

        if (confirmed) {
            deleteCommentMutation.mutate(id)
        }
    }

    return {
        newComment, setNewComment, createCommentMutation,
        updateCommentMutation, handleDeleteComment
    }
}