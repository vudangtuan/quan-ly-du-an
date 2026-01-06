import type {TaskPriority} from "@/shared/types";
import React from "react";
import * as Popover from "@radix-ui/react-popover";
import {PRIORITY_CONFIG} from "@/utils";

interface PriorityPopoverProps {
    value: TaskPriority,
    setValue: (value: TaskPriority) => void,
    children: React.ReactNode,
}


export const PriorityPopover: React.FC<PriorityPopoverProps> = ({value, setValue, children}) => {
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
                        {Object.entries(PRIORITY_CONFIG).map(([p, config]) => (
                            <button
                                key={p}
                                onClick={() => setValue(p as TaskPriority)}
                                className={`w-full flex items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50`}
                            >
                                <input
                                    type="radio"
                                    name={"priority"}
                                    checked={p === value}
                                    readOnly
                                    className="w-3 h-3"
                                />
                                <span
                                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${config.color} ${config.bgColor} ${config.borderColor} border`}
                                >
                                    {config.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}