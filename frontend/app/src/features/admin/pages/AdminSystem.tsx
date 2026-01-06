import React from 'react';
import {useQuery} from "@tanstack/react-query";
import {AdminService} from "@/shared/services";
import {Server, Database, Clock} from 'lucide-react';

export const AdminSystem: React.FC = () => {

    const {data: services, isLoading} = useQuery({
        queryKey: ['admin', 'system-status'],
        queryFn: () => AdminService.getSystemStatus(),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu hệ thống...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {services?.map((service) => {
                    const isUp = service.status === 'UP';
                    const memPercent = (service.memoryUsed && service.memoryMax)
                        ? Math.round((service.memoryUsed / service.memoryMax) * 100)
                        : 0;


                    let memColor = 'bg-blue-500';
                    if (memPercent > 70) memColor = 'bg-yellow-500';
                    if (memPercent > 90) memColor = 'bg-red-500';

                    return (
                        <div
                            key={service.name}
                            className={`bg-white rounded-xl border shadow-sm transition-all hover:shadow-md overflow-hidden ${!isUp ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                        >
                            {/* Header Card */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <Server className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">{service.name}</h3>
                                        <div className="flex items-center gap-2 text-xs mt-0.5">
                                            <span className={`flex w-2 h-2 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className={`${isUp ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}`}>
                                                {service.status}
                                            </span>
                                            <span className="text-gray-400">|</span>
                                            <span className="text-gray-500">{service.url}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Body Card - Chỉ hiện khi Service UP */}
                            {isUp && (
                                <div className="p-4 space-y-4">
                                    {/* Uptime */}
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-gray-400"/>
                                            <span>Uptime:</span>
                                        </div>
                                        <span className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                            {service.uptime || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Database Status */}
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Database className="w-3.5 h-3.5 text-gray-400"/>
                                            <span>Database:</span>
                                        </div>
                                        <span className={`font-medium px-2 py-0.5 rounded 
                                            ${service.databaseStatus === 'UP' ? 'bg-green-100 text-green-700' :
                                            service.databaseStatus === 'N/A' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                                            {service.databaseStatus || 'UNKNOWN'}
                                        </span>
                                    </div>

                                    {/* RAM Usage Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Memory (RAM)</span>
                                            <span className="font-medium text-gray-700">
                                                {service.memoryUsed}MB / {service.memoryMax}MB ({memPercent}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${memColor}`}
                                                style={{ width: `${memPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Body Card - Khi Service DOWN */}
                            {!isUp && (
                                <div className="p-4 text-center">
                                    <p className="text-red-500 text-sm italic">Không tìm thấy service instance nào hoạt động.</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};