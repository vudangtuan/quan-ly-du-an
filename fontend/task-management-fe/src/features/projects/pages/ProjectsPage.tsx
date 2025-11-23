import React, {useState, useRef, useCallback} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {ProjectService} from '../services/ProjectService';
import {ProjectCard} from '../components/ProjectCard';
import {
    Plus,
    Loader2,
} from 'lucide-react';

import {CreateProjectModal} from '../components/CreateProjectModal';

import {useAuthStore} from "@store/slices/authSlice";

import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {KanbanTemplate} from "@features/projects/types/kanban-templates";
import {ProjectFormModal} from "@features/projects/components/ProjectFormModal";


export const ProjectsPage: React.FC = () => {
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [template,setTemplate] = useState();



    const observerTarget = useRef<HTMLDivElement>(null);

    const userId = useAuthStore.getState().userInfo?.userId;

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['projects', userId],
        queryFn: ({pageParam = 0}) => {
            return ProjectService.getProjects({
                page: pageParam,
                size: 6,
                userId: userId
            });
        },
        enabled: !!userId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            const totalPages = lastPage.totalPages || 0;
            return nextPage < totalPages ? nextPage : undefined;
        },
    });



    // Intersection Observer để phát hiện khi cuộn đến cuối trang
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    React.useEffect(() => {
        const element = observerTarget.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, {
            threshold: 0.1,
            rootMargin: '100px',
        });

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [handleObserver]);

    const handleTemplateContinue = (template: KanbanTemplate) => {
        setTemplate(template);
        setIsTemplateModalOpen(false);
        setIsFormModalOpen(true);
    };


    const handleFormBack = () => {
        setIsFormModalOpen(false);
        setIsTemplateModalOpen(true);
    };

    const handleCloseAllModals = () => {
        setIsTemplateModalOpen(false);
        setIsFormModalOpen(false);
    }


    const projects = data?.pages.flatMap(page => page.content) || [];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Danh sách Dự án</h1>
                    <p className="mt-1 text-gray-600">
                        Xem và quản lý tất cả các dự án của bạn ở một nơi.
                    </p>
                </div>
                <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5"/>
                    Tạo dự án mới
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
                </div>
            )}

            {error && <p className="text-red-500">Lỗi: {error.message}</p>}

            {!isLoading && !error && projects.length > 0 && (
                <>
                    <div className="grid mt-10 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <ProjectCard key={project.projectId} project={project}/>
                        ))}
                    </div>

                    <div ref={observerTarget} className="h-10 flex items-center justify-center">
                        {isFetchingNextPage && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!isLoading && projects.length === 0 && (
                <p className="text-center text-gray-500">Bạn chưa có dự án nào.</p>
            )}

            {/* Modals */}
            <CreateProjectModal
                isOpen={isTemplateModalOpen}
                onClose={handleCloseAllModals}
                onContinue={handleTemplateContinue}
            />

            <ProjectFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseAllModals}
                onBack={handleFormBack}
                template={template}
            />
        </div>
    );
};