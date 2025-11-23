import {BoardColumnResponse, ProjectDetailResponse} from "@features/projects/types/project.types";
import React, {useState} from "react";
import {Draggable, Droppable} from "@hello-pangea/dnd";
import {Archive, Check, Edit, Plus, PlusCircle, Trash2, X} from "lucide-react";
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useConfirm} from "@components/ConfirmDialog";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {TaskCard} from "@features/projects/components/kanban/TaskCard";
import {AddTaskModal} from "@features/projects/components/kanban/AddTaskModal";
import {useOutletContext} from "react-router-dom";
import {TaskResponse} from "@features/projects/types/task.types";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";

interface ColumnProps {
    column: BoardColumnResponse;
    tasks: TaskResponse[];
    index: number;
}

export const Column: React.FC<ColumnProps> = ({column, tasks, index}) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(column.name);
    const confirm = useConfirm();

    const updateColumnMutation = useMutation({
        mutationFn: (data: { name: string }) =>
            ProjectService.updateColumn(column.projectId, column.boardColumnId, data),
        onSuccess: (data: BoardColumnResponse) => {
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: old.boardColumns.map((c: BoardColumnResponse) =>
                        c.boardColumnId === column.boardColumnId ? data : c
                    )
                }));
            setIsEditing(false);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const deleteColumnMutation = useMutation({
        mutationFn: () =>
            ProjectService.deleteColumn(column.projectId, column.boardColumnId),
        onSuccess: () => {
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: old.boardColumns.filter((c: BoardColumnResponse) =>
                        c.boardColumnId !== column.boardColumnId)
                }));
            queryClient.setQueryData(["tasks", column.projectId], (old: TaskResponse[]) => {
                return old?.filter(t => t.boardColumnId !== column.boardColumnId) || [];
            });
            setIsEditing(false);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const restoreColumnMutation = useMutation({
        mutationFn: () =>
            ProjectService.restoreColumn(column.projectId, column.boardColumnId, column.sortOrder),
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const archiveColumnMutation = useMutation({
        mutationFn: () =>
            ProjectService.archiveColumn(column.projectId, column.boardColumnId),
        onMutate: () => {
            const previousData = queryClient.getQueryData(["projectDetails", column.projectId]);
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: old.boardColumns.filter((c: BoardColumnResponse) =>
                        c.boardColumnId !== column.boardColumnId)
                }));
            return {previousData};
        },
        onSuccess: (_, __, onMutateResult) => {
            let isRestored = false;
            const cleanupTimer = setTimeout(() => {
                if (!isRestored) {
                    queryClient.setQueryData(["tasks", column.projectId], (old: TaskResponse[]) => {
                        return old?.filter(t => t.boardColumnId !== column.boardColumnId) || [];
                    });
                }
            }, 5010);

            toast.success(
                (t) => (
                    <span className="flex items-center gap-3">
                        <span>Đã lưu trữ "{column.name}"</span>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);
                                isRestored = true;
                                clearTimeout(cleanupTimer);
                                if (onMutateResult?.previousData) {
                                    await restoreColumnMutation.mutateAsync();
                                    queryClient.setQueryData(["projectDetails", column.projectId],
                                        onMutateResult.previousData);
                                }
                            }}
                            className="px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
                        >
                            Hoàn tác
                        </button>
                    </span>
                ),
                {duration: 5000}
            );
        },
        onError: (err, _, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["projectDetails", column.projectId], context.previousData);
            }
            toast.error(err.message);
        }
    });

    const menuItems: MenuItem[] = [
        {
            label: 'Chỉnh sửa',
            icon: <Edit className="h-4 w-4"/>,
            onClick: () => setIsEditing(true),
        },
        {
            label: "Thêm nhiệm vụ",
            icon: <PlusCircle className={"h-4 w-4"}/>,
            onClick: () => {
                setOpenAddTaskModal(true);
            }
        },
        {
            divider: true, label: '', onClick: () => {
            }
        },
        {
            label: "Lưu trữ",
            icon: <Archive className="h-4 w-4"/>,
            onClick: () => archiveColumnMutation.mutate()
        },
        {
            label: 'Xóa',
            icon: <Trash2 className="h-4 w-4"/>,
            onClick: async () => {
                const confirmed = await confirm({
                    title: 'Xóa?',
                    description: `Bạn có chắc chắn muốn xóa cột "${column.name}"?`,
                    warningText: "Tất cả nhiệm vụ sẽ bị xóa hết.",
                    confirmText: 'Xóa',
                    isLoading: deleteColumnMutation.isPending,
                    type: 'danger',
                });
                if (confirmed) {
                    deleteColumnMutation.mutate();
                }
            },
            danger: true,
        },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateColumnMutation.mutate({name: editName});
    };

    const handleCancel = () => {
        setEditName(column.name);
        setIsEditing(false);
    };

    const [openAddTaskModal, setOpenAddTaskModal] = useState(false);

    return (
        <>
            <AddTaskModal
                open={openAddTaskModal}
                onOpenChange={setOpenAddTaskModal}
                columnId={column.boardColumnId}
            />

            <Draggable draggableId={column.boardColumnId} index={index}
                       isDragDisabled={project.currentRoleInProject !== "OWNER"}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex flex-col flex-shrink-0 w-90 bg-white rounded-xl border-2 ${
                            snapshot.isDragging
                                ? 'shadow-2xl opacity-50 border-blue-400'
                                : 'border-gray-200'
                        }`}
                        style={{
                            ...provided.draggableProps.style,
                        }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-4 py-3">
                            {isEditing ? (
                                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={!editName.trim() || updateColumnMutation.isPending}
                                        className="p-1 cursor-pointer disabled:cursor-no-drop text-green-600 hover:bg-green-50 rounded"
                                    >
                                        <Check className="h-4 w-4"/>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updateColumnMutation.isPending}
                                        onClick={handleCancel}
                                        className="p-1 cursor-pointer text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <X className="h-4 w-4"/>
                                    </button>
                                </form>
                            ) : (
                                <div {...provided.dragHandleProps}
                                     className={`${project.currentRoleInProject === "OWNER" && 'cursor-grab'}`}>
                                    <ContextMenu
                                        items={menuItems}
                                        trigger="click"
                                        showButton={project.currentRoleInProject === "OWNER"}
                                        buttonClassName="hover:bg-gray-300"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-semibold text-gray-900 flex-1">
                                                {column.name}
                                            </h4>
                                        </div>
                                    </ContextMenu>
                                </div>
                            )}
                        </div>

                        {/* Tasks List */}
                        <Droppable droppableId={column.boardColumnId} direction={"vertical"} type="TASK">
                            {(provided, snapshot) => {
                                return (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`transition-colors ${
                                            snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className={`flex-1 p-3 space-y-3`}>
                                            {tasks.map((task, index) => (
                                                <Draggable
                                                    key={task.taskId}
                                                    draggableId={task.taskId}
                                                    index={index}
                                                    isDragDisabled={project.currentRoleInProject === "VIEWER" || project.currentRoleInProject === "COMMENTER"}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                cursor: (project.currentRoleInProject === "VIEWER" ||
                                                                    project.currentRoleInProject === "COMMENTER") ? "default" : "grab"
                                                            }}
                                                            className={`transition-shadow cursor-grab ${
                                                                snapshot.isDragging ? 'shadow-2xl' : ''
                                                            }`}
                                                        >
                                                            <TaskCard task={task}/>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>

                                        {tasks.length === 0 && !snapshot.isDraggingOver && (
                                            <div className="text-center py-8 text-gray-400 text-sm">
                                                Chưa có nhiệm vụ nào
                                            </div>
                                        )}
                                    </div>
                                )
                            }}
                        </Droppable>

                        {/* Add Task Button */}
                        {['OWNER', 'EDITOR'].includes(project.currentRoleInProject) && (
                            <div className="flex-shrink-0 w-full p-4 border-t border-gray-100">
                                <button
                                    onClick={() => setOpenAddTaskModal(true)}
                                    className="w-full cursor-pointer h-10 bg-white/50 hover:bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl transition-all group"
                                >
                                    <div className="flex flex-row items-center justify-center gap-2">
                                        <Plus
                                            className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors"/>
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">
                                            Thêm nhiệm vụ
                                        </span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Draggable>
        </>
    );
};