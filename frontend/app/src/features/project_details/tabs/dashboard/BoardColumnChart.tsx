import React from "react";




interface BoardColumnChartProps {
    boardColumnTasks: any[];
}

export const BoardColumnChart: React.FC<BoardColumnChartProps> = ({ boardColumnTasks }) => {
    const colors = [
        'from-purple-400 to-purple-600',
        'from-blue-400 to-blue-600',
        'from-yellow-400 to-yellow-600',
        'from-green-400 to-green-600',
        'from-red-400 to-red-600',
        'from-pink-400 to-pink-600',
    ];

    const maxTasks = Math.max(...boardColumnTasks.map(c => c.tasks.length), 1);

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Phân bổ theo trạng thái</h3>

            {boardColumnTasks.length > 0 ? (
                <div className="space-y-4">
                    {boardColumnTasks.map((column, index) => {
                        const widthPercentage = (column.tasks.length / maxTasks) * 100;
                        const colorClass = colors[index % colors.length];

                        return (
                            <div key={column.boardColumnId} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700 truncate max-w-[200px]">
                                        {column.name}
                                    </span>
                                </div>

                                <div className="relative h-3 bg-gray-100 rounded-lg overflow-hidden">
                                    <div
                                        className={`absolute left-0 top-0 h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out rounded-lg`}
                                        style={{
                                            width: `${widthPercentage}%`,
                                            transitionDelay: `${index * 100}ms`
                                        }}
                                    >
                                        {column.tasks.length > 0 && widthPercentage > 15 && (
                                            <div className="absolute inset-0 flex items-center px-3">
                                                <span className="text-xs font-medium text-white">
                                                    {column.tasks.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                    Chưa có dữ liệu
                </div>
            )}
        </div>
    );
};




