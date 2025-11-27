import React, {useState, useMemo} from "react";
import {Edit, Trash2, Loader2} from "lucide-react";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {useAuthStore} from "@store/slices/authSlice";
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useConfirm} from "@components/ConfirmDialog";
import {MentionsInput, Mention} from "react-mentions";
import {Avatar} from "@components/Avatar";
import {CommentResponse} from "@features/projects/types/task.types";
import {ProjectMemberResponse} from "@features/projects/types/project.types";
import {formatDateLocalDate} from "@features/utils/date.utils";


interface CommentItemProps {
    comment: CommentResponse;
    onDelete: (commentId: string) => void;
    onUpdate: ({commentId, body}: { commentId: string, body: string }) => void;
    isLoading?: boolean;
    isError?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
                                                            comment,
                                                            onDelete,
                                                            onUpdate,
                                                            isLoading,
                                                            isError
                                                        }) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();
    const userCurrentId = useAuthStore.getState().userInfo?.userId;
    const confirm = useConfirm();
    const [isEdit, setIsEdit] = useState(false);
    const [newBody, setNewBody] = useState(comment.body);

    const mentionData = useMemo(() =>
            project.members.map((member: ProjectMemberResponse) => ({
                id: member.userId,
                display: member.fullName,
                email: member.email
            })),
        [project.members]
    );

    const commenter = useMemo(
        () => project.members.find((m: ProjectMemberResponse) => m.userId === comment.creatorId),
        [comment.creatorId, project.members]
    );

    const handleUpdateComment = () => {
        if (!newBody.trim()) return;
        onUpdate({commentId: comment.commentId, body: newBody});
        if (!isError) {
            setIsEdit(false);
        } else {
            setNewBody(comment.body);
        }
    };

    const menuItems: MenuItem[] = [
        {
            label: "Chỉnh sửa",
            icon: <Edit className="h-4 w-4"/>,
            onClick: () => {
                setIsEdit(true);
                setTimeout(() => {
                    const input = document.querySelector('.mentions__input') as HTMLTextAreaElement;
                    if (input) {
                        input.focus();
                        input.setSelectionRange(input.value.length, input.value.length);
                    }
                }, 50);
            }
        },
        {
            label: "Xóa",
            icon: <Trash2 className="h-4 w-4"/>,
            onClick: async () => {
                const confirmed = await confirm({
                    title: 'Xóa bình luận?',
                    description: `Bạn có chắc chắn muốn xóa?`,
                    confirmText: 'Xóa',
                    isLoading: isLoading,
                    type: 'danger',
                });

                if (confirmed) {
                    onDelete(comment.commentId);
                }
            },
            danger: true
        }
    ];

    return (
        <div className="group">
            <ContextMenu
                items={menuItems}
                trigger="both"
                showButton={userCurrentId === comment.creatorId && !isEdit}
                buttonClassName="md:group-hover:opacity-100 md:opacity-0 top-0 right-0"
            >
                <div className="flex w-19/20 gap-3 items-start group-hover:bg-gray-50 px-3 py-1 rounded-lg transition-colors">
                    <Avatar fullname={commenter?.fullName} className="h-8 w-8 flex-shrink-0"/>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                                {commenter?.fullName}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDateLocalDate(comment.updatedAt)}
                            </span>
                        </div>

                        {isEdit ? (
                            <div className="space-y-2">
                                <MentionsInput
                                    className="mentions"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                                            handleUpdateComment();
                                        }
                                    }}
                                    autoFocus
                                    value={newBody}
                                    onChange={(_, newValue) => setNewBody(newValue)}
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
                                        onClick={handleUpdateComment}
                                        disabled={isLoading || !newBody.trim()}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700
                                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        {isLoading && <Loader2 className="h-3 w-3 animate-spin"/>}
                                        Lưu
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEdit(false);
                                            setNewBody(comment.body);
                                        }}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">
                                    {renderContent(comment.body, project.members)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </ContextMenu>
        </div>
    );
};

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
                className="text-sm cursor-default text-blue-500"
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