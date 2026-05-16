import { Outlet } from "react-router-dom";
import CustomSider from "./Sider";
import CustomHeader from "./Header";
import Player from "../player/Player";
import TrackQueueSider from "./TrackQueueSider";
import { useAuthStore } from "../../stores/auth/authStore";
import { useEffect } from "react";
import { userApi } from "../../api/user/api";
import { useMenuStore } from "../../stores/useToggleTPModalStore";
import TrackContextMenu from "../../components/shared/menu/TrackContextMenu";
import CustomFooter from "./Footer";
import { useSystemWebSocket } from "../../hooks/notification/useInitNotifications";

const MainLayout = () => {
    useSystemWebSocket()

    const { isAuthenticated, user, setUser, clearUser } = useAuthStore(state => state);
    const { item } = useMenuStore();

    useEffect(() => {
        if (isAuthenticated && !user) {
            const fetchUser = async () => {
                try {
                    const userData = await userApi.getMe();
                    setUser(userData as any);
                } catch (error) {
                    console.error("Error tự động lấy user:", error);
                    clearUser();
                }
            };
            fetchUser();
        }
    }, [isAuthenticated, user, setUser, clearUser]);
    
    return (
        <div className="flex flex-col h-screen bg-base text-text-main overflow-hidden p-2 gap-2 font-inter">
            <CustomHeader />

            <div className="flex flex-1 overflow-hidden gap-2">
                <CustomSider />
                
                <div 
                    id="lyrics-portal-target" 
                    className="flex-1 relative overflow-hidden rounded-lg flex flex-col"
                >
                    <main className="flex-1 bg-panel overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="flex-1 shrink-0">
                            <Outlet />
                        </div>
                        <CustomFooter />
                    </main>

                </div>
                
                <TrackQueueSider/>
            </div>
            <div className="h-19 shrink-0">
                <Player />
            </div>
            
        
            {item &&
                <TrackContextMenu />
            }
        </div>
    );
};

export default MainLayout;