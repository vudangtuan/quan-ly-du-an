

interface ProgressChartProps {
    completedTasks: number;
    totalTasks: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ completedTasks, totalTasks }) => {
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const strokeDasharray = (completedTasks / totalTasks) * 351.86;

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ dự án</h3>
            <div className="flex items-center justify-center">
                {/* Biểu đồ tròn */}
                <div className="relative w-32 h-32">
                    {/* Vòng tròn nền */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="12"
                        />
                        {/* Vòng tròn tiến độ */}
                        <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${strokeDasharray} 351.86`}
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981"/>
                                <stop offset="100%" stopColor="#3b82f6"/>
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Text ở giữa */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">
                            {percentage}%
                        </span>
                        <span className="text-xs text-gray-500">Hoàn thành</span>
                    </div>
                </div>
            </div>
        </div>
    );
};