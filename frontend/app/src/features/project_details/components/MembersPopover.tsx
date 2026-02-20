import type {ProjectMemberResponse} from "@/shared/types";
import React, {useMemo} from "react";
import * as Popover from "@radix-ui/react-popover";
import {Avatar} from "@/shared/components";


interface MembersPopoverProps {
    members: ProjectMemberResponse[],
    selectedMemberIds: string[],
    toggleMembers: (memberId: string) => void,
    children: React.ReactNode,
}

export const MembersPopover: React.FC<MembersPopoverProps> =
    ({members, selectedMemberIds, toggleMembers, children}) => {
        const mems = useMemo(() => {
            return members.filter(m => m.roleInProject !== 'OBSERVER');
        }, [members]);
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
                            {mems.map(member => {
                                const isSelected = selectedMemberIds.includes(member.userId);
                                return (
                                    <button
                                        key={member.userId}
                                        onClick={() => toggleMembers(member.userId)}
                                        className={`w-full flex items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                        />
                                        <Avatar userId={member.userId} fullName={member.fullName} className="h-5 w-5"/>
                                        <span className="text-xs">{member.fullName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        );
    }