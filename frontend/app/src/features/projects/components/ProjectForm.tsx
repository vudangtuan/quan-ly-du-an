import React, {useState, useEffect} from 'react';
import * as Dialog from "@radix-ui/react-dialog";
import {
    Calendar,
    FolderKanban,
    Layers,
    Tag,
    X,
    Plus,
    Loader2,
    Trash2,
    ArrowLeft
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type {CreateProjectRequest, BoardColumnRequest, LabelRequest} from "@/shared/types";

interface ProjectFormProps {
    isOpen: boolean;
    onOpenChange: () => void;
    onBack: () => void;
    newProject: CreateProjectRequest;
    handleSetValueProject: (value: Partial<CreateProjectRequest>) => void;
    handleCreateProject: () => void;
    isLoading: boolean
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
                                                            isOpen,
                                                            onOpenChange,
                                                            onBack,
                                                            newProject,
                                                            handleSetValueProject,
                                                            handleCreateProject,
                                                            isLoading,
                                                        }) => {

    const [showColumns, setShowColumns] = useState(false);
    const [showLabels, setShowLabels] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowColumns(false);
            setShowLabels(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCreateProject();
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]
                                data-[state=open]:animate-in data-[state=closed]:animate-out
                                data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"/>

                <Dialog.Content
                    className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%]
                                translate-y-[-50%] bg-white rounded-xl shadow-2xl
                                w-[95vw] max-w-lg max-h-[90vh] flex flex-col
                                outline-none border border-gray-100
                                data-[state=open]:animate-in data-[state=closed]:animate-out
                                data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                duration-200 ease-out"
                >

                    {/* --- HEADER --- */}
                    <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                            <FolderKanban className="w-5 h-5 text-blue-600"/>
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                            <input
                                value={newProject.name}
                                onChange={(e) => handleSetValueProject({name: e.target.value})}
                                type="text"
                                placeholder="Tên dự án"
                                className="w-full bg-transparent font-medium text-gray-900
                                          placeholder-gray-400 outline-none"
                                autoFocus
                            />
                        </div>

                        <Dialog.Close asChild>
                            <button
                                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100
                                    hover:text-gray-600 transition-colors flex-shrink-0"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* --- BODY FORM --- */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

                        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1 scrollbar-thin">

                            {/* Description */}
                            <div>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => handleSetValueProject({description: e.target.value})}
                                    placeholder="Thêm mô tả..."
                                    rows={3}
                                    className="w-full bg-transparent text-sm text-gray-600
                                              placeholder-gray-300 outline-none resize-none leading-relaxed"
                                />
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-50 w-full"></div>

                            {/* Action Chips */}
                            <div className="flex flex-wrap items-center gap-2.5">

                                {/* Date Picker*/}
                                <DatePicker
                                    selected={newProject.dueAt ? new Date(newProject.dueAt) : null}
                                    onChange={(date) => handleSetValueProject({dueAt: date ? date.toISOString() : undefined})}
                                    minDate={new Date()}
                                    dateFormat="dd/MM/yyyy"
                                    customInput={
                                        <button
                                            type="button"
                                            className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-semibold transition-all border
                                                    ${newProject.dueAt
                                                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                                                `}
                                        >
                                            <Calendar className="w-3.5 h-3.5"/>
                                            {newProject.dueAt ? new Date(newProject.dueAt).toLocaleDateString('vi-VN') : 'Hạn chót'}
                                            {newProject.dueAt && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSetValueProject({dueAt: undefined});
                                                    }}
                                                    className="p-0.5 rounded-full transition-colors z-10"
                                                    title="Xóa ngày"
                                                >
                                                    <X className="w-3 h-3 text-red-500" />
                                                </div>
                                            )}
                                        </button>
                                    }
                                />

                                {/* Toggle Columns */}
                                <button
                                    type="button"
                                    onClick={() => setShowColumns(!showColumns)}
                                    className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-semibold transition-all border
                                        ${showColumns
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                                    `}
                                >
                                    <Layers className="w-3.5 h-3.5"/>
                                    {newProject.boardColumns.length > 0 ? `${newProject.boardColumns.length} Cột` : 'Cấu hình cột'}
                                </button>

                                {/* Toggle Labels */}
                                <button
                                    type="button"
                                    onClick={() => setShowLabels(!showLabels)}
                                    className={`px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-semibold transition-all border
                                        ${showLabels
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                                    `}
                                >
                                    <Tag className="w-3.5 h-3.5"/>
                                    {newProject.labels.length > 0 ? `${newProject.labels.length} Nhãn` : 'Nhãn màu'}
                                </button>
                            </div>

                            {/* Dynamic Sections */}
                            {showColumns && (
                                <ConfigListSection
                                    title="Quy trình làm việc (Kanban)"
                                    items={newProject.boardColumns}
                                    onAdd={() => {
                                        const newCol: BoardColumnRequest = {
                                            name: `Cột ${newProject.boardColumns.length + 1}`,
                                            sortOrder: newProject.boardColumns.length + 1
                                        };
                                        handleSetValueProject({boardColumns: [...newProject.boardColumns, newCol]});
                                    }}
                                    onChange={(val, idx) => {
                                        const cols = [...newProject.boardColumns];
                                        cols[idx].name = val;
                                        handleSetValueProject({boardColumns: cols});
                                    }}
                                    onDelete={(idx) => {
                                        handleSetValueProject({boardColumns: newProject.boardColumns.filter((_, i) => i !== idx)});
                                    }}
                                />
                            )}

                            {showLabels && (
                                <ConfigListSection
                                    title="Nhãn"
                                    items={newProject.labels}
                                    isLabel={true}
                                    onAdd={() => {
                                        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899'];
                                        const newLabel: LabelRequest = {
                                            name: `Nhãn ${newProject.labels.length + 1}`,
                                            color: colors[Math.floor(Math.random() * colors.length)]
                                        };
                                        handleSetValueProject({labels: [...newProject.labels, newLabel]});
                                    }}
                                    onChange={(val, idx, type) => {
                                        const lbls = [...newProject.labels];
                                        if (type === 'color') lbls[idx].color = val;
                                        else lbls[idx].name = val;
                                        handleSetValueProject({labels: lbls});
                                    }}
                                    onDelete={(idx) => {
                                        handleSetValueProject({labels: newProject.labels.filter((_, i) => i !== idx)});
                                    }}
                                />
                            )}

                        </div>

                        {/* --- FOOTER --- */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                            {/* Nút Quay lại bên trái */}
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500
                                           hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4"/>
                                Quay lại
                            </button>

                            {/* Nút Tạo bên phải */}
                            <button
                                type="submit"
                                disabled={!newProject.name.trim() || isLoading}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white
                                      bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm
                                      transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                                Tạo dự án
                            </button>
                        </div>

                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// --- Helper Component ---
interface ConfigListSectionProps {
    title: string;
    items: any[];
    isLabel?: boolean;
    onAdd: () => void;
    onDelete: (index: number) => void;
    onChange: (value: string, index: number, type?: 'name' | 'color') => void;
}

const ConfigListSection: React.FC<ConfigListSectionProps> = ({
                                                                 title, items, isLabel = false, onAdd, onDelete, onChange
                                                             }) => {
    return (
        <div className="space-y-3 bg-gray-50/80 p-4 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
                <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold
                               text-blue-600 hover:text-blue-700 hover:bg-blue-50
                               rounded border border-transparent hover:border-blue-100 transition-all"
                >
                    <Plus className="w-3 h-3"/>
                    THÊM
                </button>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {items.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">Chưa có mục nào được tạo.</p>
                )}
                {items.map((item, index) => (
                    <div key={index} className="flex group items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        {isLabel && (
                            <input
                                type="color"
                                value={item.color}
                                onChange={(e) => onChange(e.target.value, index, 'color')}
                                className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent flex-shrink-0"
                            />
                        )}
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => onChange(e.target.value, index, 'name')}
                            placeholder={isLabel ? "Tên nhãn..." : "Tên cột..."}
                            className="flex-1 px-2 py-1 text-sm text-gray-700 font-medium
                                       bg-transparent border-none focus:ring-0 placeholder-gray-400"
                        />
                        <button
                            type="button"
                            onClick={() => onDelete(index)}
                            className="p-1.5 text-gray-300 hover:text-red-500
                                       hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};