import type {CommentResponse, ProjectMemberResponse, TaskDetailResponse} from "@/shared/types";
import {Mention, MentionsInput, type MentionsInputStyle} from "react-mentions";
import {useProjectDetail} from "@/features/project_details/hooks";
import React, {useMemo, useState} from "react";
import {Avatar} from "@/shared/components";
import {useComment} from "@/features/project_details/components/task_details/hooks";
import {formatDateLocalDate} from "@/utils";
import {Loader2, Pencil, Trash2} from "lucide-react";
import {useAuthStore} from "@/store";

interface TaskCommentProps {
    task: TaskDetailResponse;
}


const mentionInputStyle: MentionsInputStyle = {
    control: {fontSize: 14},
    "&multiLine": {
        control: {minHeight: 80},
        highlighter: {padding: 7, border: "1px solid transparent"},
        input: {padding: 7, border: "1px solid silver", borderRadius: "0.5rem", lineHeight: 1.5}
    },
    suggestions: {
        list: {
            backgroundColor: "white",
            overflowY: 'auto',
            border: "1px solid rgba(0,0,0,0.15)",
            maxHeight: "200px",
            zIndex: 10000
        },
        item: {padding: "5px 15px", "&focused": {backgroundColor: "#eff6ff"}}
    },
}

export const TaskComment: React.FC<TaskCommentProps> = ({task}) => {
    const {projectDetail} = useProjectDetail(task.projectId);
    const {userInfo} = useAuthStore();
    const userId = useAuthStore(state => state.userInfo?.userId);
    const mentionData = useMemo(() =>
            projectDetail!.members
                .filter((member) => member.userId !== userId)
                .map((member) => ({
                    id: member.userId,
                    display: member.fullName,
                    email: member.email
                })),
        [projectDetail, userId]
    );
    const {
        newComment, setNewComment,
        createCommentMutation, handleDeleteComment, updateCommentMutation
    } = useComment(task);

    const [editCommentId, setEditCommentId] = useState<string>("");
    const [editComment, setEditComment] = useState<string>("");
    const handleUpdateComment = (id: string, old: string) => {
        if (editComment.trim() && editComment.trim() !== old) {
            updateCommentMutation.mutate({commentId: id, body: editComment})
        }
        setEditComment("");
        setEditCommentId("");
    }
    return (
        <div className="space-y-2 px-2 relative">
            <div className="text-md font-medium">Bình luận</div>

            <MentionsInput
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        if (!newComment.trim()) return;
                        createCommentMutation.mutate(newComment.trim());
                    }
                }}
                style={mentionInputStyle}
                value={newComment}
                onChange={(_, newValue) => setNewComment(newValue)}
                placeholder="Nhập bình luận... (dùng @ để mention)">
                <Mention
                    className={"bg-blue-100"}
                    trigger={"@"}
                    displayTransform={(_, display) => `@${display}`}
                    markup="@[__display__](__id__)"
                    data={mentionData}
                    renderSuggestion={Suggestion}
                    appendSpaceOnAdd
                >
                </Mention>
            </MentionsInput>

            <div className={"flex justify-end w-full"}>
                <button
                    disabled={createCommentMutation.isPending || !newComment.trim()}
                    onClick={() => {
                        if (!newComment.trim()) return;
                        createCommentMutation.mutate(newComment.trim());
                    }}
                    className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700
                                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                    {createCommentMutation.isPending && (
                        <Loader2 className="h-3 w-3 animate-spin"/>
                    )}
                    Gửi
                </button>
            </div>

            <div className={"space-y-1 text-xs"}>
                {task.comments.map((comment: CommentResponse) => {
                    const commenter = projectDetail!.members.find((m: ProjectMemberResponse) => m.userId === comment.creatorId)
                    return <div
                        className="flex relative group hover:bg-gray-100 gap-3 items-start px-3 py-2 rounded-lg transition-colors">
                        <Avatar userId={commenter!.userId} fullName={commenter!.fullName}
                                className="h-8 w-8 flex-shrink-0"/>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                    {commenter?.fullName}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {formatDateLocalDate(comment.updatedAt)}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                {editCommentId === comment.commentId ?
                                    <div className={"space-y-2 w-full"}>
                                        <MentionsInput
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    handleUpdateComment(comment.commentId, comment.body);
                                                }
                                            }}
                                            autoFocus
                                            onBlur={(_event, clickedSuggestion) => {
                                                if (!clickedSuggestion) {
                                                    handleUpdateComment(comment.commentId, comment.body);
                                                }
                                            }}
                                            onFocus={(e) => {
                                                const length = e.target.value.length;
                                                e.target.setSelectionRange(length, length);
                                                e.target.scrollTop = e.target.scrollHeight;
                                            }}
                                            style={mentionInputStyle}
                                            value={editComment}
                                            onChange={(_, newValue) => setEditComment(newValue)}
                                            placeholder="Nhập bình luận... (dùng @ để mention)">
                                            <Mention
                                                className={"bg-blue-100"}
                                                trigger={"@"}
                                                displayTransform={(_, display) => `@${display}`}
                                                markup="@[__display__](__id__)"
                                                data={mentionData}
                                                renderSuggestion={Suggestion}
                                                appendSpaceOnAdd
                                            >
                                            </Mention>
                                        </MentionsInput>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleUpdateComment(comment.commentId, comment.body)}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700
                                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                Lưu
                                            </button>
                                        </div>
                                    </div>
                                    :
                                    <p className="text-gray-700 whitespace-pre-wrap flex-1">
                                        {renderContent(comment.body, projectDetail!.members)}
                                    </p>
                                }
                            </div>
                        </div>
                        <div hidden={userInfo!.userId !== commenter!.userId || editCommentId === comment.commentId}
                             className={"absolute group-hover:opacity-100 group-hover:flex opacity-0 hidden top-1 right-1"}>
                            <button
                                onClick={() => {
                                    setEditComment(comment.body);
                                    setEditCommentId(comment.commentId);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600  rounded"
                                title="Sửa bình luận"
                            >
                                <Pencil size={14}/>
                            </button>
                            <button
                                onClick={() => handleDeleteComment(comment.commentId)}
                                className="p-1.5 text-gray-500 hover:text-red-600  rounded"
                                title="Xóa bình luận"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </div>
                })}
            </div>
        </div>
    )
}


const MENTION_MARKUP_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

const renderContent = (content: string, members: ProjectMemberResponse[]) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    content.replace(MENTION_MARKUP_REGEX, (match, displayName, userId, offset) => {
        if (offset > lastIndex) {
            parts.push(<span key={lastIndex}>{content.substring(lastIndex, offset)}</span>);
        }

        const member = members.find(m => m.userId === userId);
        const name = member?.fullName || displayName;

        parts.push(
            <span
                key={offset}
                className="text-xs cursor-default text-blue-500"
                title={member?.roleInProject + ": " + name}
            >
                {name}
            </span>
        );

        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < content.length) {
        parts.push(<span key={lastIndex}>{content.substring(lastIndex)}</span>);
    }
    return parts;
};


const Suggestion = (suggestion: any, _, highlightedDisplay: React.ReactNode) => (
    <div className="flex items-center gap-2">
        <Avatar userId={suggestion.id} fullName={suggestion.display || ""}
                className="h-6 w-6"/>
        <div className="flex-1">
            <div className="font-medium text-sm text-gray-900">
                {highlightedDisplay}
            </div>
            <div className="text-xs text-gray-500">
                {suggestion.email}
            </div>
        </div>
    </div>
)