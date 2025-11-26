import React, {useEffect, useMemo, useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    Calendar,
    Check,
    ChevronDown, Clock, Edit,
    Edit2, FileText, Flag, ListCheck,
    Loader2, MessageSquare,
    Plus,
    Tag, Trash2, User, Users,
    X
} from "lucide-react";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {TaskService} from "@features/projects/services/TaskService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {LabelResponse, ProjectMemberResponse} from "@features/projects/types/project.types";
import {Label} from "@components/Label";
import * as Popover from "@radix-ui/react-popover";
import {
    CheckListResponse, CommentResponse,
    TaskDetailResponse,
    TaskPriority,
    TaskRequest,
    TaskResponse
} from "@features/projects/types/task.types";
import toast from "react-hot-toast";
import * as Select from "@radix-ui/react-select";
import {Avatar} from "@components/Avatar";
import {useAuthStore} from "@store/slices/authSlice";
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useConfirm} from "@components/ConfirmDialog";
import {MentionsInput, Mention} from "react-mentions"
import {formatDateLocalDate, isOverdue} from "@features/utils/date.utils";


interface TaskDetailModalProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
}

const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
        case 'HIGH':
            return 'bg-red-50 text-red-600 border-red-200';
        case 'MEDIUM':
            return 'bg-yellow-50 text-yellow-600 border-yellow-200';
        case 'LOW':
            return 'bg-green-50 text-green-600 border-green-200';
    }
};


export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({taskId, isOpen, onClose}) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();
    const queryClient = useQueryClient();
    const {data: task, isLoading, error} = useQuery({
        queryKey: ["task", taskId],
        queryFn: () => TaskService.getTask(project.projectId, taskId),
        enabled: isOpen && !!taskId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT
    });

    const canManage = useMemo(() => {
        return ["OWNER", "EDITOR"].includes(project.currentRoleInProject);
    }, [project])

    const isTaskOverdue = useMemo(() => {
        if (!task) return null;
        return isOverdue(task.dueAt, task.completed)
    }, [task]);

    const creator = useMemo(() => {
        if (!task || !project.members) return null;
        return project.members.find(
            (m: ProjectMemberResponse) => m.userId === task.creatorId
        );
    }, [task, project]);


    //mutation update task
    const updateTaskMutation = useMutation({
        mutationFn: (data: Partial<TaskRequest>) =>
            TaskService.updateTask(project.projectId, taskId, data),
        onSuccess: (_, variables) => {
            if (variables.dueAt === "-1000000000-01-01T00:00:00Z") {
                variables.dueAt = null;
            }
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    ...variables
                }
            });
            queryClient.setQueryData(["tasks", project.projectId], (old: TaskResponse[]) => {
                return old.map(o => {
                    if (o.taskId === taskId) {
                        return {
                            ...o,
                            ...variables
                        }
                    }
                    return o;
                })
            })
        },
        onError: (e) => {
            toast.error(e.message);
            setTitle(task.title);
            setLabels(project.labels.filter((label: LabelResponse) =>
                task.labelIds.includes(label.labelId)));
            setDescription(task.description);
            setPriority(task.priority)
            setDueAt(task.dueAt);
        }
    });

    //mutation complete
    const updateDoneTaskMutation = useMutation({
        mutationFn: (complete: boolean) =>
            TaskService.updateDone(project.projectId, taskId, complete),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    completed: variables
                }
            });
            queryClient.setQueryData(["tasks", project.projectId], (old: TaskResponse[]) => {
                return old.map(o => {
                    if (o.taskId === taskId) {
                        return {
                            ...o,
                            completed: variables
                        }
                    }
                    return o;
                })
            })
        },
        onError: (e) => {
            toast.error(e.message);
            setCompleted(task.completed);
        }
    });

    //state completed
    const [completed, setCompleted] = useState(false);

    //state title
    const [title, setTitle] = useState("")
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const handleSaveTitle = () => {
        updateTaskMutation.mutate({title: title});
        setIsEditingTitle(false);
    }

    //state labels
    const [labels, setLabels] = useState<LabelResponse[]>([]);
    useEffect(() => {
        if (isOpen && task && project.labels) {
            setLabels(project.labels.filter((label: LabelResponse) =>
                task.labelIds.includes(label.labelId)));
        }
    }, [task, project.labels, isOpen]);
    const handleSaveLabel = (l: LabelResponse) => {
        const newLabels = [...labels, l];
        updateTaskMutation.mutate({labelIds: newLabels.map(l => l.labelId)});
    }
    const handleRemoveLabel = (l: LabelResponse) => {
        const newLabels = labels.filter(la => la.labelId !== l.labelId);
        updateTaskMutation.mutate({labelIds: newLabels.map(l => l.labelId)});
    }
    // State description
    const [description, setDescription] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const handleSaveDes = () => {
        updateTaskMutation.mutate({description: description});
        setIsEditingDescription(false);
    }
    //State priority
    const [priority, setPriority] = useState<TaskPriority>("LOW");
    const handleSavePriority = (value: TaskPriority) => {
        setPriority(value);
        updateTaskMutation.mutate({priority: value});
    }
    //State duaAt
    const [dueAt, setDueAt] = useState<string>("");
    const handleSaveDueDate = (e) => {
        let newDueAt: string;
        if (e.target.value) {
            newDueAt = new Date(e.target.value).toISOString();
            setDueAt(newDueAt);
        } else {
            newDueAt = "-1000000000-01-01T00:00:00Z";
            setDueAt(null);
        }
        updateTaskMutation.mutate({dueAt: newDueAt});
    }

    //State member
    const [assignees, setAssignees] = useState<ProjectMemberResponse[]>([]);
    useEffect(() => {
        if (isOpen && task && project.members) {
            setAssignees(project.members.filter((m) =>
                task.assigneeIds.includes(m.userId)));
        }
    }, [task, project.members, isOpen]);
    const handleSaveMembers = (member: ProjectMemberResponse) => {
        const newAssigns = [...assignees, member];
        updateTaskMutation.mutate({assigneeIds: newAssigns.map(m => m.userId)});
    }
    const handleRemoveMembers = (member: ProjectMemberResponse) => {
        const newAssigns = assignees.filter(m => m.userId !== member.userId);
        updateTaskMutation.mutate({assigneeIds: newAssigns.map(m => m.userId)});
    }

    //state check list
    const [checkList, setCheckList] = useState<CheckListResponse[]>([]);
    const [isAddCheckList, setIsAddCheckList] = useState(false);
    const [newCheckListBody, setNewCheckListBody] = useState("");
    const completedCheckLists = useMemo(() => {
        return checkList.filter(c => c.done).length;
    }, [checkList]);

    const createCheckListMutation = useMutation({
        mutationFn: (body: string) =>
            TaskService.createCheckList(project.projectId, taskId, body),
        onSuccess: (newItem) => {
            setCheckList((prev) => [...prev, newItem]);
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    checkLists: [...(old.checkLists || []), newItem]
                };
            });
            setNewCheckListBody("");
            setIsAddCheckList(false);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const updateCheckListMutation = useMutation({
        mutationFn: ({checkListId, data}: { checkListId: string, data: { body?: string, done?: boolean } }) =>
            TaskService.updateCheckList(project.projectId, taskId, checkListId, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    checkLists: old.checkLists.map(c => {
                        if (c.checkListId === variables?.checkListId) {
                            return data;
                        }
                        return c;
                    })
                }
            })
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const deleteCheckListMutation = useMutation({
        mutationFn: ({checkListId}: { checkListId: string }) =>
            TaskService.deleteCheckList(project.projectId, taskId, checkListId),
        onSuccess: (_, variables) => {
            setCheckList(prev => prev.filter(c => c.checkListId !== variables.checkListId));
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    checkLists: old.checkLists.filter(c => c.checkListId !== variables.checkListId)
                }
            })
        },
        onError: (e) => {
            toast.error(e.message);
        }
    })


    const handleAddCheckList = () => {
        createCheckListMutation.mutate(newCheckListBody);
    };

    const handleDeleteCheckList = (checkListId: string) => {
        deleteCheckListMutation.mutate({checkListId: checkListId});
    };


    //
    useEffect(() => {
        if (task && isOpen) {
            setCompleted(task.completed);
            setTitle(task.title);
            setDescription(task.description);
            setPriority(task.priority);
            setDueAt(task.dueAt);
            setCheckList(task.checkLists)
        }
    }, [task, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setIsEditingTitle(false);
            setIsEditingDescription(false);
        }
    }, [isOpen]);


    if (!isOpen) return null;
    return (
        <Dialog.Root open={isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out
             data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-500"/>
                <div className={"flex items-center justify-between"}>
                    <Dialog.Content
                        aria-describedby={""}
                        className={`fixed right-0 top-0 z-50 h-full w-4/5 max-w-3xl flex flex-col
                               bg-white shadow-2xl overflow-hidden
                               data-[state=open]:animate-in data-[state=closed]:animate-out
                               data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right
                               duration-500 ease-in-out ${isTaskOverdue ? 'shadow-red-500 border-l-1 border-red-500' : ''}`}
                    >
                        <div
                            className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                            <Dialog.Title className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                                Chi tiết nhiệm vụ
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button
                                    onClick={onClose}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100
                                    hover:text-gray-600 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5"/>
                                </button>
                            </Dialog.Close>
                        </div>
                        {isLoading ? <div className="flex-1 flex items-center justify-center p-6">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin"/>
                        </div> : (error ?
                                <div className="flex-1 flex items-center justify-center p-6">
                                <span className={"font-semibold text-red-500"}>
                                    Có lỗi xảy ra</span>
                                </div> :
                                <div className={"overflow-auto"}>
                                    <div className="flex-1 min-h-4/5">
                                        <div className="p-6 space-y-6">
                                            {/* Title & Status */}

                                            <div className="space-y-3">
                                                {isEditingTitle ? <div className="flex-1 flex items-start gap-2">
                                                        <input
                                                            key="editing"
                                                            type="text"
                                                            value={title}
                                                            onChange={(e) => setTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveTitle();
                                                                if (e.key === 'Escape') {
                                                                    setTitle(task.title);
                                                                    setIsEditingTitle(false);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                setIsEditingTitle(false);
                                                                setTitle(task.title);
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            autoFocus
                                                            className="flex-1 text-xl font-semibold text-gray-900
                                                                rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div> :
                                                    <div className="flex items-start gap-3 justify-between">
                                                        <input
                                                            type="checkbox"
                                                            disabled={project.currentRoleInProject === "VIEWER"}
                                                            checked={completed}
                                                            onChange={(e) => {
                                                                setCompleted(e.target.checked);
                                                                updateDoneTaskMutation.mutate(e.target.checked);
                                                            }}
                                                            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600
                                                                focus:ring-blue-500 cursor-pointer"
                                                        />

                                                        <div className={`text-xl group font-semibold flex-1 space-x-3 ${
                                                            completed ? 'line-through text-gray-500' : 'text-gray-900'
                                                        }`}>
                                                            <span>
                                                                {title}
                                                            </span>
                                                            <button onClick={() => setIsEditingTitle(true)}>
                                                                <Edit2
                                                                    className={"h-4 w-4 text-gray-500 cursor-pointer hidden" +
                                                                        `  transition-all ${
                                                                            canManage && !completed ? 'group-hover:block' : ''
                                                                        }`}/>
                                                            </button>
                                                        </div>
                                                        {completed && (
                                                            <span
                                                                className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                                            Hoàn thành
                                                        </span>
                                                        )}
                                                        {isTaskOverdue && (
                                                            <span
                                                                className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                                            Quá hạn
                                                        </span>
                                                        )}
                                                    </div>
                                                }

                                                <div className={"flex items-center gap-5"}>
                                                    {/* Labels */}
                                                    <div className="group flex gap-2 flex-wrap">
                                                        {labels.length === 0 && <button>
                                                            <Tag className={"h-5 w-5"}/>
                                                        </button>}
                                                        {labels.map((label) => (
                                                            <Label label={label} key={label.labelId}>
                                                                <Tag className={"h-4 w-4"}/>
                                                            </Label>
                                                        ))}
                                                        <Popover.Root modal={true}>
                                                            <Popover.Trigger asChild>
                                                                <button disabled={!canManage || task.completed}
                                                                        className="p-1 border border-dashed rounded-full
                                                                 hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                                                    <Plus className="h-4 w-4"/>
                                                                </button>
                                                            </Popover.Trigger>
                                                            <Popover.Portal>
                                                                <Popover.Content
                                                                    className="w-auto bg-white border border-gray-200 rounded-lg shadow-lg
                                                                                    max-h-60 overflow-auto z-50
                                                                                    data-[state=open]:animate-in data-[state=closed]:animate-out
                                                                                    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                                                                    data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                                                                    sideOffset={5}
                                                                >
                                                                    {project.labels
                                                                        .map((l: LabelResponse) => {
                                                                            const isSelected = labels.some(label => label.labelId === l.labelId);
                                                                            return (
                                                                                <button
                                                                                    key={l.labelId}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            handleRemoveLabel(l);
                                                                                        } else {
                                                                                            handleSaveLabel(l);
                                                                                        }
                                                                                    }}
                                                                                    className="w-full flex items-center gap-1 px-3 py-2 text-sm
                                                                                            hover:bg-gray-100 rounded-md transition-colors"
                                                                                >
                                                                                    <div className={`w-4 h-4 flex items-center justify-center 
                                                                                        border-2 rounded ${
                                                                                        isSelected
                                                                                            ? 'bg-blue-600 border-blue-600'
                                                                                            : 'border-gray-300'
                                                                                    }`}>
                                                                                        {isSelected && (
                                                                                            <svg
                                                                                                className="w-3 h-3 text-white"
                                                                                                fill="none"
                                                                                                viewBox="0 0 24 24"
                                                                                                stroke="currentColor">
                                                                                                <path
                                                                                                    strokeLinecap="round"
                                                                                                    strokeLinejoin="round"
                                                                                                    strokeWidth={3}
                                                                                                    d="M5 13l4 4L19 7"/>
                                                                                            </svg>
                                                                                        )}
                                                                                    </div>
                                                                                    <Label label={l}/>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                </Popover.Content>
                                                            </Popover.Portal>
                                                        </Popover.Root>
                                                    </div>


                                                    {/*assignee*/}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 group">
                                                            <div className="flex -space-x-2">
                                                                {project.members.filter(m => task.assigneeIds.includes(m.userId)).map(m => (
                                                                    <Avatar key={m.userId} fullname={m.fullName} className="h-6 w-6 ring-2 ring-white rounded-full" />
                                                                ))}
                                                            </div>
                                                            <Popover.Root modal={true}>
                                                                <Popover.Trigger asChild>
                                                                    <button disabled={!canManage || task.completed}
                                                                            className="p-1 border border-dashed rounded-full
                                                                 hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                                                        <User className="h-4 w-4"/>
                                                                    </button>
                                                                </Popover.Trigger>
                                                                <Popover.Portal>
                                                                    <Popover.Content
                                                                        className="w-auto bg-white border border-gray-200 rounded-lg shadow-lg
                                                                                    max-h-60 overflow-auto z-50
                                                                                    data-[state=open]:animate-in data-[state=closed]:animate-out
                                                                                    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                                                                    data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                                                                        sideOffset={5}
                                                                    >
                                                                        {project.members.length === 0 ? (
                                                                            <div
                                                                                className="text-sm text-gray-500 text-center py-4 px-3">
                                                                                Chưa có thành viên nào
                                                                            </div>
                                                                        ) : (
                                                                            <div className="p-1">
                                                                                {project.members.map((member: ProjectMemberResponse) => {
                                                                                    const isAssigned = assignees.some(a => a.userId === member.userId);
                                                                                    return (
                                                                                        <button
                                                                                            key={member.userId}
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (isAssigned) {
                                                                                                    handleRemoveMembers(member);
                                                                                                } else {
                                                                                                    handleSaveMembers(member);
                                                                                                }
                                                                                            }}
                                                                                            disabled={updateTaskMutation.isPending}
                                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm
                                                                                                   hover:bg-gray-100 rounded-md transition-colors
                                                                                                    disabled:opacity-50"
                                                                                        >
                                                                                            {/* Checkbox */}
                                                                                            <div className={`w-4 h-4 flex items-center justify-center 
                                                                                                            border-2 rounded ${
                                                                                                isAssigned
                                                                                                    ? 'bg-blue-600 border-blue-600'
                                                                                                    : 'border-gray-300'
                                                                                            }`}>
                                                                                                {isAssigned && (
                                                                                                    <svg
                                                                                                        className="w-3 h-3 text-white"
                                                                                                        fill="none"
                                                                                                        viewBox="0 0 24 24"
                                                                                                        stroke="currentColor"
                                                                                                    >
                                                                                                        <path
                                                                                                            strokeLinecap="round"
                                                                                                            strokeLinejoin="round"
                                                                                                            strokeWidth={3}
                                                                                                            d="M5 13l4 4L19 7"
                                                                                                        />
                                                                                                    </svg>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Avatar */}
                                                                                            <Avatar
                                                                                                fullname={member.fullName}
                                                                                                className="h-6 w-6"/>

                                                                                            {/* Info */}
                                                                                            <div
                                                                                                className="flex-1 text-left">
                                                                                                <div
                                                                                                    className="font-medium text-gray-900">
                                                                                                    {member.fullName}
                                                                                                </div>
                                                                                                <div
                                                                                                    className="text-xs text-gray-500">
                                                                                                    {member.email}
                                                                                                </div>
                                                                                            </div>
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </Popover.Content>
                                                                </Popover.Portal>
                                                            </Popover.Root>

                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="space-y-2 group">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className={"h-4 w-4"}/>
                                                        <h3 className="text-sm font-semibold text-gray-700">Mô tả</h3>
                                                        {canManage && !completed && (
                                                            <button onClick={() => setIsEditingDescription(true)}>
                                                                <Edit2
                                                                    className={"h-4 w-4 text-gray-500 cursor-pointer hidden" +
                                                                        `  transition-all ${
                                                                            canManage && !completed ? 'group-hover:block' : ''
                                                                        }`}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {isEditingDescription ?
                                                        <textarea
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveDes();
                                                                if (e.key === 'Escape') {
                                                                    setDescription(task.description);
                                                                    setIsEditingDescription(false);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                setDescription(task.description);
                                                                setIsEditingDescription(false);
                                                            }}
                                                            autoFocus
                                                            onFocus={(e) => e.target.select()}
                                                            disabled={updateTaskMutation.isPending}
                                                            placeholder="Thêm mô tả cho nhiệm vụ..."
                                                            className="w-full min-h-[100px] px-3 py-2 text-sm text-gray-900
                                                                       border-2 border-blue-500 rounded-lg resize-y
                                                                       focus:outline-none focus:ring-2 focus:ring-blue-500
                                                                        disabled:opacity-50"
                                                        />
                                                        :
                                                        <div
                                                            className="min-h-[80px] px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            {description ? (
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                    {description}
                                                                </p>
                                                            ) : (
                                                                <p className="text-sm text-gray-400 italic">
                                                                    Chưa có mô tả
                                                                </p>
                                                            )}
                                                        </div>}
                                                </div>

                                                {/* Meta Info Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Priority */}
                                                    <div className="space-y-2">
                                                        <label
                                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <Flag className="h-4 w-4"/>
                                                            Độ ưu tiên
                                                        </label>

                                                        <Select.Root
                                                            value={priority}
                                                            onValueChange={(value) => handleSavePriority(value)}
                                                            disabled={!canManage || completed || updateTaskMutation.isPending}
                                                        >
                                                            <Select.Trigger
                                                                className={`w-full px-3 py-2 text-sm font-medium rounded-lg border
                                                                flex items-center justify-between transition-all
                                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                                hover:opacity-80 ${getPriorityColor(priority)}`}
                                                            >
                                                                <Select.Value>{priority}</Select.Value>
                                                                <Select.Icon>
                                                                    <ChevronDown className="h-4 w-4"/>
                                                                </Select.Icon>
                                                            </Select.Trigger>

                                                            <Select.Portal>
                                                                <Select.Content
                                                                    className="bg-white rounded-lg border border-gray-200 shadow-lg
                                                                                overflow-hidden z-50"
                                                                    position="popper"
                                                                    sideOffset={5}
                                                                >
                                                                    <Select.Viewport className="p-1">
                                                                        <Select.Item
                                                                            value="LOW"
                                                                            className="px-3 py-2 text-sm rounded-md cursor-pointer
                                                                                    hover:bg-gray-100 outline-none flex items-center justify-between"
                                                                        >
                                                                            <Select.ItemText>
                                                                                <span
                                                                                    className={`px-2 py-1 rounded font-medium ${getPriorityColor("LOW")}`}>
                                                                                    Low
                                                                                </span>
                                                                            </Select.ItemText>
                                                                            <Select.ItemIndicator>
                                                                                <Check
                                                                                    className="h-4 w-4 text-blue-600"/>
                                                                            </Select.ItemIndicator>
                                                                        </Select.Item>

                                                                        <Select.Item
                                                                            value="MEDIUM"
                                                                            className="px-3 py-2 text-sm rounded-md cursor-pointer
                                                                                        hover:bg-gray-100 outline-none flex items-center justify-between"
                                                                        >
                                                                            <Select.ItemText>
                                                                                <span
                                                                                    className={`px-2 py-1 rounded font-medium ${getPriorityColor("MEDIUM")}`}>
                                                                                    Medium
                                                                                </span>
                                                                            </Select.ItemText>
                                                                            <Select.ItemIndicator>
                                                                                <Check
                                                                                    className="h-4 w-4 text-blue-600"/>
                                                                            </Select.ItemIndicator>
                                                                        </Select.Item>

                                                                        <Select.Item
                                                                            value="HIGH"
                                                                            className="px-3 py-2 text-sm rounded-md cursor-pointer
                                                                                        hover:bg-gray-100 outline-none flex items-center justify-between"
                                                                        >
                                                                            <Select.ItemText>
                                                                                <span
                                                                                    className={`px-2 py-1 rounded font-medium ${getPriorityColor("HIGH")}`}>
                                                                                     High
                                                                                </span>
                                                                            </Select.ItemText>
                                                                            <Select.ItemIndicator>
                                                                                <Check
                                                                                    className="h-4 w-4 text-blue-600"/>
                                                                            </Select.ItemIndicator>
                                                                        </Select.Item>
                                                                    </Select.Viewport>
                                                                </Select.Content>
                                                            </Select.Portal>
                                                        </Select.Root>
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="space-y-2">
                                                        <label
                                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <Calendar className="h-4 w-4"/>
                                                            Hạn hoàn thành
                                                        </label>

                                                        <input
                                                            type="date"
                                                            min={new Date().toISOString().split('T')[0]}
                                                            value={dueAt ? new Date(dueAt).toISOString().split("T")[0] : ""}
                                                            onChange={handleSaveDueDate}
                                                            disabled={!canManage || completed || updateTaskMutation.isPending}
                                                            className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50
                                                                       border border-gray-300 rounded-lg
                                                                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                                       disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </div>

                                                    {/*Creator*/}
                                                    <div className="space-y-2">
                                                        <label
                                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <User className="h-4 w-4"/>
                                                            Người tạo
                                                        </label>
                                                        <div
                                                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                                            <Avatar fullname={creator?.fullName} className="h-5 w-5"/>
                                                            <span
                                                                className="text-sm text-gray-900">{creator?.fullName}</span>
                                                        </div>
                                                    </div>

                                                    {/*createdAt*/}
                                                    <div className="space-y-2">
                                                        <label
                                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <Clock className="h-4 w-4"/>
                                                            Ngày tạo
                                                        </label>
                                                        <div
                                                            className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900">
                                                            {formatDateLocalDate(task.createdAt)}
                                                        </div>
                                                    </div>

                                                    {/*updatedAt*/}
                                                    <div className="space-y-2">
                                                        <label
                                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <Clock className="h-4 w-4"/>
                                                            Cập nhật lần cuối
                                                        </label>
                                                        <div
                                                            className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900">
                                                            {formatDateLocalDate(task.updatedAt)}
                                                        </div>
                                                    </div>

                                                </div>

                                                {/*checklist*/}
                                                <div className={"space-y-2"}>
                                                    <div className={"group flex items-center gap-2"}>
                                                        <label
                                                            className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                            <ListCheck className="h-4 w-4"/>
                                                            Danh sách công việc
                                                        </label>
                                                        {checkList.length > 0 && (
                                                            <span className="text-sm text-gray-500 font-medium">
                                                            {completedCheckLists}/{checkList.length}
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAddCheckList(true)}
                                                            className={`inline-flex items-center px-3 py-1
                                                                                text-sm text-gray-600 border border-dashed border-gray-300
                                                                                rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors
                                                                                ${(project.currentRoleInProject !== "VIEWER" && !completed) ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}
                                                                                `}
                                                        >
                                                            <Plus className="h-4 w-4"/>
                                                        </button>
                                                    </div>
                                                    {/* Progress bar */}
                                                    {checkList.length > 0 && (
                                                        <div className="relative max-w-sm bg-gray-200 rounded-full h-3">
                                                            <div
                                                                className="bg-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-center"
                                                                style={{width: `${(completedCheckLists / checkList.length) * 100}%`}}
                                                            >
                                                                <span className="text-xs font-medium text-white">
                                                                    {Math.round((completedCheckLists / checkList.length) * 100)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {isAddCheckList && (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={newCheckListBody}
                                                                onChange={(e) => setNewCheckListBody(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddCheckList()}
                                                                autoFocus
                                                                placeholder="Thêm checklist..."
                                                                className="flex-1 px-2 py-1 max-w-sm text-sm border rounded focus:ring-1 focus:ring-blue-500"
                                                            />
                                                            <button
                                                                disabled={createCheckListMutation.isPending || !newCheckListBody.trim()}
                                                                onClick={handleAddCheckList}
                                                                className="p-1.5 cursor-pointer hover:bg-green-50 rounded text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <Check className="h-4 w-4"/>
                                                            </button>
                                                            <button
                                                                disabled={createCheckListMutation.isPending}
                                                                onClick={() => setIsAddCheckList(false)}
                                                                className="p-1.5 hover:bg-red-50 cursor-pointer rounded text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <X className="h-4 w-4"/>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {checkList.map(c => {
                                                        return (
                                                            <div key={c.checkListId}
                                                                 className={"flex items-center gap-2 group"}>
                                                                <input
                                                                    disabled={completed || project.currentRoleInProject === "VIEWER"}
                                                                    checked={c.done}
                                                                    onChange={(e) => {
                                                                        updateCheckListMutation.mutate({
                                                                            checkListId: c.checkListId,
                                                                            data: {done: e.target.checked}
                                                                        });
                                                                    }}
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600
                                                                cursor-pointer"
                                                                />
                                                                <span
                                                                    className={`text-sm ${c.done || completed ? "line-through text-gray-500" : "text-gray-900"}`}>{c.body}</span>
                                                                {project.currentRoleInProject !== "VIEWER" && !completed && (
                                                                    <button
                                                                        onClick={() => handleDeleteCheckList(c.checkListId)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
                                                                    >
                                                                        <X className="h-4 w-4"/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <TaskComments
                                                    taskId={taskId}
                                                    comments={task.comments}
                                                />

                                            </div>
                                        </div>
                                    </div>
                                </div>
                        )}
                    </Dialog.Content>

                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}


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
    })

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        createCommentMutation.mutate(newComment.trim());
    };

    return (
        <div className="space-y-3 min-h-100">
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
                                    control: {
                                        fontSize: 14,
                                    },
                                    "&multiLine": {
                                        control: {
                                            minHeight: 80
                                        },
                                        highlighter: {
                                            padding: 9,
                                            border: "1px solid transparent",
                                        },
                                        input: {
                                            padding: 9,
                                            border: "1px solid silver",
                                            borderRadius: "0.5rem",
                                            lineHeight: 1.5
                                        }
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
                                        item: {
                                            padding: "5px 15px",
                                            "&focused": {
                                                backgroundColor: "#eff6ff"
                                            }
                                        }
                                    },
                                }}>
                                <Mention
                                    className={"bg-blue-100"}
                                    trigger="@"
                                    data={mentionData}
                                    displayTransform={(_, display) => `@${display}`}
                                    markup="@[__display__](__id__)"
                                    renderSuggestion={(suggestion: any, _, highlightedDisplay) => (
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                fullname={suggestion.display}
                                                className="h-6 w-6"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm text-gray-900 ">
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
                    ) :
                    (
                        <button
                            hidden={project.currentRoleInProject === "VIEWER"}
                            onClick={() => setIsAddingComment(true)}
                            className="w-full px-3 py-2 text-sm text-left text-gray-500 border border-dashed rounded-lg
                            hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            Thêm bình luận...
                        </button>
                    )
                }
            </div>

            {/* Comments list */
            }
            {
                comments.length > 0 ? (
                    <div className="space-y-3">
                        {comments.map(comment => {
                            return <CommentItem
                                key={comment.commentId}
                                comment={comment}
                                onDelete={deleteCommentMutation.mutate}
                                isLoading={deleteCommentMutation.isPending || updateCommentMutation.isPending}
                                onUpdate={updateCommentMutation.mutate}
                                isError={updateCommentMutation.isError}
                            />
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-gray-400">
                        Chưa có bình luận nào
                    </div>
                )
            }
        </div>
    )
        ;
};

interface CommentItemProps {
    comment: CommentResponse,
    onDelete: (commentId: string) => void,
    onUpdate: ({commentId, body}: { commentId: string, body: string }) => void,
    isLoading?: boolean,
    isError?: boolean
}

const CommentItem: React.FC<CommentItemProps> = ({
                                                     comment, onDelete, onUpdate, isLoading,
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
        () => project.members.find((m: ProjectMemberResponse) => m.userId === comment.creatorId)
        , [comment.creatorId, project.members]);

    const handleUpdateComment = () => {
        if (!newBody.trim()) return;
        onUpdate({commentId: comment.commentId, body: newBody});
        if (!isError) {
            setIsEdit(false);
        } else {
            setNewBody(comment.body);
        }
    }

    const menuItems: MenuItem[] = [
        {
            label: "Chỉnh sửa",
            icon: <Edit className={"h-4 w-4"}/>,
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
            icon: <Trash2 className={"h-4 w-4"}/>,
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
        <div className={"group"}>
            <ContextMenu
                items={menuItems}
                trigger={"both"}
                showButton={userCurrentId === comment.creatorId && !isEdit}
                buttonClassName={"md:group-hover:opacity-100 md:opacity-0 top-0 right-0"}
            >
                <div
                    className="flex w-19/20 gap-3 items-start group-hover:bg-gray-50 px-3 py-1 rounded-lg transition-colors">
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
                        {isEdit ?
                            <div className={"space-y-2"}>
                                <MentionsInput
                                    className={"mentions"}
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
                                        control: {
                                            fontSize: 14,
                                        },
                                        "&multiLine": {
                                            control: {
                                                minHeight: 80
                                            },
                                            highlighter: {
                                                padding: 9,
                                                border: "1px solid transparent",
                                            },
                                            input: {
                                                padding: 9,
                                                border: "1px solid silver",
                                                borderRadius: "0.5rem",
                                                lineHeight: 1.5
                                            }
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
                                            item: {
                                                padding: "5px 15px",
                                                "&focused": {
                                                    backgroundColor: "#eff6ff"
                                                }
                                            }
                                        },
                                    }}>
                                    <Mention
                                        className={"bg-blue-100"}
                                        trigger="@"
                                        data={mentionData}
                                        displayTransform={(_, display) => `@${display}`}
                                        markup="@[__display__](__id__)"
                                        renderSuggestion={(suggestion: any, _, highlightedDisplay) => (
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    fullname={suggestion.display}
                                                    className="h-6 w-6"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-gray-900 ">
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
                                        {isLoading && (
                                            <Loader2 className="h-3 w-3 animate-spin"/>
                                        )}
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
                            :
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">
                                    {renderContent(comment.body, project.members)}
                                </p>
                            </div>
                        }
                    </div>
                </div>
            </ContextMenu>
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