import {Collapse, Layout, Space, Typography} from "antd"
import { useNavigate } from "react-router-dom"

const { Sider } = Layout;

function MySider({ collapsed, setCollapsed }) {
    return (
        <Sider
            trigger={null}
            className="site-layout-background"
            collapsed={collapsed}
            width = "180"
        >
            <Space
                className=""
                onClick={() => setCollapsed(!collapsed)}
            >

            </Space>
        </Sider>
    )
}
export default MySider;