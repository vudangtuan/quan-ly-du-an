import React from 'react';



export const DashboardPage: React.FC = () => {
    return (
        <div className="flex h-screen w-full bg-white">
            {/* 2. Khu vực nội dung chính */}
            {/* 'flex-1' sẽ làm cho nó chiếm toàn bộ không gian còn lại */}
            {/* 'overflow-y-auto' cho phép cuộn nếu nội dung dài */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
                {/* Bạn có thể bắt đầu thêm nội dung dashboard vào đây */}
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">Chào mừng bạn trở lại!</p>

                {/* ... (Các component thống kê, biểu đồ... sẽ được thêm vào đây) ... */}
            </main>
        </div>
    );
};