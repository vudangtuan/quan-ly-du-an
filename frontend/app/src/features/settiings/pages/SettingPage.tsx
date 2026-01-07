import React from "react";
import {ArchivedProjectsSection, LogoutSection, UserInformation, UserSecurity} from "@/features/settiings/components";


export const SettingPage: React.FC = () => {

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <UserInformation/>
                <UserSecurity/>
                <ArchivedProjectsSection/>
                <LogoutSection/>
            </div>
        </div>
    );
}