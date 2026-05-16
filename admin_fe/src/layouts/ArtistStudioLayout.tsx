import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth/authStore";
import { userApi } from "../api/user/api";
import AdminSider from "./shared/Sider";
import AdminHeader from "./shared/Header";
import Loader from "../components/shared/ui/Loader";
import { CustomToast } from "../components/shared/feedback/CustomToast";
import { useInitNotifications } from "../hooks/notification/useInitNotifications";

const ArtistStudioLayout: React.FC = () => {
    useInitNotifications()
    
    const navigate = useNavigate();    
    const { isAuthenticated, user, setUser, clearUser } = useAuthStore(state => state);
    const [isChecking, setIsChecking] = useState(true);
    useEffect(() => {
        const verifyArtist = async () => {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            let currentUser = user;
            // Nếu chưa có user - lỗi api - gọi lại lần nữa
            if (!currentUser) {
                try {
                    currentUser = await userApi.getMe() as any;
                    setUser(currentUser as any);
                    setIsChecking(false)
                } catch (error) {
                    clearUser();
                    navigate('/login');
                    return;
                }
            }
            if(currentUser && currentUser.type?.toLowerCase() !== 'artist'){
                CustomToast.error("You don't have permisson to access Artist Site!")
                navigate('/')
                return
            }
            setIsChecking(false)
        };

        verifyArtist();
    }, [isAuthenticated, user, setUser, clearUser, navigate]);

    if (isChecking) {
        return (
            <div className="h-screen w-full bg-base flex items-center justify-center text-text-main font-bold">
                <Loader />
                <span className="text-text-main font-bold animate-pulse">Checking Artist Permission...</span>
            </div>
    )}

    return (
        <div className="flex h-screen w-full bg-base text-text-main font-sans overflow-hidden">
            <AdminSider />
            <div className="flex flex-col flex-1 overflow-hidden">
                <AdminHeader  />
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-base relative">
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
}

export default ArtistStudioLayout;