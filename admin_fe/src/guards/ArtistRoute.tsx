import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth/authStore";
import { CustomToast } from "../components/shared/feedback/CustomToast";

const ArtistRoute = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    if (user && user.type?.toLowerCase() !== 'artist') {
        CustomToast.error("You don't have permission to access to Artist Site !");
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ArtistRoute;