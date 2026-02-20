import type {FileResponse, TaskDetailResponse} from "@/shared/types";
import React, {useEffect, useRef, useState} from "react";
import {useTask} from "@/features/project_details/components/task_details/hooks";
import {useQuery} from "@tanstack/react-query";
import {TaskService} from "@/shared/services";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@/utils";
import {Download, FileText, Loader2, Plus, X} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog"
import {DialogClose} from "@radix-ui/react-dialog"
import { renderAsync } from 'docx-preview';


const textExtensions = ['txt', 'json', 'csv', 'md', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'java', 'py', 'sql', 'php', 'c', 'cpp', 'h'];
const getMimeType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (textExtensions.includes(ext || '')) {
        return 'text/plain;charset=utf-8';
    }
    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'mp4': 'video/mp4',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
};

interface TaskFileProps {
    task: TaskDetailResponse
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
export const TaskFile: React.FC<TaskFileProps> = ({task}) => {
    const {uploadFileMutation, deleteFileMutation} = useTask(task);
    const {data: files = []} = useQuery({
        queryKey: ['task-files', task.projectId, task.taskId],
        queryFn: () => TaskService.getFiles(task.projectId, task.taskId),
        enabled: !!task.taskId && !!task.projectId,
        staleTime: QUERY_STALE_TIME.LONG,
        gcTime: QUERY_GC_TIME.LONG,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadFileMutation.mutate(file);
        }
        event.target.value = '';
    };

    return (
        <div className="p-2 space-y-2">
            <div className="text-sm font-semibold text-gray-900 sm:text-gray-600 sm:font-medium">
                Tài liệu
            </div>
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFileMutation.isPending}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
            >
                {uploadFileMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin"/>
                ) : (
                    <Plus size={12}/>
                )}
                Thêm mới
            </button>

            {/* Input ẩn */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
            {files.map((file) => (
                <div
                    key={file.key}
                    className="group flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-300 hover:shadow-sm transition-all"
                >
                    <button
                        rel="noreferrer"
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                            <FileText size={16}/>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <FilePreviewModal file={file}>
                                 <span
                                     className="text-gray-700 font-medium truncate hover:text-blue-600 transition-colors"
                                     title={file.fileName}>
                                    {file.fileName.replace(/^\d+_[a-f0-9-]{36}_/, '')}
                                </span>
                            </FilePreviewModal>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                {formatFileSize(file.size)}
                            </span>
                        </div>
                    </button>

                    {/* Actions */}
                    <div
                        className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const blobData = await TaskService.downloadFile(file.key);
                                const url = window.URL.createObjectURL(new Blob([blobData]));
                                const link = document.createElement('a');
                                link.href = url;
                                const cleanName = file.fileName.replace(/^\d+_[a-f0-9-]{36}_/, "");
                                link.setAttribute('download', cleanName);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Tải xuống"
                        >
                            <Download size={14}/>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteFileMutation.mutate(file.key);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                        >
                            <X size={14}/>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}


interface FilePreviewModalProps {
    file: FileResponse,
    children: React.ReactNode
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({file, children}) => {
    // Sử dụng query để tải blob và tạo URL
    const {data: objectUrl} = useQuery({
        queryKey: ['file-view', file.key],
        queryFn: async () => {
            const blobData = await TaskService.viewFile(file.key);
            return window.URL.createObjectURL(new Blob([blobData],{ type: getMimeType(file.fileName) }));
        }, // Gọi hàm trả về blob url
        enabled: !!file.key,
        // Quan trọng: Thu hồi URL khi data cũ bị xóa để tránh rò rỉ bộ nhớ
        meta: {
            onSuccess: () => {
            },
        }
    });
    console.log(objectUrl)

    // Giải phóng bộ nhớ khi component bị unmount
    useEffect(() => {
        return () => {
            if (objectUrl) window.URL.revokeObjectURL(objectUrl);
        };
    }, [objectUrl]);

    return (
        <Dialog.Root>
            <Dialog.Title/>
            <Dialog.Trigger>
                {children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content
                    aria-describedby={""}
                    className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%]
                                translate-y-[-50%] bg-white shadow-2xl border-gray-600
                                md:w-[70%] w-[90%] max-h-[90vh] flex flex-col
                                data-[state=open]:animate-in data-[state=closed]:animate-out
                                data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                duration-200 ease-out border">
                    <div className="flex items-center justify-end p-2 border-b border-gray-800 bg-gray-900">
                        <DialogClose>
                            <X size={16} className={"text-white hover:bg-blue-50"}/>
                        </DialogClose>
                    </div>
                    <div className={""}>
                        <SmartViewer url={objectUrl!} type={file.fileName.split('.').pop()?.toLowerCase() || ''}/>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

interface SmartViewProps {
    url: string;
    type: string;
}

const SmartViewer: React.FC<SmartViewProps> = ({url, type}) => {
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(type)) {
        return (
            <div className="h-[450px] w-full overflow-auto scrollbar-thin border border-gray-200">
                <img
                    src={url}
                    alt="doc"
                    className="w-full h-auto object-contain"
                />
            </div>
        );
    }
    if (['mp4', 'webm', 'ogg'].includes(type)) {
        return (
            <div className="h-[450px] bg-black flex items-center justify-center">
                <video controls className="max-w-full max-h-full" src={url} />
            </div>
        );
    }
    if (type === 'pdf') {
        return (
            <iframe
                src={url}
                className="w-full h-[450px] border-none"
                title="PDF Preview"
            />
        );
    }
    if (textExtensions.includes(type)) {
        return (
            <iframe
                src={url}
                className="w-full h-[450px]"
                title="Code Preview"
                style={{ fontFamily: 'monospace' }}
            />
        );
    }
    if (type === 'docx') {
        return <DocxViewer url={url} />;
    }

    return <div/>;
}

const DocxViewer: React.FC<{ url: string }> = ({ url }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const render = async () => {
            if (!containerRef.current) return;
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                await renderAsync(blob, containerRef.current, undefined, {
                    className: 'docx-render',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    ignoreFonts: false,
                    breakPages: true,
                    useBase64URL: true,
                    renderChanges: false,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                });
            } catch (e) {
                console.error(e);
                setError('Không thể đọc file');
            } finally {
                setLoading(false);
            }
        };
        render();
    }, [url]);

    if (error) return (
        <div className="flex items-center justify-center h-[450px] bg-gray-100 text-sm text-red-400">
            {error}
        </div>
    );

    return (
        <div className="relative h-[450px] bg-[#f0f0f0] overflow-auto">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-[#f0f0f0]">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                    <span className="text-xs text-gray-400">Đang tải tài liệu...</span>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};