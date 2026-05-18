import React from "react";
import ClientLayout from "../layouts/home";
import Loadable from "../components/shared/Loadable";
import ProtectedRoute from "../guards/ProtectedRoute";

const HomePage = Loadable(React.lazy(() => import("../pages/home/HomePage")));
const ReleaseDetail = Loadable(React.lazy(() => import("../pages/detail/ReleaseDetail")))
const ArtistDetail = Loadable(React.lazy(() => import("../pages/detail/ArtistDetail")))
const PlaylistDetail = Loadable(React.lazy(() => import("../pages/detail/PlaylistDetail")))
const GenreDetail = Loadable(React.lazy(() => import("../pages/detail/GenreDetailPage")))
const TrackDetail = Loadable(React.lazy(() => import('../pages/detail/TrackDetail')))
const ProfilePage = Loadable(React.lazy(() => import("../pages/profile/ProfilePage")))
const SubscriptionPage = Loadable(React.lazy(() => import("../pages/subscription/SubscriptionPage")))
const ApplyArtistPage = Loadable(React.lazy(() => import('../pages/apply-artist/ArtistApplicationPage')))
const NotificationsPage = Loadable(React.lazy(() => import('../pages/notifications/NotificationsPage')))
const DiscographyPage = Loadable(React.lazy(() => import('../pages/discography/ArtistDiscography')))

export const HomeRoutes = {
    children : [
        {
            path: "/",
            element: <ClientLayout />,
            children: [
                {
                    path: "",
                    element: <HomePage />
                },
                {
                    path: "release/:short_id",
                    element: <ReleaseDetail />
                },
                {
                    path: "track/:short_id",
                    element: <TrackDetail />
                },
                {
                    path: "artist/:short_id",
                    element: <ArtistDetail />
                },
                {
                    path: "artist/:short_id/discography",
                    element: <DiscographyPage />
                },
                {
                    path: "playlist/:slug",
                    element: <PlaylistDetail />
                },
                {
                    path: "genre/:slug",
                    element: <GenreDetail />
                },
                {
                    element: <ProtectedRoute />,
                    children: [
                        { 
                            path: "profile", 
                            element: <ProfilePage /> 
                        },
                        { 
                            path: "notifications", 
                            element: <NotificationsPage /> 
                        },
                    ]
                }
            ]
        },
        {
            path: "/subscription",
            element: <SubscriptionPage />,
        },
        {
            path: "apply-artist",
            element: <ApplyArtistPage />,
        }
    ]
};