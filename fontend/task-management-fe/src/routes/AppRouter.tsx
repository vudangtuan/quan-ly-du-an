import {BrowserRouter, useRoutes} from 'react-router-dom';
import {routesConfig} from './routes.config';


const AppRoutes = () => {
    // useRoutes là hook của react-router-dom
    // để đọc mảng cấu hình (routesConfig)
    return useRoutes(routesConfig);
};

/**
 * Component Router chính của App
 */
export const AppRouter = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
};