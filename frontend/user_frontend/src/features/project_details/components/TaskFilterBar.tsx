import type {ProjectMemberResponse, TaskPriority} from "@/shared/types";
import React from "react";
import {CalendarDays, CheckCircle, Clock, ListFilter, Search, Settings2, Sun, Timer} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import {PRIORITY_CONFIG} from "@/utils";
import {Avatar} from "@/shared/components";
import DatePicker from "react-datepicker";
import type {DateRange, DateStatus} from "@/shared/hooks";


interface TaskFilterBarProps {
    filterAssignees: string[];
    filterLabels: string[];
    filterPriorities: TaskPriority[];
    searchTerm: string,
    dateRange: DateRange,
    handleSetDateRange: (data: DateRange) => void,
    toggleAssigneeFilter: (assignee: string) => void,
    toggleLabelFilter: (label: string) => void,
    togglePriorityFilter: (priority: TaskPriority) => void,
    handleSearchTermChange: (term: string) => void,
    clearFilters: () => void,
    isFiltered: boolean,
    allMembers: ProjectMemberResponse[],
    dateStatus: DateStatus,
    handleSetDateStatus: (dateStatus: DateStatus) => void,
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = (props) => {

    return (
        <div className="bg-white rounded shadow-sm border border-gray-200 h-7 px-3 flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-1.5">
                <Search className={"h-4 w-4 text-gray-600"}/>
                <input
                    value={props.searchTerm}
                    onChange={(e) => {
                        props.handleSearchTermChange(e.target.value)
                    }}
                    type="text"
                    placeholder="Tìm kiếm"
                    className="text-xs outline-none border-none focus:ring-0 p-0 bg-transparent w-32"
                />
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <Popover.Root>
                <Popover.Trigger asChild>
                    <button
                        className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-50 transition-colors text-gray-700">
                        <ListFilter className="w-4 h-4"/>
                        {props.isFiltered && (
                            <div
                                className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                                <span className="text-[10px] text-blue-700 font-medium">
                                    {[
                                        props.filterPriorities.length > 0,
                                        props.filterAssignees.length > 0,
                                        props.dateRange !== null,
                                        props.dateStatus !== null,
                                    ].filter(Boolean).length}
                                </span>
                            </div>
                        )}
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        side={"bottom"}
                        align={"start"}
                        sideOffset={5}
                        className="bg-white rounded-xl shadow-xl border border-gray-200 p-1.5
                                   data-[state=open]:animate-in data-[state=closed]:animate-out
                                   data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                   data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                   data-[side=bottom]:slide-in-from-top-2">
                        <div className={"space-y-1"}>
                            {props.allMembers.map(member => {
                                const isSelected = props.filterAssignees.includes(member.userId);
                                return (
                                    <button
                                        key={member.userId}
                                        onClick={() => props.toggleAssigneeFilter(member.userId)}
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
                            <div className={"h-0.5 w-full bg-gray-200"}/>
                            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                                const isSelected = props.filterPriorities.includes(key as TaskPriority);
                                return (
                                    <button
                                        key={key}
                                        onClick={() => props.togglePriorityFilter(key as TaskPriority)}
                                        className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="w-3 h-3 rounded border-gray-300 text-blue-600"
                                        />
                                        <span>
                                            {config.label}
                                         </span>
                                    </button>
                                );
                            })}
                            <div className={"h-0.5 w-full bg-gray-200"}/>
                            <button
                                onClick={() => {
                                    props.handleSetDateStatus('OVERDUE')
                                }}
                                className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                <input
                                    checked={props.dateStatus === 'OVERDUE'}
                                    type="radio"
                                    name={"DateStatus"}
                                    readOnly
                                    className="w-3 h-3"
                                />
                                <Timer className="w-3.5 h-3.5 text-red-500"/>
                                <span>Quá hạn</span>
                            </button>

                            <button
                                onClick={() => {
                                    props.handleSetDateStatus('COMPLETED')
                                }}
                                className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                <input
                                    checked={props.dateStatus === 'COMPLETED'}
                                    type="radio"
                                    name={"DateStatus"}
                                    readOnly
                                    className="w-3 h-3"
                                />
                                <CheckCircle className="w-3.5 h-3.5 text-green-500"/>
                                <span>Đã hoàn thành</span>
                            </button>

                            <div className={"h-0.5 w-full bg-gray-200"}/>
                            <button
                                onClick={() => {
                                    props.handleSetDateRange('TODAY')
                                }}
                                className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                <input
                                    checked={props.dateRange === 'TODAY'}
                                    type="radio"
                                    name={"DateRange"}
                                    readOnly
                                    className="w-3 h-3"
                                />
                                <Sun className="w-3.5 h-3.5 text-orange-500"/>
                                <span>Hôm nay</span>
                            </button>

                            <button
                                onClick={() => {
                                    props.handleSetDateRange('WEEK')
                                }}
                                className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                <input
                                    checked={props.dateRange === 'WEEK'}
                                    type="radio"
                                    name={"DateRange"}
                                    readOnly
                                    className="w-3 h-3"
                                />
                                <Clock className="w-3.5 h-3.5 text-indigo-500"/>
                                <span>Tuần này</span>
                            </button>

                            <button
                                onClick={() => {
                                    props.handleSetDateRange('MONTH')
                                }}
                                className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                <input
                                    checked={props.dateRange === 'MONTH'}
                                    type="radio"
                                    name={"DateRange"}
                                    readOnly
                                    className="w-3 h-3"
                                />
                                <CalendarDays className="w-3.5 h-3.5 text-purple-500"/>
                                <span>Tháng này</span>
                            </button>

                            <div>
                                <div
                                    className={`w-full py-1 px-2 flex text-xs items-center gap-1 transition-colors hover:bg-gray-50`}>
                                    <div className="flex items-center gap-1">
                                        <input
                                            checked={typeof props.dateRange === 'object' && props.dateRange !== null}
                                            type="radio"
                                            name={"DateRange"}
                                            readOnly
                                            className="w-3 h-3"
                                        />
                                        <Settings2 className="w-3.5 h-3.5 text-gray-500"/>
                                        <span>Tùy chỉnh</span>
                                    </div>
                                </div>
                                <div className={"space-x-2 flex"}>
                                    <DatePicker
                                        onChange={date => {
                                            if (typeof props.dateRange === 'object' && props.dateRange !== null) {
                                                props.handleSetDateRange({
                                                    ...props.dateRange,
                                                    start: date,
                                                });
                                            } else {
                                                props.handleSetDateRange({
                                                    start: date,
                                                    end: null,
                                                });
                                            }
                                        }}
                                        selected={typeof props.dateRange === 'object' && props.dateRange !== null ? props.dateRange.start : null}
                                        className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        isClearable
                                        placeholderText={"Start date"}
                                    />
                                    <DatePicker
                                        onChange={date => {
                                            if (typeof props.dateRange === 'object' && props.dateRange !== null) {
                                                props.handleSetDateRange({
                                                    ...props.dateRange,
                                                    end: date,
                                                });
                                            } else {
                                                props.handleSetDateRange({
                                                    start: null,
                                                    end: date,
                                                });
                                            }
                                        }}
                                        selected={typeof props.dateRange === 'object' && props.dateRange !== null ? props.dateRange.end : null}
                                        className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        isClearable
                                        placeholderText={"End date"}
                                    />
                                </div>
                            </div>
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            {props.isFiltered && (
                <>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <button
                        onClick={props.clearFilters}
                        className="flex items-center px-2 py-1 text-xs hover:bg-red-50
                                 transition-colors text-red-600 hover:text-red-700 font-medium"
                    >
                        <span>Clear</span>
                    </button>
                </>
            )}
        </div>
    );
}