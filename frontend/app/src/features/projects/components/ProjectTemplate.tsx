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
                {/* Overlay mờ nhẹ giống form Project/Task */}
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]
                                            data-[state=open]:animate-in data-[state=closed]:animate-out
                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"/>

                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]
                                            bg-white rounded-xl shadow-2xl
                                            w-[95vw] max-w-2xl max-h-[90vh] flex flex-col
                                            outline-none border border-gray-100
                                            data-[state=open]:animate-in data-[state=closed]:animate-out
                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                            duration-200 ease-out">

                    {/* --- HEADER --- */}
                    <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100">
                        {/* Icon Header */}
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                            <LayoutGrid className="w-5 h-5 text-indigo-600"/>
                        </div>

                        <div className="flex-1 pt-0.5">
                            <Dialog.Title className="text-xl font-bold text-gray-900 leading-none">
                                Chọn mẫu dự án
                            </Dialog.Title>
                            <p className="mt-1.5 text-sm text-gray-500 font-medium">
                                Chọn cấu trúc phù hợp nhất để bắt đầu.
                            </p>
                        </div>

                        <Dialog.Close asChild>
                            <button className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* --- BODY --- */}
                    <div className="overflow-y-auto px-6 py-6 flex-1 scrollbar-thin bg-gray-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {templates.map((template, index) => (
                                <TemplateItem
                                    key={index}
                                    template={template}
                                    isSelected={selectedTemplate === template} // Hoặc so sánh ID nếu có
                                    onClick={() => setSelectedTemplate(template)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* --- FOOTER --- */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-xl">
                        <Dialog.Close asChild>
                            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                Hủy bỏ
                            </button>
                        </Dialog.Close>

                        <button
                            onClick={onContinue}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-sm"
                        >
                            Tiếp tục
                            <ArrowRight className="h-4 w-4"/>
                        </button>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// Component con: Template Item (Minimal Style)
interface TemplateItemProps {
    template: KanbanTemplate;
    isSelected: boolean;
    onClick: () => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({template, isSelected, onClick}) => {
    const {displayName, description} = template;
    const IconComponent = template.icon || LayoutGrid;

    // Màu mặc định nếu template không có color class
    const colorClass = template.color || 'bg-blue-100 text-blue-600';

    return (
        <button
            onClick={onClick}
            type="button"
            className={`
                relative flex items-start gap-3 p-4 w-full text-left rounded-xl border transition-all duration-200 group
                ${isSelected
                ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500' // Selected styling
                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md' // Default styling
            }
            `}
        >
            {/* Icon Box */}
            <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300
                ${isSelected ? 'bg-blue-600 text-white scale-105' : `${colorClass} bg-opacity-20`}
            `}>
                <IconComponent className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold truncate pr-2 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {displayName}
                    </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Checkmark (Floating top-right) */}
            {isSelected && (
                <div className="absolute top-3 right-3 text-blue-600 animate-in zoom-in duration-200">
                    <div className="bg-blue-600 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                </div>
            )}
        </button>
    );
};