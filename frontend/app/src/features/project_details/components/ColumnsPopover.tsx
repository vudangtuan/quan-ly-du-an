import type {BoardColumnResponse} from "@/shared/types";
import React, {type ReactNode} from "react";
import * as Popover from "@radix-ui/react-popover";


interface ColumnsPopoverProps {
    columns: BoardColumnResponse[];
    selectedColumnId: string;
    setSelectedColumnId: (memberId: string) => void;
    children: ReactNode;
}

export const ColumnsPopover: React.FC<ColumnsPopoverProps> = ({
                                                                  columns,
                                                                  setSelectedColumnId,
                                                                  selectedColumnId,
                                                                  children
                                                              }) => {
    return (
        <Popover.Root>
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
                        {columns.map((column) => (
                            <label
                                key={column.boardColumnId}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg
                                         hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                                <input
                                    type="radio"
                                    name="column"
                                    value={selectedColumnId}
                                    checked={selectedColumnId === column.boardColumnId}
                                    onChange={() => setSelectedColumnId(column.boardColumnId)}
                                    className="w-4 h-4 text-blue-600 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 select-none">
                                    {column.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}