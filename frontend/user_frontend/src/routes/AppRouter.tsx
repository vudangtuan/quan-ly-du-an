import {BrowserRouter, matchPath, Route, Routes, useLocation, useRoutes, type Location} from 'react-router-dom';
import {routesConfig} from './routes.config';
import {TaskDetailDialog} from "@/features/project_details/components";


const AppRoutes = () => {
    const location = useLocation();
    const matchTask = matchPath("/project/:projectId/task/:taskId", location.pathname);

    const state = location.state as { backgroundLocation?: Location };
    let background = state?.backgroundLocation;


    if (!background && matchTask) {
        const {projectId} = matchTask.params;
        if (projectId) {
            background = {
                pathname: `/project/${projectId}/kanban`,
                search: '',
                hash: '',
                state: undefined,
                key: 'kanban-f5-background'
            };
        }
    }

    const element = useRoutes(routesConfig, background || location);

    return (
        <>
            {element}
            {background && (
                <Routes>
                    <Route path="/project/:projectId/task/:taskId"
                           element={<TaskDetailDialog/>}/>
                </Routes>
            )}
        </>
    );
};

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <AppRoutes/>
        </BrowserRouter>
    );
};