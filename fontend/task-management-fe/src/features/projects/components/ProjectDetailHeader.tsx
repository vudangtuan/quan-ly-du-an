import React from "react"
import {Clock3, GanttChart, Home, KanbanSquare, LayoutDashboard, List} from "lucide-react";
import {Link, NavLink, useParams} from "react-router-dom";



const projectTabs = [
    {name: 'Overview', href: 'overview', icon: Home},
    {name: 'Dashboard', href: 'dashboard', icon: LayoutDashboard},
    {name: 'List', href: 'list', icon: List},
    {name: 'Kanban', href: 'kanban', icon: KanbanSquare},
    {name: 'Timeline', href: 'timeline', icon: Clock3},
    {name: 'Gantt', href: 'gantt', icon: GanttChart},
];

interface ProjectDetailHeaderProps {
    projectName: string
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps>
    = ({projectName}) => {
    const {projectId} = useParams<{ projectId: string }>();

    return (
        <div>
            {/* PHẦN HEADER */}
            <div className="mb-6 px-8">
                {/* Breadcrumb (dùng projectName từ data) */}
                <nav className="mb-2 text-sm text-gray-500">
                    <Link to="/projects" className="hover:underline cursor-pointer">
                        Danh sách dự án
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-gray-700">{projectName}</span>
                </nav>
            </div>

            {/* PHẦN THANH TABS (vẫn dùng projectId từ useParams) */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px ml-8 flex space-x-6" aria-label="Tabs">
                    {projectTabs.map((tab) => {
                        const Icon = tab.icon;
                        const fullPath = `/projects/${projectId}/${tab.href}`;

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