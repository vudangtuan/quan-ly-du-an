import React from "react";
import {ArchivedProjectsSection, LogoutSection, UserInformation, UserSecurity} from "@/features/settiings/components";


export const SettingPage: React.FC = () => {

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Cài đặt tài khoản</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <UserInformation/>
                <UserSecurity/>
                <ArchivedProjectsSection/>
                <LogoutSection/>
            </div>
        </div>
    );
}