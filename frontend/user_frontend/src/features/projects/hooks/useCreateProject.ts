import {useEffect, useMemo, useState} from "react";
import {type CreateProjectRequest, getAllTemplates, type KanbanTemplate} from "@/shared/types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@/shared/services";
import toast from "react-hot-toast";

export const useCreateProject = (userId: string) => {
    const templates = useMemo(() => getAllTemplates(), []);
    const [selectedTemplate, setSelectedTemplate] = useState<KanbanTemplate>(templates[0]);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const queryClient = useQueryClient();

    const initProject: CreateProjectRequest = useMemo(() => {
        if (selectedTemplate && isFormOpen) {
            return {
                name: "",
                description: "",
                dueAt: null,
                boardColumns: [...selectedTemplate.boardColumns],
                labels: [...selectedTemplate.labels],
            }
        }
        return {
            name: "",
            description: "",
            dueAt: null,
            boardColumns: [],
            labels: [],
        }
    }, [selectedTemplate, isFormOpen]);

    const [newProject, setNewProject] = useState<CreateProjectRequest>(
        () => initProject);

    useEffect(() => {
        setNewProject(initProject);
    }, [initProject]);


    const handleSetValueNewProject = (value: Partial<CreateProjectRequest>) => {
        setNewProject(prevState => {
            return {
                ...prevState, ...value
            }
        });
    }

    const createProjectMutation = useMutation({
        mutationFn: () => {
            return ProjectService.createProject({
                ...newProject,
                dueAt: newProject.dueAt ? new Date(newProject.dueAt).toISOString() : null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['projects', userId]});
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    return {
        templates,
        isTemplateOpen, setIsTemplateOpen,
        selectedTemplate, setSelectedTemplate,
        isFormOpen, setIsFormOpen,
        newProject, handleSetValueNewProject,
        createProjectMutation
    }
}