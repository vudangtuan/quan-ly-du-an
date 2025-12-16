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

    // Intersection Observer để phát hiện khi cuộn đến cuối trang
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
                    onClick={() => setIsTemplateOpen(true)}
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