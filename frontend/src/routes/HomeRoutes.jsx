import React from "react";
import ClientLayout from "../layouts";
import Loadable from "../components/Loadable";

const HomePage = Loadable(React.lazy(() => import("../pages/home/HomePage")));

export const HomeRoutes = {
    children : [
        {
            path: "/",
            element: <ClientLayout />,
            children: [
                {
                    path: "",
                    element: <HomePage />
                }
            ]
        }
    ]
};