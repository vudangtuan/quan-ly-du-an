import React from "react";



interface PriorityChartProps {
    tasksByPriority: any[];
    totalTasks: number;
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ tasksByPriority, totalTasks }) => {
    const colorMap:Record<string, string> = {
        'LOW': 'from-blue-400 to-blue-600',
        'MEDIUM': 'from-yellow-400 to-yellow-600',
        'HIGH': 'from-red-400 to-red-600'
    };

    const maxTasks = Math.max(...tasksByPriority.map(p => p.tasks.length), 1);

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Phân bổ độ ưu tiên</h3>

            {totalTasks > 0 ? (
                <div>
                    <div className="h-48 flex items-end justify-around gap-6 px-4">
                        {tasksByPriority.map((priority, index) => {
                            const heightPercentage = (priority.tasks.length / maxTasks) * 100;
                            const colorClass = colorMap[priority.name];

                            return (
                                <div key={priority.name} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-1/3 bg-gray-100 rounded-t-lg overflow-hidden relative" style={{height: '160px'}}>
                                        <div
                                            className={`absolute bottom-0 w-full bg-gradient-to-t ${colorClass} rounded-t-lg transition-all duration-1000 ease-out flex items-end justify-center pb-2`}
                                            style={{
                                                height: `${heightPercentage}%`,
                                                transitionDelay: `${index * 150}ms`
                                            }}
                                        >
                                            {priority.tasks.length > 0 && (
                                                <span className="text-white font-semibold text-sm">
                                                    {priority.tasks.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-600 text-center font-medium">
                                        {priority.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Thống kê tổng quan */}
                    <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                        {tasksByPriority.map((priority) => {
                            const percentage = totalTasks > 0
                                ? Math.round((priority.tasks.length / totalTasks) * 100)
                                : 0;

                            return (
                                <div key={priority.name} className="text-center">
                                    <div className="text-xs text-gray-500 mb-1">
                                        {priority.name}
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {percentage}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    Chưa có dữ liệu
                </div>
            )}
        </div>
    );
};