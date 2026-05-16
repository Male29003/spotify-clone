// src/layouts/AuthLayout/index.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AuthLayout = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-panel overflow-hidden">
            <div className="absolute inset-0 z-0 blur-[100px] opacity-30">
                <div className="absolute top-0 right-0 w-100 h-100 bg-accent-purple-dark rounded-full" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-info-dark rounded-full" />
            </div>

            <button 
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-base/10 hover:bg-base/20 text-text-main rounded-full transition-all"
            >
                <ArrowBackIcon fontSize="small" />
                <span className="text-sm font-bold">Back to Home page</span>
            </button>

            <div className="relative z-10 w-full max-w-md px-4">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;