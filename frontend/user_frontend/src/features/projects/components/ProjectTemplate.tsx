import React from "react";
import {type KanbanTemplate} from "@/shared/types";
import * as Dialog from "@radix-ui/react-dialog";
import {ArrowRight, Check, LayoutGrid, X} from "lucide-react";


interface ProjectTemplateProps {
    isOpen: boolean;
    onOpenChange: () => void;
    onContinue: () => void;
    templates: KanbanTemplate[];
    selectedTemplate: KanbanTemplate;
    setSelectedTemplate: (template: KanbanTemplate) => void;
}

export const ProjectTemplate: React.FC<ProjectTemplateProps> = ({
                                                                    isOpen,
                                                                    onOpenChange,
                                                                    onContinue,
                                                                    templates,
                                                                    selectedTemplate,
                                                                    setSelectedTemplate
                                                                }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out
                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"/>
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-full max-w-xl md:max-w-4xl
                                            data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                                             data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 ease-out">
                    <div
                        className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
                                    <LayoutGrid className="h-5 w-5"/>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Chọn một mẫu dự án</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Bắt đầu nhanh chóng bằng cách chọn một trong các mẫu dựng sẵn của chúng tôi.
                                    </p>
                                </div>
                            </div>
                        </Dialog.Title>
                        <Dialog.Close
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <X className="h-5 w-5 text-gray-400"/>
                        </Dialog.Close>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {templates.map((template: KanbanTemplate, index: number) => (
                                <TemplateCard
                                    key={index}
                                    template={template}
                                    isSelected={selectedTemplate === template}
                                    onClick={() => {
                                        setSelectedTemplate(template)
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
                        <button
                            onClick={onContinue}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Chọn mẫu và tiếp tục
                            <ArrowRight className="h-4 w-4"/>
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}


interface TemplateCardProps {
    template: KanbanTemplate;
    isSelected: boolean;
    onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({template, isSelected, onClick}) => {
    const {displayName, description} = template;

    const IconComponent = template.icon || LayoutGrid;
    const colorClass = template.color || 'bg-blue-100 text-blue-600';

    return (
        <button
            onClick={onClick}
            className={`relative w-full p-5 text-left bg-white rounded-lg border-2 transition-all duration-150
                ${
                isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                    : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
            }
            `}
        >
            {/* Check mark */}
            {isSelected && (
                <div
                    className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                    <Check className="h-4 w-4" strokeWidth={3}/>
                </div>
            )}

            {/* Icon với màu sắc động */}
            <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass} transition-transform ${isSelected ? 'scale-110' : ''}`}>
                <IconComponent className="h-6 w-6" strokeWidth={2}/>
            </div>

            {/* Content */}
            <h3 className="mt-4 font-semibold text-gray-900 line-clamp-1">{displayName}</h3>
            <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">{description}</p>
        </button>
    );
};