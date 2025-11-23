import React, {useEffect, useMemo, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {BoardColumnResponse, ProjectDetailResponse} from "@features/projects/types/project.types";
import {DragDropContext, Droppable, type DropResult} from "@hello-pangea/dnd";
import {Column} from "./Column";
import {Check, Plus, X} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {TaskService} from "@features/projects/services/TaskService";
import {TaskResponse} from "@features/projects/types/task.types";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {arrayMoveImmutable as arrayMove} from 'array-move';


export const ProjectKanban: React.FC = () => {
    const queryClient = useQueryClient();
    const {projectDetail: project, allTasks, filteredKanbanTasks} = useOutletContext<ProjectDetailContext>();

    // State cột
    const [sortColumns, setSortColumns] = useState<BoardColumnResponse[]>([]);
    const [taskColumns, setTaskColumns] = useState<Record<string, TaskResponse[]>>({});


    // Organize tasks by column
    useEffect(() => {
        const columnsMap: Record<string, TaskResponse[]> = {};
        for (const column of sortColumns) {
            columnsMap[column.boardColumnId] = [];
        }
        if (!filteredKanbanTasks) return;
        for (const task of filteredKanbanTasks) {
            if (columnsMap[task.boardColumnId]) {
                columnsMap[task.boardColumnId].push(task);
            }
        }
        for (const columnId in columnsMap) {
            columnsMap[columnId].sort((a, b) => a.sortOrder - b.sortOrder);
        }
        setTaskColumns(columnsMap);
    }, [sortColumns, filteredKanbanTasks]);

    // Sort columns
    useEffect(() => {
        if (project.boardColumns) {
            setSortColumns([...project.boardColumns].sort((a, b) => a.sortOrder - b.sortOrder));
        }
    }, [project.boardColumns]);

    const canManage = useMemo(() => {
        return project.currentRoleInProject === "OWNER";
    }, [project.currentRoleInProject]);

    // Mutations
    const createColumnMutation = useMutation({
        mutationFn: () => ProjectService.createColumn(project.projectId, newName),
        onSuccess: (data: BoardColumnResponse) => {
            queryClient.setQueryData(["projectDetails", project.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: [...old.boardColumns, data]
                }));
            toast.success("Thêm thành công");
            setIsAdding(false);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const updateColumnMutation = useMutation({
        mutationFn: (data: { columnId: string, newSortOrder: number }) =>
            ProjectService.updateColumn(project.projectId, data.columnId, {sortOrder: data.newSortOrder}),
        onMutate: async (data) => {
            await queryClient.cancelQueries({queryKey: ["projectDetails", project.projectId]});
            const previousData = queryClient.getQueryData(["projectDetails", project.projectId]);

            queryClient.setQueryData(["projectDetails", project.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: old.boardColumns.map((c: BoardColumnResponse) =>
                        c.boardColumnId === data.columnId
                            ? {...c, sortOrder: data.newSortOrder}
                            : c
                    )
                }));

            return {previousData};
        },
        onError: (err, _, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["projectDetails", project.projectId], context.previousData);
            }
            toast.error(err.message);
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: (data: { taskId: string, boardColumnId: string, newSortOrder: number }) =>
            TaskService.moveTask(project.projectId, data.taskId, {
                boardColumnId: data.boardColumnId,
                sortOrder: data.newSortOrder
            }),
        onMutate: async (data) => {
            await queryClient.cancelQueries({queryKey: ["tasks", project.projectId]});
            const previousData = queryClient.getQueryData(["tasks", project.projectId]);

            queryClient.setQueryData(["tasks", project.projectId],
                (old: TaskResponse[]) =>
                    old?.map((t: TaskResponse) =>
                        t.taskId === data.taskId
                            ? {...t, boardColumnId: data.boardColumnId, sortOrder: data.newSortOrder}
                            : t
                    ) || []
            );

            return {previousData};
        },
        onError: (err, _, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["tasks", project.projectId], context.previousData);
            }
            toast.error(err.message);
        }
    });

    //tính toán sortOrder
    const calculateSortOrderWithFilter = (
        movedTask: TaskResponse,
        destColumnId: string,
        destIndexInFilteredList: number
    ): number => {
        const tasksToUse = allTasks || []
        const visibleTasksInDestColumn = taskColumns[destColumnId] || [];

        let newVisibleList = [...visibleTasksInDestColumn];

        if (movedTask.boardColumnId === destColumnId) {
            newVisibleList = newVisibleList.filter(t => t.taskId !== movedTask.taskId);
        }
        newVisibleList.splice(destIndexInFilteredList, 0, movedTask);

        const visibleNeighborBefore = newVisibleList[destIndexInFilteredList - 1];
        const visibleNeighborAfter = newVisibleList[destIndexInFilteredList + 1];

        const allTasksInDestColumn = tasksToUse
            .filter((t: TaskResponse) => t.boardColumnId === destColumnId && t.taskId !== movedTask.taskId)
            .sort((a: TaskResponse, b: TaskResponse) => a.sortOrder - b.sortOrder);

        let lowerBound;
        let upperBound;

        if (visibleNeighborAfter) {
            upperBound = allTasksInDestColumn.find((t: TaskResponse) => t.taskId === visibleNeighborAfter.taskId)?.sortOrder;
            const upperBoundIndex = allTasksInDestColumn.findIndex((t: TaskResponse) => t.taskId === visibleNeighborAfter.taskId);
            if (allTasksInDestColumn[upperBoundIndex - 1]) {
                lowerBound = allTasksInDestColumn[upperBoundIndex - 1].sortOrder;
            } else {
                lowerBound = 0;
            }
        } else if (visibleNeighborBefore) {
            lowerBound = allTasksInDestColumn.find((t: TaskResponse) => t.taskId === visibleNeighborBefore.taskId)?.sortOrder;
            const lowerBoundIndex = allTasksInDestColumn.findIndex((t: TaskResponse) => t.taskId === visibleNeighborBefore.taskId);
            if (allTasksInDestColumn[lowerBoundIndex + 1]) {
                upperBound = allTasksInDestColumn[lowerBoundIndex + 1].sortOrder;
            } else {
                return Math.ceil(lowerBound) + 1;
            }
        } else {
            const last = allTasksInDestColumn[allTasksInDestColumn.length - 1];
            if (last) {
                return Math.ceil(last.sortOrder) + 1;
            } else {
                return 1;
            }
        }
        return (lowerBound + upperBound) / 2;
    };


    const onDragEnd = (result: DropResult) => {
        const {destination, draggableId, source, type} = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        if (type === 'COLUMN') {
            const reorderedColumns = arrayMove(sortColumns, source.index, destination.index);
            setSortColumns(reorderedColumns);

            const movedColumn = reorderedColumns[destination.index];
            const prevSortOrder = reorderedColumns[destination.index - 1]?.sortOrder || 0;
            const nextSortOrder = reorderedColumns[destination.index + 1]?.sortOrder;

            let newSortOrder;
            if (nextSortOrder !== undefined) {
                newSortOrder = (prevSortOrder + nextSortOrder) / 2;
            } else {
                newSortOrder = Math.ceil(prevSortOrder) + 1;
            }
            updateColumnMutation.mutate({
                columnId: movedColumn.boardColumnId,
                newSortOrder: newSortOrder
            });
            return;
        }

        const sourceColumnId = source.droppableId;
        const destColumnId = destination.droppableId;
        const destIndex = destination.index;

        const tasksToUse = allTasks || [];
        const movedTask = tasksToUse.find((t: TaskResponse) => t.taskId === draggableId);
        if (!movedTask) return;

        const newSortOrder = calculateSortOrderWithFilter(movedTask, destColumnId, destIndex);
        setTaskColumns(prev => {
            const sourceTasks = [...(prev[sourceColumnId] || [])].filter(t => t.taskId !== movedTask.taskId);
            const destTasks = [...(prev[destColumnId] || [])].filter(t => t.taskId !== movedTask.taskId);

            const updatedMovedTask = {...movedTask, sortOrder: newSortOrder, boardColumnId: destColumnId};
            destTasks.splice(destIndex, 0, updatedMovedTask);

            return {
                ...prev,
                [sourceColumnId]: sourceTasks,
                [destColumnId]: destTasks
            };
        });

        updateTaskMutation.mutate({
            taskId: movedTask.taskId,
            boardColumnId: destColumnId,
            newSortOrder: newSortOrder
        });
    };

    // Add column
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        createColumnMutation.mutate();
    };

    const handleCancel = () => {
        setNewName("");
        setIsAdding(false);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
                {(provided) => (
                    <div
                        className="flex h-full gap-4 p-3 items-start overflow-auto"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {sortColumns.map((column, index) => (
                            <Column
                                key={column.boardColumnId}
                                column={column}
                                tasks={taskColumns[column.boardColumnId] || []}
                                index={index}
                            />
                        ))}
                        {provided.placeholder}
                        {canManage && (
                            isAdding ? (
                                <div
                                    className="flex-shrink-0 cursor-default w-80 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-4 py-3">
                                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newName.trim() || createColumnMutation.isPending}
                                                className="p-1 cursor-pointer disabled:cursor-no-drop text-green-600 hover:bg-green-50 rounded"
                                            >
                                                <Check className="h-4 w-4"/>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                disabled={createColumnMutation.isPending}
                                                className="p-1 cursor-pointer text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <X className="h-4 w-4"/>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-shrink-0 w-80 mr-10">
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="w-full cursor-pointer h-32 bg-white/50 hover:bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl transition-all group"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Plus
                                                className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors"/>
                                            <span
                                                className="text-sm font-medium text-gray-500 group-hover:text-blue-600">
                                                        Thêm cột mới
                                                    </span>
                                        </div>
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};