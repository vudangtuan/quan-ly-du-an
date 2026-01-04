import React from 'react';
import {useQuery} from "@tanstack/react-query";
import {AdminService} from "@/shared/services";
import {Server, RefreshCw} from 'lucide-react';

export const AdminSystem: React.FC = () => {

    const {data: services, isLoading, refetch, isRefetching} = useQuery({
        queryKey: ['admin', 'system-status'],
        queryFn: () => AdminService.getSystemStatus(),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: 60000,
    });


    if (isLoading) {
        return;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Giám sát hệ thống</h2>
                    <p className="text-gray-500">Trạng thái hoạt động của các Microservices</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`}/>
                    Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services?.map((service) => (
                    <div
                        key={service.name}
                        className={`bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${service.status === 'DOWN' ? 'border-red-200 bg-red-50' : ''}`}
                    >
                        <div>
                            <p className="text-sm font-bold text-gray-700">{service.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`relative flex h-3 w-3`}>
                                  <span
                                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${service.status === 'UP' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                  <span
                                      className={`relative inline-flex rounded-full h-3 w-3 ${service.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                </span>
                                <span
                                    className={`font-semibold text-sm ${service.status === 'UP' ? 'text-green-700' : 'text-red-700'}`}>
                                    {service.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">IP: {service.url}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${service.status === 'UP' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Server
                                className={`w-6 h-6 ${service.status === 'UP' ? 'text-green-600' : 'text-red-600'}`}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};