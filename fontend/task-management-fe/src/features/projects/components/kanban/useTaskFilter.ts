
import { useState, useMemo } from 'react';
import { TaskResponse, TaskPriority } from '@features/projects/types/task.types';


export const useTaskFilter = (
    initialTasks: TaskResponse[] | undefined
) => {
    // 1. State cho các giá trị filter
    const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
    const [filterLabels, setFilterLabels] = useState<string[]>([]);
    const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([]);

    // 2. Biến 'isFiltered'
    const isFiltered = useMemo(() =>
            filterAssignees.length > 0 || filterLabels.length > 0 || filterPriorities.length > 0,
        [filterAssignees, filterLabels, filterPriorities]
    );

    // 3. Logic lọc chính
    const filteredTasks = useMemo(() => {
        const tasks = initialTasks || []; // Xử lý trường hợp undefined
        if (!isFiltered) return tasks;

        return tasks.filter(task => {
            const assigneeMatch = filterAssignees.length === 0 ||
                filterAssignees.some(assigneeId => task.assigneeIds.includes(assigneeId));

            const labelMatch = filterLabels.length === 0 ||
                filterLabels.some(labelId => task.labelIds.includes(labelId));

            const priorityMatch = filterPriorities.length === 0 ||
                filterPriorities.includes(task.priority);

            return assigneeMatch && labelMatch && priorityMatch;
        });
    }, [initialTasks, filterAssignees, filterLabels, filterPriorities, isFiltered]);

    // 4. Các hàm handler để thay đổi state
    const toggleAssigneeFilter = (memberId: string) => {
        setFilterAssignees(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const toggleLabelFilter = (labelId: string) => {
        setFilterLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    const togglePriorityFilter = (priority: TaskPriority) => {
        setFilterPriorities(prev =>
            prev.includes(priority)
                ? prev.filter(p => p !== priority)
                : [...prev, priority]
        );
    };

    const clearFilters = () => {
        setFilterAssignees([]);
        setFilterLabels([]);
        setFilterPriorities([]);
    };

    return {
        // Dữ liệu
        filteredTasks,

        // State
        filterAssignees,
        filterLabels,
        filterPriorities,
        isFiltered,

        // Hàm
        toggleAssigneeFilter,
        toggleLabelFilter,
        togglePriorityFilter,
        clearFilters,
    };
};