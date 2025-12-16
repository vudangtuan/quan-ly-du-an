import * as Dialog from "@radix-ui/react-dialog";
import React, {type FormEvent, type ReactNode, useState} from "react";
import {X, Calendar, CheckSquare, Layers, Users, Tag, Plus, Trash2, Flag, Loader2} from "lucide-react";
import {ColumnsPopover, LabelsPopover, MembersPopover, PriorityPopover} from "@/features/project_details/components";
import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import {useCreateTask} from "@/features/project_details/hooks";
import DatePicker from "react-datepicker";
import {PRIORITY_CONFIG} from "@/utils";

interface TaskCreationFormProps {
    children: ReactNode;
    columnId?: string
}

export const TaskCreationForm: React.FC<TaskCreationFormProps> = ({children, columnId}) => {
    const {projectDetail} = useOutletContext<ProjectDetailContext>();
    const {
        selectedLabelIds, handleToggleLabel,
        title, setTitle,
        description, setDescription,
        selectedMemberIds, handleToggleMember,
        setSelectedColumnId, selectedColumnId,
        overDate, setOverDate,
        checkLists, handleAddCheckList, handleDeleteCheckList, handleEditCheckList,
        handleCancel, error, handleCreateTask, creatTaskMutation,
        priority, setPriority, closeButtonRef
    } = useCreateTask(projectDetail.projectId);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleCreateTask();
    }

    return (
        <Dialog.Root onOpenChange={open => {
            if (!open) {
                handleCancel();
            } else {
                if (columnId && projectDetail.boardColumns.map(b => b.boardColumnId).includes(columnId)) {
                    setSelectedColumnId(columnId);
                } else {
                    setSelectedColumnId(projectDetail.boardColumns[0].boardColumnId);
                }
            }
        }}>
            <Dialog.Trigger asChild>
                {children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in
                                data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                                 data-[state=open]:fade-in-0 duration-200"/>
                <Dialog.Title></Dialog.Title>
                <Dialog.Content
                    aria-describedby={""}
                    className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%]
                                translate-y-[-50%] bg-white rounded-xl shadow-2xl
                                w-[90%] sm:w-md max-w-2xl max-h-[90vh] flex flex-col
                                data-[state=open]:animate-in data-[state=closed]:animate-out
                                data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                duration-200 ease-out border border-gray-200">

                    {/* Header */}
                    <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-200">
                        <div
                            className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Layers className="w-6 h-6 text-green-600"/>
                        </div>

                        <div className="flex-1 min-w-0">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                type="text"
                                placeholder="Tên nhiệm vụ"
                                className="w-full bg-transparent font-medium text-gray-900
                                          placeholder-gray-400 outline-none"
                                autoFocus
                            />
                        </div>

                        <Dialog.Close asChild>
                            <button
                                ref={closeButtonRef}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100
                                    hover:text-gray-600 transition-colors flex-shrink-0"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <div className="overflow-y-auto px-6 py-4 space-y-6 flex-1 max-h-[60vh] scrollbar-thin">
                            {/* Description */}
                            <div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Thêm mô tả..."
                                    rows={3}
                                    className="w-full bg-transparent text-sm text-gray-700
                                              placeholder-gray-400 outline-none resize-none"
                                />
                            </div>

                            <ChecklistSection
                                checkLists={checkLists}
                                onAdd={handleAddCheckList}
                                onEdit={handleEditCheckList}
                                onDelete={handleDeleteCheckList}
                            />

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">


                                <MembersPopover members={projectDetail.members}
                                                selectedMemberIds={selectedMemberIds}
                                                toggleMembers={handleToggleMember}>
                                    <button
                                        type="button"
                                        className="p-2 relative bg-gray-100 hover:bg-gray-200 rounded-lg
                                              transition-colors group"
                                        title="Assignees"
                                    >
                                        <Users className="w-5 h-5 text-gray-600 group-hover:text-gray-800"/>
                                        {selectedMemberIds.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white
                                                               text-xs font-medium min-w-[18px] h-[18px]
                                                               rounded-full flex items-center justify-center px-1">
                                                {selectedMemberIds.length}
                                            </span>
                                        )}
                                    </button>
                                </MembersPopover>


                                <LabelsPopover labels={projectDetail.labels}
                                               selectedLabelIds={selectedLabelIds}
                                               toggleLabels={handleToggleLabel}>
                                    <button
                                        type="button"
                                        className="p-2 relative bg-gray-100 hover:bg-gray-200 rounded-lg
                                              transition-colors group"
                                        title="Labels"
                                    >
                                        <Tag className="w-5 h-5 text-gray-600 group-hover:text-gray-800"/>
                                        {selectedLabelIds.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white
                                                               text-xs font-medium min-w-[18px] h-[18px]
                                                               rounded-full flex items-center justify-center px-1">
                                                {selectedLabelIds.length}
                                            </span>
                                        )}
                                    </button>
                                </LabelsPopover>

                                <PriorityPopover value={priority} setValue={setPriority}>
                                    <button
                                        type="button"
                                        className={`p-2 flex items-center gap-1 rounded-lg
                                              transition-colors group ${PRIORITY_CONFIG[priority].bgColor}`}
                                        title="Priority"
                                    >
                                        <Flag className={`w-5 h-5 ${PRIORITY_CONFIG[priority].color}`}/>
                                    </button>
                                </PriorityPopover>
                            </div>
                        </div>

                        {error && (
                            <div className="px-3 py-1 bg-red-50 border border-red-200">
                                <p className="text-sm font-medium text-red-600">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <div className={"flex items-center gap-2"}>
                                <ColumnsPopover
                                    columns={projectDetail.boardColumns}
                                    selectedColumnId={selectedColumnId}
                                    setSelectedColumnId={setSelectedColumnId}
                                >
                                    <button
                                        type="button"
                                        title="Kanban"
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                                                   text-gray-700 hover:text-gray-900 rounded-lg
                                                   bg-gray-100 transition-colors">
                                        <Layers className="w-4 h-4"/>
                                        {projectDetail.boardColumns.find(bc => bc.boardColumnId === selectedColumnId)?.name}
                                    </button>
                                </ColumnsPopover>
                                <DatePicker
                                    selected={overDate}
                                    onChange={setOverDate}
                                    clearButtonClassName="!absolute !-right-3 !-top-3"
                                    isClearable
                                    minDate={new Date()}
                                    customInput={
                                        <button
                                            title="Due date"
                                            type="button"
                                            className="p-2 flex gap-1 items-center text-gray-600 hover:text-gray-800 rounded-lg
                                                            border border-gray-300 hover:bg-gray-50 transition-colors"
                                        >
                                            <Calendar className="w-4 h-4"/>
                                            {overDate && (
                                                <span className="text-sm text-gray-700">
                                                        {overDate.toLocaleDateString()}
                                                </span>
                                            )}
                                        </button>
                                    }
                                />

                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white
                                          bg-indigo-600 hover:bg-indigo-700 rounded-lg
                                          transition-colors"
                            >
                                {creatTaskMutation.isPending ?
                                    <Loader2 className={"animate-spin"}/> :
                                    "Lưu"
                                }
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}


interface ChecklistSectionProps {
    checkLists: string[];
    onAdd: () => void;
    onEdit: (name: string, index: number) => void;
    onDelete: (index: number) => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
                                                                      checkLists,
                                                                      onAdd,
                                                                      onEdit,
                                                                      onDelete
                                                                  }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    const handleStartEdit = (index: number, currentValue: string) => {
        setEditingIndex(index);
        setEditValue(currentValue);
    };

    const handleSaveEdit = (index: number) => {
        if (editValue.trim()) {
            onEdit(editValue, index);
        }
        setEditingIndex(null);
        setEditValue("");
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditValue("");
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-gray-600"/>
                    <h3 className="text-sm font-medium text-gray-900">
                        Danh sách công việc
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                               text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50
                               rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4"/>
                    Thêm mục
                </button>
            </div>

            {/* Checklist Items */}
            {checkLists.length > 0 && (
                <div className="space-y-2">
                    {checkLists.map((item, index) => (
                        <div
                            key={index}
                            className="flex group items-center gap-2 p-2 rounded-lg
                                       bg-gray-50 hover:bg-gray-100 transition-colors">
                            {editingIndex === index ? (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveEdit(index);
                                            } else if (e.key === 'Escape') {
                                                handleCancelEdit();
                                            }
                                        }}
                                        onBlur={() => handleSaveEdit(index)}
                                        className="flex-1 px-2 py-1 text-sm text-gray-900
                                                   bg-white border border-indigo-300 rounded"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <>
                                    <span
                                        onClick={() => handleStartEdit(index, item)}
                                        className="flex-1 text-sm text-gray-700 cursor-pointer"
                                    >
                                        {item}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(index)}
                                        className="p-1 text-red-400 hover:text-red-600
                                                   hover:bg-red-50 rounded transition-colors
                                                   opacity-0 group-hover:opacity-100"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};