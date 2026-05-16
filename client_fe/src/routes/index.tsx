import { ErrorRoutes } from "./ErrorRoutes";
import { AuthRoutes } from "./AuthRoutes";
import { HomeRoutes } from "./HomeRoutes"
import { Outlet } from "react-router-dom";

const GlobalRoot = () => {
    return <Outlet />
}
export const AppRoutes = [
    {
        element: <GlobalRoot />,
        children:[
            ErrorRoutes, AuthRoutes, HomeRoutes
        ]
    }

]; 