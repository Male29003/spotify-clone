import { Layout } from "antd"
import { Outlet } from "react-router-dom"
import { Content } from "antd/es/layout/layout"
import { useEffect,useState } from "react"

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false)
    const [loading, setLoading] = useState(true)

    return (
        <Layout hasSider>
            
            <Layout>
                <Content className="" />
            </Layout>
        </Layout>
    )

}