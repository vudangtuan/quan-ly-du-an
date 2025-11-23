import React from 'react';
import { Users, PieChart, Goal } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen w-full">

            {/* Cột bên trái (40%) */}
            <div className="hidden w-2/5 flex-col justify-center bg-gray-900 p-10 text-white lg:flex">

                {/* 2. Nội dung chính */}
                <div className="my-auto flex flex-col gap-8">
                    <h1 className="text-4xl font-bold leading-tight">
                        Biến sự hỗn loạn thành trật tự.
                    </h1>
                    <p className="text-lg text-gray-300">
                        Quản lý dự án, phân công nhiệm vụ và theo dõi tiến độ một cách hiệu quả. TaskFlow giúp đội nhóm của bạn làm việc cùng nhau một cách liền mạch.
                    </p>
                    <div className="mt-4 flex flex-col gap-6">
                        <FeatureItem
                            icon={<Users className="h-6 w-6 text-blue-400" />}
                            title="Cộng tác dễ dàng"
                            description="Giao tiếp, chia sẻ tệp và cập nhật trạng thái công việc trong thời gian thực."
                        />
                        <FeatureItem
                            icon={<PieChart className="h-6 w-6 text-blue-400" />}
                            title="Báo cáo trực quan"
                            description="Theo dõi tiến độ dự án với các biểu đồ và báo cáo chi tiết, dễ hiểu."
                        />
                        <FeatureItem
                            icon={<Goal className="h-6 w-6 text-blue-400" />}
                            title="Tối ưu hóa quy trình"
                            description="Tự động hóa các công việc lặp đi lặp lại và tập trung vào những gì quan trọng nhất."
                        />
                    </div>
                </div>

            </div>

            {/* Cột bên phải (60%) */}
            <div
                className="flex w-full items-center justify-center overflow-y-auto bg-white p-8 lg:w-3/5"
            >
                {children}
            </div>
        </div>
    );
};

// Component nhỏ cho các mục tính năng
interface FeatureItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-lg bg-gray-800 p-2">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-gray-300">{description}</p>
            </div>
        </div>
    );
};