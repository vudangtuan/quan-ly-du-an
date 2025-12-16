import {useRef, useState} from "react";
import type {TaskPriority, TaskRequest, TaskResponse} from "@/shared/types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {TaskService} from "@/shared/services";


export const useCreateTask = (projectId: string) => {
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [selectedColumnId, setSelectedColumnId] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [overDate, setOverDate] = useState<Date | null>(null);
    const [checkLists, setCheckLists] = useState<string[]>([]);
    const [priority, setPriority] = useState<TaskPriority>('LOW');
    const [error, setError] = useState<string | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const queryClient = useQueryClient();

    const handleToggleLabel = (labelId: string) => {
        setSelectedLabelIds(prevState => prevState.includes(labelId) ?
            prevState.filter(l => l !== labelId) : [...prevState, labelId]);
    }
    const handleToggleMember = (memberId: string) => {
        setSelectedMemberIds(prevState => prevState.includes(memberId) ?
            prevState.filter(m => m !== memberId) : [...prevState, memberId]
        )
    }

    const handleCancel = () => {
        setSelectedLabelIds([]);
        setSelectedMemberIds([]);
        setTitle("");
        setDescription("");
        setSelectedColumnId("");
        setOverDate(null);
        setCheckLists([]);
        setError(null);
        setPriority('LOW');
        closeButtonRef.current?.click();
    }

    const handleAddCheckList = () => {
        setCheckLists(prevState => [...prevState, `subtask ${prevState.length}`]);
    }
    const handleEditCheckList = (name: string, index: number) => {
        setCheckLists(prevState => prevState.map((c, i) => i === index ? name : c));
    }
    const handleDeleteCheckList = (index: number) => {
        setCheckLists(prevState => prevState.filter((_c, i) => i !== index));
    }

    const creatTaskMutation = useMutation({
        mutationFn: (data: TaskRequest) => TaskService.createTask(projectId, data),
        onSuccess: (res: TaskResponse) => {
            queryClient.setQueryData(["tasks", projectId], (old: TaskResponse[]) => {
                return [...old, res]
            })
            handleCancel();
        },
        onError: (err) => {
            setError(err.message);
        }
    });
    const handleCreateTask = () => {
        if (!title.trim()) {
            setError("Tiêu đề không được trống")
            return;
        }
        if (!selectedColumnId) {
            setError("Chưa chọn cột kanban cho nhiệm vụ")
            return;
        }
        if (!priority) {
            setError("Chưa chọn độ ưu tiên")
            return;
        }
        const newTask: TaskRequest = {
            title: title,
            description: description,
            dueAt: overDate ? overDate.toISOString() : null,
            boardColumnId: selectedColumnId,
            assigneeIds: selectedMemberIds,
            labelIds: selectedLabelIds,
            checkLists: checkLists,
            projectId: projectId,
            priority: priority
        }
        creatTaskMutation.mutate(newTask);
    }

    return {
        selectedLabelIds, handleToggleLabel,
        title, setTitle,
        description, setDescription,
        selectedMemberIds, handleToggleMember,
        selectedColumnId, setSelectedColumnId,
        overDate, setOverDate,
        checkLists, handleEditCheckList, handleAddCheckList, handleDeleteCheckList,
        handleCancel, handleCreateTask, error,
        priority, setPriority,
        closeButtonRef, creatTaskMutation
    }
}