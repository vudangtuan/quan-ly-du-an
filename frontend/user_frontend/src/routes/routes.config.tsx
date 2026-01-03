import {LoginPage} from '@/features/auth';
import {Navigate} from "react-router-dom";
import {AdminLayout, MainLayout} from "@/layouts";
import {PrivateRoute} from "./PrivateRoute";
import {PublicRoute} from "./PublicRoute";
import {NotFoundPage} from "./NotFoundPage";
import {SettingPage} from "@/features/settiings";
import {ProjectsPage} from "@/features/projects";
import {
    ProjectDashboard, ProjectDetailPage, ProjectGantt,
    ProjectKanban, ProjectList, ProjectOverview, ProjectStorage, ProjectTimeline
} from "@/features/project_details";
import {TaskDetailDialog} from "@/features/project_details/components";
import {MyTasksPage} from "@/features/my_tasks";
import {AcceptInvitePage} from "@/features/ accept-invite";
import {AdminRoute} from "@/routes/AdminRoute";
import {AdminDashBoard, AdminSystem, UserDetail, UserManagement} from "@/features/admin";


export const routesConfig = [
    {
        element: <PrivateRoute/>,
        children: [
            {
                path: '/',
                element: <MainLayout/>,
                children: [
                    {path: '/', element: <Navigate to="/projects" replace/>},
                    {path: '/settings', element: <SettingPage/>},
                    {path: '/projects', element: <ProjectsPage/>},
                    {path: '/my_tasks', element: <MyTasksPage/>},
                    {
                        path: '/project/:projectId',
                        element: <ProjectDetailPage/>,
                        children: [
                            {path: '', element: <Navigate to="overview" replace/>},
                            {path: 'overview', element: <ProjectOverview/>},
                            {path: 'kanban', element: <ProjectKanban/>},
                            {path: 'task/:taskId', element: <TaskDetailDialog/>},
                            {path: 'dashboard', element: <ProjectDashboard/>},
                            {path: 'archived', element: <ProjectStorage/>},
                            {path: 'timeline', element: <ProjectTimeline/>},
                            {path: 'gantt', element: <ProjectGantt/>},
                            {path: 'list', element: <ProjectList/>},
                        ]
                    },
                ],
            },
            {
                path: '/accept-invite',
                element: <AcceptInvitePage/>
            }
        ],
    },
    {
        element: <PublicRoute/>,
        children: [
            {path: 'login', element: <LoginPage/>}
        ],
    },
    {
        element: <AdminRoute/>,
        children: [
            {
                path: 'admin',
                element: <AdminLayout/>,
                children: [
                    {
                        path: 'dashboard',
                        element: <AdminDashBoard/>
                    },
                    {
                        path: 'users',
                        element: <UserManagement/>
                    },
                    {
                        path: 'users/id/:userId',
                        element: <UserDetail/>
                    },
                    {
                        path: 'system',
                        element: <AdminSystem/>
                    }
                ]
            }
        ]
    },
    {
        path: '*',
        element: <NotFoundPage/>,
    },
];