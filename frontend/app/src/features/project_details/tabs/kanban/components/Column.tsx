import type {BoardColumnResponse, TaskResponse} from "@/shared/types";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import React, {useMemo, useRef} from "react";
import {CSS} from '@dnd-kit/utilities';
import {TaskCard} from "./TaskCard";
import {Menu, type MenuItem} from "@/shared/components";
import {Archive, FileEdit, MenuIcon, PlusCircle} from "lucide-react";
import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import {useColumn} from "@/features/project_details/tabs/kanban/hooks";
import {TaskCreationForm} from "@/features/project_details/components";


interface ColumnProps {
    column: BoardColumnResponse;
    tasks: TaskResponse[];
    isDragging?: boolean;
}


export const Column = React.memo<ColumnProps>(({column, tasks, isDragging}) => {
    const {projectDetail} = useOutletContext<ProjectDetailContext>();
    const taskCreationTriggerRef = useRef<HTMLButtonElement>(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging
    } = useSortable({
        id: column.boardColumnId, data: {
            column
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1
    };

    const taskIds = useMemo(() => {
        return tasks.map((task) => task.taskId);
    }, [tasks])

    const {
        isEditColumn, setIsEditColumn, newColumnName,
        setNewColumnName, updateColumnMutation, archiveColumnMutation
    } = useColumn(column);

    const handleCancelRename = () => {
        setIsEditColumn(false);
        setNewColumnName(column.name);
    };
    const handleSubmitRename = () => {
        if (!newColumnName.trim() || newColumnName.trim() === column.name) {
            handleCancelRename();
            return;
        }
        updateColumnMutation.mutate();
    }
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmitRename()
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelRename();
        }
    };


    const menuItems: MenuItem[] = [
        {
            id: "rename",
            label: "Đổi tên",
            icon: FileEdit,
            onClick: () => {
                setIsEditColumn(true);
            }
        },
        {
            id: "add task",
            label: "Thêm nhiệm vụ",
            icon: PlusCircle,
            onClick: () => {
                taskCreationTriggerRef.current?.click();
            }
        },
        {
            id: "sep",
            label: "",
            separator: true
        },
        {
            id: "archive",
            label: "Lưu trữ",
            icon: Archive,
            onClick: () => {
                archiveColumnMutation.mutate();
            }
        }
    ];

    return (
        <>
            <div ref={setNodeRef} style={style}
                 className={`flex flex-col group w-60 max-w-xs flex-shrink-0 border
                        border-gray-300 overflow-hidden shadow-sm ${
                     isDragging ? 'ring-1 ring-blue-500' : ''}
                 `}
            >
                {isEditColumn ?
                    <div className="flex items-center justify-between p-3 border-b border-gray-300
                                bg-white/50 backdrop-blur-sm">
                        <input
                            type="text"
                            autoFocus
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSubmitRename}
                            className="p-1 text-sm font-semibold text-gray-700 bg-white border"
                            maxLength={50}
                        />
                    </div> :
                    <Menu items={menuItems} trigger={
                        <div hidden={projectDetail.currentRoleInProject !== 'OWNER'}
                             className={"md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"}>
                            <MenuIcon size={16}
                                      className={"absolute top-3.5 right-3 text-gray-400 hover:text-gray-700"}/>
                        </div>
                    } enableContextMenu={projectDetail.currentRoleInProject === 'OWNER' && window.innerWidth >= 768}
                          enableDropdown={projectDetail.currentRoleInProject === 'OWNER'}>
                        <div
                            {...attributes}
                            {...listeners}
                            data-column-id={column.boardColumnId}
                            className="flex items-center justify-between p-3 border-b border-gray-300
                        bg-white/50 backdrop-blur-sm cursor-default touch-none"
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <h3 className="font-semibold text-gray-700 text-sm">
                                    {column.name}
                                </h3>
                                <span
                                    className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                                    {tasks.length}
                            </span>
                            </div>
                        </div>
                    </Menu>
                }
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <div className={"max-h-[60vh] overflow-auto scrollbar-thin"}>
                        <div className={"space-y-2 p-2"}>
                            {tasks.map((task) => (
                                <TaskCard task={task} key={task.taskId}/>
                            ))}
                        </div>
                    </div>
                </SortableContext>
            </div>
            <TaskCreationForm columnId={column.boardColumnId}>
                <button
                    ref={taskCreationTriggerRef}
                    hidden={true}
                />
            </TaskCreationForm>
        </>
    );
});

