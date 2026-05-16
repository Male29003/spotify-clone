// src/layouts/AuthLayout/index.tsx
import { Outlet, useNavigate } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-panel overflow-hidden">
            <div className="absolute inset-0 z-0 blur-[100px] opacity-30">
                <div className="absolute top-0 right-0 w-100 h-100 bg-accent-purple-dark rounded-full" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-info-dark rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;