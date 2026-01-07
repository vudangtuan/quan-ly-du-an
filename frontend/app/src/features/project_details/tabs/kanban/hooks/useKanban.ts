import type {BoardColumnResponse, ProjectDetailResponse, TaskResponse} from "@/shared/types";
import {useCallback, useEffect, useRef, useState} from "react";
import {
    closestCenter, closestCorners,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    type Modifier,
    PointerSensor, useSensor,
    useSensors
} from "@dnd-kit/core";
import {arrayMove} from "@dnd-kit/sortable";
import {restrictToHorizontalAxis, restrictToWindowEdges} from "@dnd-kit/modifiers";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService, TaskService} from "@/shared/services";
import toast from "react-hot-toast";


const covertMapColumnsTask = (tasks: TaskResponse[], columns: BoardColumnResponse[]) => {
    const columnsMap: Record<string, TaskResponse[]> = {};
    for (const column of columns) {
        columnsMap[column.boardColumnId] = [];
    }
    for (const task of tasks) {
        if (columnsMap[task.boardColumnId]) {
            columnsMap[task.boardColumnId].push(task);
        }
    }
    for (const columnId in columnsMap) {
        columnsMap[columnId].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return columnsMap;
}

export const useKanban = (
    initialTasks: TaskResponse[],
    initialColumns: BoardColumnResponse[],
    allTasks: TaskResponse[]) => {
    const [columns, setColumns] = useState<BoardColumnResponse[]>([]);
    const [tasksColumn, setTasksColumn] = useState<Record<string, TaskResponse[]>>({});
    const queryClient = useQueryClient();

    const tasksColumnSnapshotRef = useRef<Record<string, TaskResponse[]> | null>(null);
    const columnsSnapshotRef = useRef<BoardColumnResponse[]>([]);

    const isDraggingRef = useRef(false);
    const frameRef = useRef<number | null>(null);
    const pendingUpdateRef = useRef<DragOverEvent | null>(null);

    const [activeItem, setActiveItem] = useState<BoardColumnResponse | TaskResponse | null>(null);
    const [activeType, setActiveType] = useState<"COLUMN" | "TASK" | null>(null);

    const updateColumnMutation = useMutation({
        mutationFn: (data: { column: BoardColumnResponse, newSortOrder: number }) =>
            ProjectService.updateColumn(data.column.projectId, data.column.boardColumnId, {sortOrder: data.newSortOrder}),
        onError: (err) => {
            toast.error(err.message);
            if (columnsSnapshotRef.current) {
                setColumns(columnsSnapshotRef.current);
            }
        },
        onSuccess: (bc) => {
            const newColumns = columns.map((column: BoardColumnResponse) => {
                if (column.boardColumnId === bc.boardColumnId) return bc;
                return column;
            })
            queryClient.setQueryData(["projectDetails", bc.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: newColumns,
                }));
            setColumns(newColumns);
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: (data: { task: TaskResponse, boardColumnId: string, newSortOrder: number }) =>
            TaskService.moveTask(data.task.projectId, data.task.taskId, {
                boardColumnId: data.boardColumnId,
                sortOrder: data.newSortOrder
            }),
        onError: (err) => {
            if (tasksColumnSnapshotRef.current) {
                setTasksColumn(tasksColumnSnapshotRef.current);
            }
            toast.error(err.message);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["tasks", data.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === data.taskId ? data : o)
            );
        }
    });
    const calculateSortOrderWithFilter = (
        movedTask: TaskResponse,
        visibleTasksInDestColumn: TaskResponse[],
        destColumnId: string
    ): number => {
        const tasksToUse = allTasks || []

        const newVisibleList = [...visibleTasksInDestColumn];
        const destIndexInFilteredList = newVisibleList.findIndex(t => t.taskId === movedTask.taskId);


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
                return Math.ceil(lowerBound!) + 1;
            }
        } else {
            const last = allTasksInDestColumn[allTasksInDestColumn.length - 1];
            if (last) {
                return Math.ceil(last.sortOrder) + 1;
            } else {
                return 1;
            }
        }
        return (lowerBound! + upperBound!) / 2;
    };

    useEffect(() => {
        if (!isDraggingRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setColumns(initialColumns);
            setTasksColumn(covertMapColumnsTask(initialTasks, initialColumns));
        }
    }, [initialColumns, initialTasks]);

    const onDragStart = (event: DragStartEvent) => {
        const {active} = event;
        if (active.data.current?.task) {
            setActiveType("TASK");
            setActiveItem(active.data.current.task);
        }
        if (active.data.current?.column) {
            setActiveType("COLUMN");
            setActiveItem(active.data.current.column);
        }
        tasksColumnSnapshotRef.current = {...tasksColumn};
        columnsSnapshotRef.current = [...columns];
        isDraggingRef.current = true;
    }

    const processDragOver = (event: DragOverEvent) => {
        const {active, over} = event;

        if (!over || !active.data.current?.task) return;

        const activeId = active.id as string;
        const overId = over?.id as string;

        if (activeId === overId) return;

        setTasksColumn(prevData => {
            const activeTask = active.data.current?.task as TaskResponse;
            const activeColumnId = activeTask.boardColumnId;
            const activeIndex = prevData[activeColumnId]?.findIndex(t => t.taskId === activeId);
            if (!activeColumnId || activeIndex < 0) return prevData;

            let overColumnId: string;
            let overIndex: number;

            if (Object.keys(tasksColumn).includes(overId)) {
                overColumnId = overId;
                overIndex = prevData[overId].length;
            } else {
                const overTask = over.data.current?.task as TaskResponse;
                overColumnId = overTask.boardColumnId;
                overIndex = prevData[overColumnId].findIndex(t => t.taskId === overId);
            }

            if (!overColumnId || overIndex < 0) return prevData;


            if (overColumnId === activeColumnId) {
                return {
                    ...prevData,
                    [activeColumnId]: arrayMove(prevData[activeColumnId], activeIndex, overIndex)
                };
            }


            let newIndex = overIndex;
            if (overIndex === prevData[overColumnId].length - 1) {
                if (over.rect && active.rect.current.translated) {
                    const activeRect = active.rect.current.translated;
                    const overRect = over.rect;

                    const pointerY = activeRect.top;
                    const overCenterY = overRect.top + overRect.height / 2;

                    newIndex = pointerY > overCenterY ? overIndex + 1 : overIndex;
                }
            }
            const updatedTask = {
                ...activeTask,
                boardColumnId: overColumnId
            };
            const sourceItems = prevData[activeColumnId].filter(t => t.taskId !== activeId);
            const destItems = [...prevData[overColumnId]];
            destItems.splice(newIndex, 0, updatedTask);
            setActiveItem(updatedTask);
            return {
                ...prevData,
                [activeColumnId]: sourceItems,
                [overColumnId]: destItems
            };
        });
    };

    const onDragOver = (event: DragOverEvent) => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
        }
        pendingUpdateRef.current = event;
        frameRef.current = requestAnimationFrame(() => {
            if (pendingUpdateRef.current) {
                processDragOver(pendingUpdateRef.current);
                pendingUpdateRef.current = null;
            }
            frameRef.current = null;
        });
    }

    const onDragCancel = () => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        pendingUpdateRef.current = null;

        isDraggingRef.current = false;
        setTasksColumn(tasksColumnSnapshotRef.current || {});
        setColumns(columnsSnapshotRef.current);
        setActiveItem(null);
        setActiveType(null);
    };

    const onDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        pendingUpdateRef.current = null;
        isDraggingRef.current = false;

        const activeId = active.id as string;
        const overId = over?.id as string;
        if (!activeId || !overId) return;

        if (Object.keys(tasksColumn).includes(activeId) && Object.keys(tasksColumn).includes(overId)) {
            const activeIndex = columns.findIndex(c => c.boardColumnId === activeId);
            const overIndex = columns.findIndex(c => c.boardColumnId === overId);

            const movedArray = arrayMove(columns, activeIndex, overIndex);
            setColumns(movedArray);


            const prevSortOrder = movedArray[overIndex - 1]?.sortOrder || 0;
            const nextSortOrder = movedArray[overIndex + 1]?.sortOrder;
            let newSortOrder;
            if (nextSortOrder !== undefined) {
                newSortOrder = (prevSortOrder + nextSortOrder) / 2;
            } else {
                newSortOrder = Math.ceil(prevSortOrder) + 1;
            }
            updateColumnMutation.mutate({
                column: movedArray[overIndex],
                newSortOrder: newSortOrder,
            });
        } else {
            const activeTask = activeItem as TaskResponse;
            const newSortOrder = calculateSortOrderWithFilter(
                activeTask,
                tasksColumn[activeTask.boardColumnId],
                activeTask.boardColumnId);
            updateTaskMutation.mutate({task: activeTask, boardColumnId: activeTask.boardColumnId, newSortOrder});
        }

        setActiveItem(null);
        setActiveType(null);

        if (!over) {
            setTasksColumn(tasksColumnSnapshotRef.current || {});
            setColumns(columnsSnapshotRef.current);
        }
    }

    const customModifier: Modifier = (args) => {
        const {transform, active} = args;
        const activeData = active?.data.current;
        if (activeData?.column) {
            return restrictToHorizontalAxis(args);
        }
        if (activeData?.task) {
            return restrictToWindowEdges(args);
        }

        return transform;
    };
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
                delay: 200,
                tolerance: 5
            }
        })
    );

    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        if (activeType === 'COLUMN') {
            return closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(
                    (container) => Object.keys(tasksColumn).includes(container.id as string)
                ),
            });
        }
        return closestCorners(args);
    }, [activeType, tasksColumn]);

    return {
        tasksColumn, columns, activeType, activeItem,
        onDragStart, onDragOver, onDragEnd, onDragCancel, customModifier, sensors,
        customCollisionDetection
    }
}
