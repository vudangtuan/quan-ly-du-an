import {LoginPage} from '@/features/auth/pages/LoginPage';
import {DashboardPage} from "@features/dashboards/pages/DashboardPage";
import {Navigate} from "react-router-dom";
import {MainLayout} from "@components/layout/MainLayout";
import {ProjectsPage} from "@features/projects/pages/ProjectsPage";
import {PrivateRoute} from "./PrivateRoute";
import {PublicRoute} from "./PublicRoute";
import {ProjectDetailPage} from "@features/projects/pages/ProjectDetailPage";
import {ProjectOverview} from "@features/projects/components/overview";
import {ProjectTimeline} from "@features/projects/components/timeline";
import {ProjectDashboard} from "@features/projects/components/dashboard";
import {ProjectKanban} from "@features/projects/components/kanban";
import {ProjectList} from "@features/projects/components/list";
import {ProjectGantt} from "@features/projects/components/gantt";
import {MyTasksPage} from "@features/mytasks/MyTasksPage";


// Ví dụ: Tạo một trang NotFound tạm thời
const NotFoundPage = () => <div>404 - Không tìm thấy trang</div>;


export const routesConfig = [
    {
        element: <PrivateRoute/>,
        children: [
            {
                path: '/',
                element: <MainLayout/>,
                children: [
                    {path: '/', element: <Navigate to="/dashboard" replace/>},
                    {path: '/dashboard', element: <DashboardPage/>},
                    {path: '/projects', element: <ProjectsPage/>},
                    {path: '/mytasks',element: <MyTasksPage/>},
                    {
                        path: '/projects/:projectId',
                        element: <ProjectDetailPage/>,
                        children: [
                            {path: '', element: <Navigate to="overview" replace/>},
                            {path: 'overview', element: <ProjectOverview/>},
                            {path: 'dashboard', element: <ProjectDashboard/>},
                            {path: 'kanban', element: <ProjectKanban/>},
                            {path: 'timeline', element: <ProjectTimeline/>},
                            {path: 'list', element: <ProjectList/>},
                            {path: 'gantt', element: <ProjectGantt/>},
                        ]
                    }
                ],
            },
        ],
    },
    {
        element: <PublicRoute/>,
        children: [
            {path: 'login', element: <LoginPage/>}
        ],
    },

    {
        path: '*',
        element: <NotFoundPage/>,
    },
];