// src/routes/AuthRoutes.tsx
import { lazy } from 'react';
import Loadable from '../components/shared/Loadable';

const AuthLayout = Loadable(lazy(() => import('../layouts/AuthLayout'))); 
const LoginRegis = Loadable(lazy(() => import('../pages/auth/LoginRegis')));
const ForgotPassword = Loadable(lazy(() => import('../pages/auth/ForgotPassword')));

export const AuthRoutes = {
    element: <AuthLayout />,
    children: [
        {
            path: 'login',
            element: <LoginRegis />,
        },
        {
            path: 'forgot-password',
            element: <ForgotPassword />
        }
    ],
};