import type {ProjectResponse} from "@/shared/types";
import {useNavigate} from "react-router-dom";
import type {MenuItem} from "@/shared/components";
import {Archive, Eye} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@/shared/services";
import toast from "react-hot-toast";
import {showArchiveToast} from "@/utils";


export const useProjectMenu = (project: ProjectResponse, userId: string) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const unarchiveProjectMutation = useMutation({
        mutationFn: (projectId: string) =>
            ProjectService.unarchiveProject(projectId),
        onError: (err) => {
            toast.error(err.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ['projects', userId]});
            queryClient.invalidateQueries({queryKey: ['myArchivedProjects', userId]});
        }
    });

    const archiveProjectMutation = useMutation({
        mutationFn: (project: ProjectResponse) => ProjectService.archiveProject(project.projectId),
        onSuccess: (_data, variables) => {
            showArchiveToast({
                itemName: variables.name, onRestore: () => {
                    unarchiveProjectMutation.mutate(variables.projectId);
                }
            });
            queryClient.invalidateQueries({queryKey: ['projects', userId]});
            queryClient.invalidateQueries({queryKey: ['myArchivedProjects', userId]});
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });
    const menuItems: MenuItem[] = [
        {
            id: "detail",
            label: "Chi tiết",
            icon: Eye,
            onClick: () => {
                navigate(`/project/${project.projectId}`);
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
                archiveProjectMutation.mutate(project);
            },
            disabled: project.currentRoleInProject !== "OWNER"
        }
    ];

    return {
        menuItems
    }
}