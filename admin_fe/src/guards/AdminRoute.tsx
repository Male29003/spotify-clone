import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth/authStore";
import { CustomToast } from "../components/shared/feedback/CustomToast";

const AdminRoute = () => {
    const { isAuthenticated, user, isLoaded } = useAuthStore();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    if (user && !user.is_staff) {
        CustomToast.error("You don't have permission to access to Admin Site !");
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;