import React, {type ReactNode, useState} from "react";
import * as Popover from "@radix-ui/react-popover";
import type {LabelRequest} from "@/shared/types";
import {Loader2, Palette, Trash2, X} from "lucide-react";
import {LabelBadge} from "@/shared/components";
import {CirclePicker, SketchPicker} from "react-color";
import {useConfirm} from "@/confirm_dialog";


interface LabelPopoverProps {
    label: LabelRequest,
    children: ReactNode;
    title?: string;
    onSubmit: (label: LabelRequest, onSuccess: () => void) => void;
    onDelete?: (onSuccess: () => void) => void;
    isLoadingSubmit?: boolean;
    isLoadingDelete?: boolean;
}


export const LabelPopover: React.FC<LabelPopoverProps> = ({
                                                              label, children, onDelete, isLoadingDelete,
                                                              title, onSubmit, isLoadingSubmit
                                                          }) => {
    const [editLabel, setEditLabel] = useState<LabelRequest>(label);
    const [open, setOpen] = useState(false);
    const handleSetEditLabel = (value: Partial<LabelRequest>) => {
        setEditLabel({...editLabel, ...value});
    }
    const confirm = useConfirm();
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setEditLabel(label);
        }
    }
    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Xóa nhãn?',
            description: `Bạn có chắc chắn muốn xóa không nhãn "${label.name}"?`,
            confirmText: 'Xóa',
            type: 'danger',
            isLoading: isLoadingDelete
        });
        if (confirmed) {
            onDelete!(() => {
                setOpen(false);
            });
        }
    }
    const handleSubmit = () => {
        onSubmit(editLabel, () => setOpen(false));
    }
    return (
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
            <Popover.Trigger asChild>
                {children}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4
                                            data-[state=open]:animate-in data-[state=closed]:animate-out
                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                            duration-300 ease-out"
                    sideOffset={5}
                    align="end"
                    side={"right"}
                    collisionPadding={16}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                        <Popover.Close
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="h-4 w-4"/>
                        </Popover.Close>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                            {label && <LabelBadge label={editLabel}/>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Tên nhãn</label>
                            <input
                                type="text"
                                value={editLabel.name}
                                onChange={(e) =>
                                    handleSetEditLabel({name: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập tên..."
                                autoFocus
                            />
                        </div>
                        <CirclePicker className={"max-w-full"} color={editLabel.color} onChange={(e) => {
                            handleSetEditLabel({color: e.hex})
                        }}/>
                        <div className="flex items-center gap-2 mt-5">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={editLabel.color}
                                    onChange={(e) => {
                                        handleSetEditLabel({color: e.target.value})
                                    }}
                                    className="w-full pr-2 py-1.5 text-xs font-mono border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 uppercase"
                                    maxLength={7}
                                />
                            </div>
                            <div className="" title="Chọn màu tùy chỉnh">
                                <Popover.Root>
                                    <Popover.Trigger asChild>
                                        <div
                                            className="p-1.5 rounded-md border border-gray-300 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors">
                                            <Palette color={editLabel.color} className="h-4 w-4 text-gray-600"/>
                                        </div>
                                    </Popover.Trigger>
                                    <Popover.Content
                                        className="data-[state=open]:animate-in data-[state=closed]:animate-out
                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                            duration-300 ease-out"
                                        sideOffset={5}
                                        side={"right"}
                                        collisionPadding={16}
                                    >
                                        <SketchPicker
                                            color={editLabel.color}
                                            onChange={(e) => {
                                                handleSetEditLabel({color: e.hex})
                                            }}
                                            disableAlpha
                                        />
                                    </Popover.Content>
                                </Popover.Root>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-4">
                            {onDelete &&
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2
                                             text-red-600 bg-red-50 border border-red-100
                                             hover:bg-red-100 hover:border-red-200
                                             rounded-lg transition-all
                                             active:scale-95 group"
                                    title="Xóa nhãn này"
                                >
                                    <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform"/>
                                </button>
                            }
                            <button
                                onClick={handleSubmit}
                                disabled={!editLabel.name.trim()}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2
                                         bg-blue-600 hover:bg-blue-700 text-white
                                         text-xs font-semibold rounded-lg
                                         disabled:bg-gray-300 disabled:cursor-not-allowed
                                         transition-all shadow-sm hover:shadow-md
                                         active:scale-95"
                            >
                                {isLoadingSubmit ?
                                    <Loader2 className={"animate-spin"}/>
                                    : "Lưu"}
                            </button>
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}