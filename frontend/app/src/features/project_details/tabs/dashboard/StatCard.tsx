import React from "react";
import type {LucideIcon} from "lucide-react";

interface StatCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    bgColor: string;
    hoverBgColor: string;
    iconColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
                                                      title,
                                                      value,
                                                      icon: Icon,
                                                      bgColor,
                                                      hoverBgColor,
                                                      iconColor
                                                  }) => {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all group">
            <div className="text-sm font-semibold text-gray-600 mb-3">{title}</div>
            <div className="flex items-center gap-3">
                <div className={`p-2 ${bgColor} rounded-lg group-hover:${hoverBgColor} transition-colors`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <span className="text-3xl font-bold text-gray-900">{value}</span>
            </div>
        </div>
    );
};