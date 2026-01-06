import type {TaskPriority, TaskResponse} from "@/shared/types";
import {useMemo, useState} from "react";
import {checkDate, isOverdue} from "@/utils";
import {startOfWeek, endOfWeek, startOfMonth, endOfMonth} from "date-fns";

export type DateRange = "TODAY" | "WEEK" | "MONTH" | "OVERDUE" | "COMPLETED" | null | {
    start: Date | null;
    end: Date | null;
};
export type DateStatus = "OVERDUE" | "COMPLETED" | null;


export const useFilterTask = (tasks: TaskResponse[]) => {
    const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
    const [filterLabels, setFilterLabels] = useState<string[]>([]);
    const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange>(null);
    const [dateStatus, setDateStatus] = useState<DateStatus>(null);

    const isFiltered = useMemo(() =>
            filterAssignees.length > 0 || filterLabels.length > 0 ||
            filterPriorities.length > 0 || dateRange != null || dateStatus != null ||
            searchTerm.trim().length > 0,
        [filterAssignees, filterLabels, filterPriorities, dateRange, searchTerm, dateStatus]
    );

    const filteredTasks = useMemo(() => {
        if (!isFiltered) return tasks;
        return tasks.filter(task => {
            const assigneeMatch = filterAssignees.length === 0 ||
                filterAssignees.some(assigneeId => task.assigneeIds.includes(assigneeId));

            const labelMatch = filterLabels.length === 0 ||
                filterLabels.some(labelId => task.labelIds.includes(labelId));

            const priorityMatch = filterPriorities.length === 0 ||
                filterPriorities.includes(task.priority);

            const searchMatch = searchTerm.trim().length === 0 ||
                task.title.toLowerCase().includes(searchTerm.toLowerCase());

            let dateFilterMatch = dateRange == null;
            if (dateRange) {
                const now = new Date();
                switch (dateRange) {
                    case "TODAY":
                        dateFilterMatch = checkDate(now, now, task.dueAt);
                        break;
                    case "WEEK":
                        dateFilterMatch = checkDate(
                            startOfWeek(now, {weekStartsOn: 1}),
                            endOfWeek(now, {weekStartsOn: 1}),
                            task.dueAt);
                        break;
                    case "MONTH":
                        dateFilterMatch = checkDate(startOfMonth(now),
                            endOfMonth(now),
                            task.dueAt);
                        break;
                    default:
                        if (typeof dateRange === 'object' && 'start' in dateRange && 'end' in dateRange) {
                            dateFilterMatch = checkDate(
                                dateRange.start,
                                dateRange.end,
                                task.dueAt
                            );
                        }
                }
            }

            let dateStatusMatch = dateStatus === null;
            switch (dateStatus) {
                case "OVERDUE":
                    dateStatusMatch = isOverdue(task.dueAt, task.completed)
                    break;
                case "COMPLETED":
                    dateStatusMatch = task.completed
                    break;
                default:
            }

            return assigneeMatch && labelMatch && priorityMatch && searchMatch && dateFilterMatch
                && dateStatusMatch;
        });
    }, [tasks, filterAssignees, filterLabels, filterPriorities, isFiltered, searchTerm, dateRange, dateStatus]);

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

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    }
    const handleSetDateRange = (data: DateRange) => {
        setDateRange(data);
    }
    const handleSetDateStatus = (data: DateStatus) => {
        setDateStatus(data);
    }


    const clearFilters = () => {
        setFilterAssignees([]);
        setFilterLabels([]);
        setFilterPriorities([]);
        setSearchTerm("");
        setDateRange(null);
        setDateStatus(null);
    };

    return {
        filterAssignees,
        filterLabels,
        filterPriorities,
        searchTerm,
        toggleAssigneeFilter,
        toggleLabelFilter,
        togglePriorityFilter,
        handleSearchTermChange,
        clearFilters,
        isFiltered,
        filteredTasks,
        dateRange,
        handleSetDateRange,
        dateStatus,
        handleSetDateStatus
    }
}