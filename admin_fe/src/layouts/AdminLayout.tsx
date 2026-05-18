import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth/authStore';
import { userApi } from '../api/user/api';
import AdminSider from './shared/Sider';
import AdminHeader from './shared/Header';
import Loader from '../components/shared/ui/Loader';
import { CustomToast } from '../components/shared/feedback/CustomToast';
import BlockConfirmModal from '../components/shared/ui/BlockConfirmModal';
import { useInitNotifications } from '../hooks/notification/useInitNotifications';

const SystemAdminLayout: React.FC = () => {
    useInitNotifications()
    
    const navigate = useNavigate();
    const { isAuthenticated, user, setUser, clearUser } = useAuthStore(state => state);
    console.log(user)

    const [isChecking, setIsChecking] = useState(true);
    useEffect(() => {
        const verifyAdmin = async () => {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            let currentUser = user;
            if (!currentUser) {
                try {
                    currentUser = await userApi.getMe() as any;
                    setUser(currentUser as any);
                    setIsChecking(false);
                } catch (error) {
                    clearUser();
                    navigate('/login');
                    return;
                }
            }

            if (currentUser && currentUser.is_staff !== true) {
                CustomToast.error("Access Denied! System Admin only.");
                navigate('/login');
                return;
            }

            setIsChecking(false);
        };

        verifyAdmin();
    }, [isAuthenticated, user, setUser, clearUser, navigate]);

    if (isChecking) {
        return (
            <div className="h-screen w-full bg-base flex flex-col items-center justify-center gap-4">
                <Loader />
                <span className="text-text-main font-bold animate-pulse">Verifying Admin Access...</span>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-base text-text-main font-sans overflow-hidden">
            <AdminSider />
            <div className="flex flex-col flex-1 overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 sm:p-8">
                    <div className="lg:min-w-0">
                        <Outlet /> 
                    </div>
                </main>
            </div>
            <BlockConfirmModal />
        </div>
    );
};

export default SystemAdminLayout;