import React, {useMemo} from "react";
import type {BoardColumnResponse, TaskResponse} from "@/shared/types";
import {
    DndContext, DragOverlay
} from "@dnd-kit/core";
import {horizontalListSortingStrategy, SortableContext} from "@dnd-kit/sortable";
import {Column} from "./Column";
import {TaskCard} from "./TaskCard";
import {useColumn, useKanban} from "@/features/project_details/tabs/kanban/hooks";
import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";


export interface KanbanBoardProps {
    tasks: TaskResponse[];
    columns: BoardColumnResponse[]
}


export const KanbanBoard: React.FC<KanbanBoardProps> = ({tasks, columns: initialColumns}) => {
    const {allTasks, projectDetail} = useOutletContext<ProjectDetailContext>();
    const {
        sensors, onDragStart, onDragEnd, onDragOver, onDragCancel, customModifier,
        tasksColumn, activeItem, activeType, columns, customCollisionDetection
    } = useKanban(tasks, initialColumns, allTasks);
    const columnIds = useMemo(
        () => columns.map(c => c.boardColumnId), [columns])

    const {
        isEditColumn: isAddingColumn, setIsEditColumn: setIsAddingColumn, newColumnName,
        setNewColumnName, createColumnMutation
    } = useColumn({
        projectId: projectDetail.projectId,
        name: "",
        boardColumnId: "",
        status: "ACTIVE",
        sortOrder: 0
    });

    return (
        <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
            collisionDetection={customCollisionDetection}
            modifiers={[customModifier]}
        >
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                <div className="h-full max-h-screen overflow-auto">
                    <div className="flex gap-1">
                        {columns.map((column) => (
                            <Column
                                key={column.boardColumnId}
                                column={column}
                                tasks={tasksColumn[column.boardColumnId] || []}/>
                        ))}
                        {projectDetail.currentRoleInProject === 'OWNER' && (isAddingColumn ?
                            <div className="flex flex-col w-60 min-w-60 flex-shrink-0 border border-gray-300 p-3">
                                <input
                                    type="text"
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    onBlur={()=>{
                                        if(newColumnName.trim()){
                                            createColumnMutation.mutate();
                                        }else {
                                            setIsAddingColumn(false);
                                            setNewColumnName("");
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            createColumnMutation.mutate();
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            setIsAddingColumn(false);
                                            setNewColumnName("");
                                        }
                                    }}
                                    placeholder="Nhập tên cột..."
                                    autoFocus
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                                                focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            :
                            <div className="flex-shrink-0 w-60 mr-10">
                                <button className="w-full cursor-pointer h-full bg-white/50 hover:bg-white border-2
                                                   border-dashed border-gray-300 hover:border-blue-400 rounded-xl
                                                    transition-all group"
                                        onClick={() => setIsAddingColumn(true)}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">
                                        Thêm cột mới
                                    </span>
                                    </div>
                                </button>
                            </div>)
                        }
                    </div>
                </div>
            </SortableContext>
            <DragOverlay>
                {activeType === "COLUMN" && activeItem &&
                    <Column column={activeItem as BoardColumnResponse}
                            tasks={tasksColumn[activeItem.boardColumnId] || []}
                            isDragging
                    />
                }
                {activeType === "TASK" && activeItem &&
                    <TaskCard task={activeItem as TaskResponse} isDragging/>
                }
            </DragOverlay>
        </DndContext>
    );
}