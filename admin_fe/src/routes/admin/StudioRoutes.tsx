import React from "react";
import Loadable from "../../components/shared/Loadable";
import ArtistStudioLayout from "../../layouts/ArtistStudioLayout";
import ArtistRoute from "../../guards/ArtistRoute";

const DashboardPage = Loadable(React.lazy(() => import("../../pages/studio/Dashboard"))) 
const ContentManagePage = Loadable(React.lazy(() => import("../../pages/studio/ContentManagePage"))) 
const UploadPage = Loadable(React.lazy(() => import("../../pages/studio/UploadPage"))) 
const ArtistProfilePage = Loadable(React.lazy(() => import ("../../pages/studio/ProfilePage")))
const NotificationsPage = Loadable(React.lazy(() => import('../../pages/notifications/NotificationsPage')))

export const StudioRoutes = {
    path: "/studio",
    element: <ArtistRoute />,
    children: [
        {
            path: "",
            element: <ArtistStudioLayout />,
            children: [
                {
                    path: "",
                    element: <DashboardPage />
                },
                {
                    path: "content-management",
                    element: <ContentManagePage />
                },
                {
                    path: "upload",
                    element: <UploadPage />
                },
                {
                    path: "profile",
                    element: <ArtistProfilePage />
                },
                {
                    path: "notifications",
                    element: <NotificationsPage />
                },
            ]
        }
    ]
};