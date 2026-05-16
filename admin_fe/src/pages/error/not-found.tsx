// src/pages/error/not-found.tsx
import { useNavigate } from 'react-router-dom';
import SpotifyIcon from '../../components/shared/SpotifyIcon';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-base text-text-main p-4">
            <div className="w-16 h-16 bg-highlight/10 text-highlight rounded-full flex items-center justify-center mb-4 shadow-inner">
                <SpotifyIcon />
            </div>
            <h1 className="text-9xl font-black text-highlight">404</h1>
            <h2 className="text-3xl font-bold mt-4">Cannot found this page</h2>
            <p className="text-text-sub mt-2 mb-8">The page you are finding is not available or not exist.</p>
            <button 
                onClick={() => navigate(-1)}
                className="bg-highlight text-text-main px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
                Back
            </button>
        </div>
    );
};

export default NotFoundPage;