import { Layout } from "antd"
import { Outlet } from "react-router-dom"
import { Content } from "antd/es/layout/layout"
import { useEffect,useState } from "react"
import CustomFooter from "./Footer"
import CustomHeader from "./Header"
import CustomSider from "./Sider"

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false)
    const [loading, setLoading] = useState(true)

    return (
        <Layout hasSider>
            <CustomSider collapsed={collapsed} setCollapsed={setCollapsed}/>
            <Layout>
                <CustomHeader collapsed={collapsed} setCollapsed={setCollapsed}/>
                <Content className="px-6 py-6 content overflow-y-auto" >
                    <Outlet />
                </Content>
                <CustomFooter />
            </Layout>
        </Layout>
    );
};

export default MainLayout;