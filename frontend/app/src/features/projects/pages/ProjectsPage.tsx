import React, {useRef, useCallback, useEffect} from 'react';
import {
    Plus,
    Loader2,
} from 'lucide-react';
import {useAuthStore} from "@/store";
import {ProjectCard, ProjectForm, ProjectTemplate} from "@/features/projects/components";
import {useCreateProject, useProject} from "@/features/projects/hooks";

export const ProjectsPage: React.FC = () => {
    const observerTarget = useRef<HTMLDivElement>(null);
    const userId = useAuthStore.getState().userInfo?.userId;

    const {
        isTemplateOpen, setIsTemplateOpen, templates,
        isFormOpen, setIsFormOpen, selectedTemplate, setSelectedTemplate,
        newProject, handleSetValueNewProject, createProjectMutation
    } = useCreateProject(userId!);

    const {
        projects, isLoading, error, hasNextPage,
        isFetchingNextPage, fetchNextPage
    } = useProject(userId!);


    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage]);

    useEffect(() => {
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

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Danh sách Dự án</h1>
                    <p className="mt-1 text-sm md:text-base text-gray-600">
                        Xem và quản lý tất cả các dự án của bạn ở một nơi.
                    </p>
                </div>

                <button
                    onClick={() => setIsTemplateOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
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

            {error && <p className="text-red-500 mt-4 text-center">Lỗi: {error.message}</p>}

            {!isLoading && !error && projects.length > 0 && (
                <>
                    <div className="grid mt-6 md:mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {projects.map((project) => (
                            <ProjectCard key={project.projectId} project={project}/>
                        ))}
                    </div>

                    <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
                        {isFetchingNextPage && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                                <span className="text-sm">Đang tải thêm...</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {!isLoading && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-center px-4">
                    <p className="text-gray-500 text-lg">Bạn chưa có dự án nào.</p>
                    <p className="text-gray-400 text-sm mt-2">Hãy bắt đầu bằng cách tạo dự án đầu tiên của bạn.</p>
                </div>
            )}

            <ProjectTemplate isOpen={isTemplateOpen}
                             onOpenChange={() => {
                                 setIsTemplateOpen(false);
                                 setSelectedTemplate(templates[0])
                             }}
                             onContinue={() => {
                                 setIsFormOpen(true);
                                 setIsTemplateOpen(false);
                             }}
                             templates={templates}
                             selectedTemplate={selectedTemplate}
                             setSelectedTemplate={setSelectedTemplate}
            />

            <ProjectForm
                isOpen={isFormOpen}
                onOpenChange={() => {
                    setIsFormOpen(false);
                    setSelectedTemplate(templates[0]);
                }}
                onBack={() => {
                    setIsTemplateOpen(true);
                    setIsFormOpen(false);
                }}
                newProject={newProject}
                handleSetValueProject={handleSetValueNewProject}
                handleCreateProject={() => {
                    createProjectMutation.mutate(undefined, {
                        onSuccess: () => {
                            setIsFormOpen(false);
                        }
                    });
                }}
                isLoading={createProjectMutation.isPending}
            />
        </div>
    );
};