import React, {useState, useEffect, useMemo} from 'react';
import {
    X,
    ArrowRight,
    LayoutGrid,
    Check,
} from 'lucide-react';
import {getAllTemplates, KanbanTemplate} from "@features/projects/types/kanban-templates";


interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: (template: KanbanTemplate) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          onContinue
                                                                      }) => {
    const templates = useMemo(() => getAllTemplates(), []);
    const [selectedTemplate, setSelectedTemplate] = useState<KanbanTemplate>();


    useEffect(() => {
        if (templates && templates.length > 0) {
            setSelectedTemplate(templates[0])
        }
    }, [templates]);

    if (!isOpen) {
        return null;
    }

    const handleContinue = () => {
        onContinue(selectedTemplate);
    };
    const handClose = ()=>{
        onClose();
        setSelectedTemplate(templates[0]);
    }

    return (
        <div
             className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handClose}
            />
            <div className="relative flex w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
                {/* Header với gradient background */}
                <div
                    className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-start gap-3">
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
                    <button
                        onClick={handClose}
                        className="p-1.5 text-gray-400 rounded-lg hover:bg-white hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto p-6">
                    {/* Templates Grid */}
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

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
                    <button
                        onClick={handClose}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleContinue}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Chọn mẫu và tiếp tục
                        <ArrowRight className="h-4 w-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component con
interface TemplateCardProps {
    template: KanbanTemplate;
    isSelected: boolean;
    onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({template, isSelected, onClick}) => {
    const {displayName, description} = template;

    // Lấy icon và màu dựa trên template name
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