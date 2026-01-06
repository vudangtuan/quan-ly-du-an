import React from "react";
import {Avatar} from "@/shared/components";
import {isOverdue} from "@/utils";


interface MemberTasksChartProps {
    memberTasks: any[];
}

export const MemberTasksChart: React.FC<MemberTasksChartProps> = ({memberTasks}) => {
    const maxTasks = Math.max(...memberTasks.map(m => m.tasks.length), 1);

    return (
        <div className="h-fit bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Nhiệm vụ theo thành viên</h3>

            {memberTasks.length > 0 ? (
                <div className="space-y-4">
                    {memberTasks.map((member) => {
                        const percentage = (member.tasks.length / maxTasks) * 100;
                        const completedCount = member.tasks.filter((t:any) => t.completed).length;
                        const overdueCount = member.tasks.filter((t:any) => isOverdue(t.dueAt, t.completed)).length;
                        const completedPercentage = member.tasks.length > 0 ? Math.round((completedCount / member.tasks.length) * 100) : 0;
                        const overduePercentage = member.tasks.length > 0 ? Math.round((overdueCount / member.tasks.length) * 100) : 0;

                        return (
                            <div key={member.userId} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex gap-2 items-center justify-center">
                                        <Avatar fullName={member.fullName} className="h-8 w-8"/>
                                        <span className="text-sm font-semibold">{member.fullName}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-green-600 font-medium">
                                            {completedCount} hoàn thành
                                        </span>
                                        {overdueCount > 0 && (
                                            <span className="text-red-600 font-medium">
                                                {overdueCount} quá hạn
                                            </span>
                                        )}
                                        <span className="text-gray-500">
                                            / {member.tasks.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative h-3 bg-gray-100 rounded-lg overflow-hidden">
                                    {/* Thanh tổng số nhiệm vụ (nền xanh nhạt) */}
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000 ease-out"
                                        style={{width: `${percentage}%`}}
                                    />

                                    {/* Thanh quá hạn (đỏ) - hiển thị trước */}
                                    {overdueCount > 0 && (
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000 ease-out delay-200"
                                            style={{width: `${(overdueCount / maxTasks) * 100}%`}}
                                        >
                                            {/* Label cho quá hạn */}
                                            {overduePercentage >= 10 && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                                        {overduePercentage}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Thanh đã hoàn thành (xanh lá) - hiển thị sau */}
                                    {completedCount > 0 && (
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 ease-out delay-100"
                                            style={{width: `${(completedCount / maxTasks) * 100}%`}}
                                        >
                                            {/* Label cho hoàn thành */}
                                            {completedPercentage >= 10 && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-white drop-shadow-lg">
                                                        {completedPercentage}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                    Chưa có thành viên được phân công nhiệm vụ
                </div>
            )}

            {/* Chú thích */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-gray-600">Tổng nhiệm vụ</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-gray-600">Đã hoàn thành</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-gray-600">Quá hạn</span>
                </div>
            </div>
        </div>
    );
};