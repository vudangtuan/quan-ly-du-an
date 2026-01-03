import React, {useState} from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {AdminService} from "@/shared/services";


export const AdminDashBoard: React.FC = () => {
    const [months, setMonths] = useState(1);
    const queryClient = useQueryClient();


    const {data: dashboardData, isLoading} = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: () => AdminService.getUserStats(months),
        enabled: !!months
    })

    if (isLoading) {
        return;
    }


    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-full">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Tổng só người dùng: {dashboardData!.totalUsers}</h3>
                    </div>
                    <select
                        value={months}
                        onChange={event => {
                            setMonths(Number.parseInt(event.target.value, 0));
                            setTimeout(() => {
                                queryClient.invalidateQueries({queryKey: ['admin', 'dashboard']});
                            }, 0)
                        }}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value={1}>1 tháng</option>
                        <option value={6}>6 tháng</option>
                        <option value={12}>12 tháng</option>
                    </select>
                </div>


                <div className={"h-[300px]"}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardData!.growthChart} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                            <XAxis
                                dataKey="group"
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: '#6b7280', fontSize: 12}}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                tick={{fill: '#6b7280', fontSize: 12}}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                                activeDot={{r: 6, strokeWidth: 0}}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};