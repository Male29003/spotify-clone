import {Collapse, Layout, Space, Typography} from "antd"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo.png"

const { Sider } = Layout;

function CustomSider({ collapsed, setCollapsed }) {
    const navigate = useNavigate();
    return (
        <Sider
            trigger={null}
            className="overflow-auto h-screen !sticky top-0 left-0 bottom-0 px-1"
            collapsed={collapsed}
            width = "180"
        >
            <Space
                className="flex flex-col items-center justify-center p-1 m-2 cursor-pointer"
                onClick={() => {
                    navigate("/")
                }}
            >
            </Space>
        </Sider>
        
    );
};
export default CustomSider;