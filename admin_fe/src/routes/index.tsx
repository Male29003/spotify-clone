import { ErrorRoutes } from "./ErrorRoutes";
import { AuthRoutes } from "./AuthRoutes";
import { SystemRoutes } from './admin'
import { useAutoTheme } from "../hooks/useTheme";
import { Outlet } from "react-router-dom";

const GlobalRoot = () => {
    useAutoTheme()
    return <Outlet />
}
export const AppRoutes = [
    {
        element: <GlobalRoot />,
        children:[
            ...SystemRoutes, ErrorRoutes, AuthRoutes
        ]
    }

]; 