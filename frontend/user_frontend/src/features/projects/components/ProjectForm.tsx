import type {BoardColumnRequest, CreateProjectRequest, LabelRequest} from "@/shared/types";
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {AlignLeft, ArrowLeft, Calendar, FileText, Layers, Loader2, Plus, Tag, Trash2, X} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


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
                            <h2 className="text-lg font-semibold text-gray-900">Tạo dự án mới</h2>
                        </Dialog.Title>
                        <Dialog.Close
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <X className="h-5 w-5 text-gray-400"/>
                        </Dialog.Close>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh] p-5 space-y-5">
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-500"/>
                                Tên dự án <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newProject.name}
                                onChange={(e) => {
                                    handleSetValueProject({name: e.target.value});
                                }}
                                placeholder="Nhập tên dự án..."
                                className={`w-full px-3 py-2 text-sm border rounded-lg 
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                                outline-none transition-all`}
                                autoFocus
                            />
                            {/*{errors.name && (*/}
                            {/*    <p className="text-xs text-red-600 mt-1">{errors.name}</p>*/}
                            {/*)}*/}
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <AlignLeft className="h-3.5 w-3.5 text-blue-500"/>
                                Mô tả
                            </label>
                            <textarea
                                value={newProject.description}
                                onChange={(e) => handleSetValueProject({
                                    description: e.target.value,
                                })}
                                rows={3}
                                placeholder="Mô tả chi tiết về dự án..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                outline-none transition-all resize-none"
                            />
                        </div>

                        {/*dueAt*/}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <Calendar className="h-3.5 w-3.5 text-blue-500"/>
                                Hạn chót
                            </label>
                            <DatePicker
                                className={"focus:ring-blue-500/20 focus:border-blue-500 border-gray-300 rounded-lg focus:ring-2 outline-none transition-all"}
                                isClearable
                                minDate={new Date()}
                                selected={newProject.dueAt ? new Date(newProject.dueAt) : null}
                                onChange={(date) => handleSetValueProject({dueAt: date ? date.toLocaleString() : null})}
                                placeholderText={"Chọn ngày"}
                            />
                        </div>

                        {/* Cột Kanban */}
                        <div>
                            <div className="flex items-center w-fit gap-2 justify-between mb-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                    <Layers className="h-3.5 w-3.5 text-blue-500"/>
                                    Kanban ({newProject.boardColumns.length})
                                </label>
                                <button
                                    onClick={() => {
                                        const newColumn: BoardColumnRequest = {
                                            name: `Cột ${newProject.boardColumns.length + 1}`,
                                            sortOrder: newProject.boardColumns.length + 1
                                        };
                                        handleSetValueProject({boardColumns: [...newProject.boardColumns, newColumn]})
                                    }}
                                    className="p-1 border border-dashed rounded-full
                                    hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                    <Plus className="h-4 w-4"/>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {newProject.boardColumns.map((column, index) => (
                                    <div key={index} className="flex w-fit gap-2">
                                        <input
                                            type="text"
                                            value={column.name}
                                            onChange={(e) => {
                                                handleSetValueProject({
                                                    boardColumns: newProject.boardColumns.map(
                                                        (bc, i) => {
                                                            if (i === index) {
                                                                return {
                                                                    ...bc,
                                                                    name: e.target.value,
                                                                }
                                                            }
                                                            return bc;
                                                        }
                                                    )
                                                });
                                            }}
                                            placeholder="Tên cột..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSetValueProject({
                                                    boardColumns:
                                                        newProject.boardColumns
                                                            .filter((_, i) => i !== index)
                                                })
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Nhãn */}
                        <div>
                            <div className="flex justify-start gap-3 items-center mb-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                    <Tag className="h-3.5 w-3.5 text-blue-500"/>
                                    Nhãn ({newProject.labels.length})
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                        const newLabel: LabelRequest = {
                                            name: `Nhãn ${newProject.labels.length + 1}`,
                                            color: randomColor
                                        };
                                        handleSetValueProject({
                                            labels: [
                                                ...newProject.labels, newLabel
                                            ]
                                        })
                                    }}
                                    className="p-1 border border-dashed rounded-full
                                    hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                    <Plus className="h-4 w-4"/>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {newProject.labels.map((label, index) => (
                                    <div key={index} className="flex w-fit items-center gap-2">
                                        <input
                                            type="color"
                                            value={label.color}
                                            onChange={(e) => {
                                                handleSetValueProject({
                                                    labels: newProject.labels.map((l, i) => {
                                                        if (i === index) {
                                                            return {
                                                                ...l,
                                                                color: e.target.value,
                                                            }
                                                        }
                                                        return l;
                                                    })
                                                })
                                            }}
                                            className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={label.name}
                                            onChange={(e) => {
                                                handleSetValueProject({
                                                    labels: newProject.labels.map((l, i) => {
                                                        if (i === index) {
                                                            return {
                                                                ...l,
                                                                name: e.target.value,
                                                            }
                                                        }
                                                        return l;
                                                    })
                                                })
                                            }}
                                            placeholder="Tên nhãn..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSetValueProject({
                                                    labels: newProject.labels
                                                        .filter((_, i) => i !== index)
                                                })
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50/50 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onBack}
                            // disabled={createProjectMutation.isPending}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700
                            bg-white border border-gray-300 rounded-lg hover:bg-gray-50
                            transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4"/>
                            Quay lại
                        </button>

                        <button
                            onClick={handleCreateProject}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-3 py-2 text-sm
                            font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4"/>
                                    Tạo dự án
                                </>
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}