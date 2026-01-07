import {
    Archive,
    Clock3,
    GanttChart,
    Home,
    KanbanSquare,
    LayoutDashboard,
    List,
    ChevronDown,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { ProjectDetailResponse } from "@/shared/types";
import React, { useState, useEffect, useRef } from "react";

const projectTabs = [
    { name: 'Overview', href: 'overview', icon: Home },
    { name: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
    { name: 'List', href: 'list', icon: List },
    { name: 'Kanban', href: 'kanban', icon: KanbanSquare },
    { name: 'Timeline', href: 'timeline', icon: Clock3 },
    { name: 'Gantt', href: 'gantt', icon: GanttChart },
    { name: 'Archived', href: 'archived', icon: Archive },
];

interface ProjectDetailHeaderProps {
    project: ProjectDetailResponse,
    activityConnected: boolean,
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ project, activityConnected }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);

    const currentTab = projectTabs.find(tab => location.pathname.includes(tab.href)) || projectTabs[0];
    const CurrentIcon = currentTab.icon;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="w-full">
            <div className="px-4 md:px-8 flex items-center justify-between py-3 gap-3">
                <div className="flex items-start text-sm text-gray-500 min-w-0">
                    <Link to="/projects" className="hover:underline flex-shrink-0 whitespace-nowrap">
                        Dự án
                    </Link>
                    <span className="mx-2 text-gray-400 flex-shrink-0">/</span>
                    <span
                        className="font-semibold text-gray-800 line-clamp-2 break-words leading-tight"
                        title={project.name}
                    >
                        {project.name}
                    </span>
                </div>

                <div
                    className="relative group flex-shrink-0 self-start mt-1.5 md:self-center md:mt-0"
                    title={activityConnected ? 'Live' : 'Offline'}
                >
                    <div className={`h-2.5 w-2.5 rounded-full ${
                        activityConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                </div>
            </div>

            <div className="border-b border-gray-400 px-4 md:px-8 pb-2 md:pb-0">
                {/* --- MOBILE VIEW: DROPDOWN MENU --- */}
                <div className="md:hidden relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <CurrentIcon className="h-5 w-5 text-gray-500" />
                            <span>{currentTab.name}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                            {projectTabs.map((tab) => {
                                const Icon = tab.icon;
                                const fullPath = `/project/${project.projectId}/${tab.href}`;
                                const isActive = location.pathname.includes(tab.href);

                                return (
                                    <Link
                                        key={tab.name}
                                        to={fullPath}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                                            ${isActive
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                                        {tab.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* --- DESKTOP VIEW: TABS --- */}
                <nav className="hidden md:flex space-x-5" aria-label="Tabs">
                    {projectTabs.map((tab) => {
                        const Icon = tab.icon;
                        const fullPath = `/project/${project.projectId}/${tab.href}`;

                        return (
                            <NavLink
                                key={tab.name}
                                to={fullPath}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`
                                }
                            >
                                <Icon className="h-5 w-5" />
                                {tab.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </div>
    )
}