import {useMutation, useQueryClient} from "@tanstack/react-query";
import type {LabelRequest} from "@/shared/types";
import {ProjectService} from "@/shared/services";
import toast from "react-hot-toast";



export const useLabel = (projectId: string) => {
    const queryClient = useQueryClient();

    const createLabelMutation = useMutation({
        mutationFn: (data: LabelRequest) => ProjectService.createLabel(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["projectDetails", projectId]});
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const updateLabelMutation = useMutation({
        mutationFn: ({data, labelId}: { data: LabelRequest, labelId: string }) => {
            return ProjectService.updateLabel(projectId, labelId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["projectDetails", projectId]});
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    const deleteLabelMutation = useMutation({
        mutationFn: (labelId: string) => ProjectService.deleteLabel(projectId, labelId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["projectDetails", projectId]});
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    return {createLabelMutation, updateLabelMutation, deleteLabelMutation};
}