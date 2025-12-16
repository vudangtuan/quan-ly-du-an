import {Archive, Clock3, GanttChart, Home, KanbanSquare, LayoutDashboard, List} from "lucide-react";
import {Link, NavLink} from "react-router-dom";
import type {ProjectDetailResponse} from "@/shared/types";
import React from "react";


const projectTabs = [
    {name: 'Overview', href: 'overview', icon: Home},
    {name: 'Dashboard', href: 'dashboard', icon: LayoutDashboard},
    {name: 'List', href: 'list', icon: List},
    {name: 'Kanban', href: 'kanban', icon: KanbanSquare},
    {name: 'Timeline', href: 'timeline', icon: Clock3},
    {name: 'Gantt', href: 'gantt', icon: GanttChart},
    {name: 'Archived', href: 'archived', icon: Archive},
];

interface ProjectDetailHeaderProps {
    project: ProjectDetailResponse,
    activityConnected: boolean,
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps>
    = ({project, activityConnected}) => {
    return (
        <div>
            {/* PHẦN HEADER */}
            <div className="px-8 flex gap-2">
                {/* Breadcrumb (dùng projectName từ data) */}
                <nav className="items-center mb-2 text-sm text-gray-500">
                    <Link to="/projects" className="hover:underline cursor-pointer">
                        Danh sách dự án
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">{project.name}</span>
                </nav>
                <div
                    className="relative group"
                    title={activityConnected ? 'Kết nối thời gian thực' : 'Không kết nối'}
                >
                    <div className={`h-2 w-2 rounded-full ${
                        activityConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                </div>
            </div>

            {/* PHẦN THANH TABS (vẫn dùng projectId từ useParams) */}
            <div className="border-b border-gray-200">
                <nav className="ml-8 flex space-x-3" aria-label="Tabs">
                    {projectTabs.map((tab) => {
                        const Icon = tab.icon;
                        const fullPath = `/project/${project.projectId}/${tab.href}`;

                        return (
                            <NavLink
                                key={tab.name}
                                to={fullPath}
                                className={({isActive}) =>
                                    `flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                    ${
                                        isActive
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`
                                }
                            >
                                <Icon className="h-5 w-5"/>
                                {tab.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </div>
    )
}