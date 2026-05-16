// src/routes/AuthRoutes.tsx
import { lazy } from 'react';
import Loadable from '../components/shared/Loadable';
import { Navigate } from 'react-router-dom';

const AuthLayout = Loadable(lazy(() => import('../layouts/AuthLayout'))); 
const LoginRegis = Loadable(lazy(() => import('../pages/auth/Login')));

export const AuthRoutes = {
    element: <AuthLayout />,
    children: [
        {
            path: 'login',
            element: <LoginRegis />,
        },
        {
            path: '',
            element: <Navigate to="/login" replace />
        }
    ],
};