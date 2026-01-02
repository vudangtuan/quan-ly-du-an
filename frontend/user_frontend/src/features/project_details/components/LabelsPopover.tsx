import type {LabelResponse} from "@/shared/types";
import * as Popover from "@radix-ui/react-popover";
import React from "react";
import {LabelBadge} from "@/shared/components";


interface LabelsPopoverProps {
    labels: LabelResponse[],
    selectedLabelIds: string[],
    toggleLabels: (id: string) => void,
    children: React.ReactNode,
}

export const LabelsPopover: React.FC<LabelsPopoverProps> = ({labels, selectedLabelIds, toggleLabels, children}) => {
    return (
        <Popover.Root modal>
            <Popover.Trigger asChild>{children}</Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    side={"bottom"}
                    align={"start"}
                    sideOffset={5}
                    onWheel={(e) => e.stopPropagation()}
                    className="bg-white rounded-xl shadow-xl border border-gray-300 p-1.5
                                   data-[state=open]:animate-in data-[state=closed]:animate-out
                                   data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                   data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                   data-[side=bottom]:slide-in-from-top-2 z-1000">
                    <div className={"max-h-40 overflow-y-auto scrollbar-thin space-y-1"}>
                        {labels.map((label) => {
                            const isSelected = selectedLabelIds.includes(label.labelId);
                            return (
                                <button
                                    key={label.labelId}
                                    onClick={() => toggleLabels(label.labelId)}
                                    className={`w-full flex items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                    />
                                    <LabelBadge label={label}/>
                                </button>
                            );
                        })}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}