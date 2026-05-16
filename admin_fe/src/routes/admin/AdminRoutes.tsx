import React from "react";
import Loadable from "../../components/shared/Loadable";
import SystemAdminLayout from "../../layouts/AdminLayout";
import AdminRoute from "../../guards/AdminRoute";
import { useAuthStore } from "../../stores/auth/authStore";
import { Navigate } from "react-router-dom";

const DashboardPage = Loadable(React.lazy(() => import("../../pages/admin/Dashboard"))) 
const UsersManagePage = Loadable(React.lazy(() => import("../../pages/admin/user/UserManagePage")))
const TrackManagePage = Loadable(React.lazy(() => import("../../pages/admin/music/TrackManagePage"))) 
const GenreManagePage = Loadable(React.lazy(() => import("../../pages/admin/music/GenreManagePage"))) 
const ReleaseManagePage = Loadable(React.lazy(() => import("../../pages/admin/music/ReleaseManagePage")))
const ArtistManagePage = Loadable(React.lazy(() => import("../../pages/admin/artist/ArtistManagePage"))) 
const ApprovalsPage = Loadable(React.lazy(() => import("../../pages/admin/approvals/ApprovalsPage")))
const NotificationsPage = Loadable(React.lazy(() => import('../../pages/notifications/NotificationsPage')))
const StaffManagePage = Loadable(React.lazy(() => import('../../pages/admin/user/StaffManagePage')))

const PermissionGuard = ({ permissionId, children }: { permissionId: string, children: React.ReactNode }) => {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.is_superuser;
    const userPermissions = (user as any)?.role_permissions || [];
    console.log(userPermissions)

    if (isSuperAdmin || userPermissions.includes(permissionId)) {
        return <>{children}</>;
    }
    
    return <Navigate to="/admin" replace />;
};

export const AdminRoutes = {
    path: '/admin',
    element: < AdminRoute />,
    children: [
        {
            path: "",
            element: <SystemAdminLayout />,
            children: [
                { 
                    path: "", 
                    element: <PermissionGuard permissionId="dashboard">
                                <DashboardPage />
                            </PermissionGuard>
                },
                { 
                    path: "users", 
                    element: <PermissionGuard permissionId="users">
                                <UsersManagePage />
                            </PermissionGuard>
                },
                { 
                    path: "tracks", 
                    element: <PermissionGuard permissionId="tracks">
                                <TrackManagePage />
                            </PermissionGuard>
                },
                {   path: "genres", 
                    element: <PermissionGuard permissionId="genres">
                                <GenreManagePage />
                            </PermissionGuard>
                    },
                { 
                    path: "releases", 
                    element: <PermissionGuard permissionId="releases">
                                <ReleaseManagePage />
                            </PermissionGuard>
                    },
                { 
                    path: "artists", 
                    element: <PermissionGuard permissionId="artists">
                                <ArtistManagePage />
                            </PermissionGuard>
                },
                { 
                    path: "approvals", 
                    element: <PermissionGuard permissionId="approvals">
                                <ApprovalsPage />
                            </PermissionGuard>
                },
                { 
                    path: "notifications", 
                    element: <NotificationsPage /> 
                },
                { 
                    path: "staffs", 
                    element: <PermissionGuard permissionId="staffs">
                                <StaffManagePage />
                            </PermissionGuard>
                },
            ]
        }
    ]
};