import {useMemo, useState} from "react";
import type {ProjectRole} from "@/shared/types";
import {useDebounce} from "@/shared/hooks";
import {useInfiniteQuery, useMutation} from "@tanstack/react-query";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@/utils";
import {ProjectService, UserService} from "@/shared/services";
import toast from "react-hot-toast";


export const useAddMember = (projectId: string) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<Exclude<ProjectRole, 'OWNER'>>('EDITOR');

    const searchUserQuery = useInfiniteQuery({
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined
            if (!lastPage.last) {
                return lastPage.number + 1;
            }
            return undefined;
        },
        initialPageParam: 0,
        queryFn: ({pageParam = 0}: { pageParam: number | undefined }) => {
            if (debouncedSearchQuery.trim() === '') {
                return Promise.resolve(null);
            }
            return UserService.searchUsers(pageParam, 5, debouncedSearchQuery)
        },
        queryKey: ["searchesUser", debouncedSearchQuery],
        enabled: debouncedSearchQuery.length > 0,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT,
    });
    const allSearchedUsers = useMemo(() => {
            // eslint-disable-next-line react-hooks/set-state-in-render
            setSelectedUserId("");
            return searchUserQuery.data?.pages
                .flatMap(page => page ? page.content : []) || []
        },
        [searchUserQuery.data]);
    const isDebouncing = searchQuery !== debouncedSearchQuery;
    const isLoading = isDebouncing || searchUserQuery.isLoading;

    const handleCancel = () => {
        setSearchQuery("")
        setSelectedUserId("")
        setSelectedRole("EDITOR")
    }

    const inviteMemberMutation = useMutation({
        mutationFn: () => {
            return ProjectService.sendInvitation({
                memberId: selectedUserId,
                projectId: projectId,
                role: selectedRole,
            });
        },
        onSuccess: () => {
            toast.success('Đã gửi lời mời');
            handleCancel();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    return {
        selectedRole, setSelectedRole, handleCancel, allSearchedUsers,
        inviteMemberMutation, isLoading, searchUserQuery, selectedUserId, setSelectedUserId,
        searchQuery, setSearchQuery
    }
}