import type {EditProjectData, ProjectDetailResponse} from "@/shared/types";
import {useState} from "react";
import toast from "react-hot-toast";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@/shared/services";


export const useUpdateInfoProject = (project: ProjectDetailResponse) => {
    const [isEditing, setIsEditing] = useState(false);
    const queryClient = useQueryClient();
    const [editedProject, setEditedProject] = useState<EditProjectData>({
        name: project.name,
        description: project.description,
        dueAt: project.dueAt
    });

    const resetData = () => {
        setEditedProject({
            name: project.name,
            description: project.description,
            dueAt: project.dueAt
        });
    }

    const updateProjectMutation = useMutation({
        mutationFn: () =>
            ProjectService.updateProject(project.projectId, {
                ...editedProject,
                dueAt: editedProject.dueAt ? new Date(editedProject.dueAt).toISOString() : null
            }),
        onError: (errors) => {
            toast.error(errors.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projectDetails', project.projectId]});
            handleCancel();
        }
    });
    const handleEdit = () => {
        setIsEditing(true);
        resetData();
    }
    const handleCancel = () => {
        setIsEditing(false);
    }
    const handleSetData = (value: Partial<EditProjectData>) => {
        setEditedProject(prevState => {
            return {
                ...prevState, ...value
            }
        });
    }

    return {
        handleEdit, handleCancel, updateProjectMutation, editedProject, isEditing, handleSetData
    }
}