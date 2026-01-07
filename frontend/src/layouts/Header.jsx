import { Button, Space } from "antd"
import {
    MenuFoldOutlined,
   MenuUnfoldOutlined,
} from "@ant-design/icons"
import { Header } from "antd/es/layout/layout"

const CustomHeader = ({collapsed, setCollapsed }) => {
    return (
        <Header
            className="sticky top-0 z-5 p-5 flex items-center justify-between !bg-white shadow-md border-b border-1 border-black"
        >
            <Space>
                <Button
                    id="menu-btn"
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                    onClick={() => setCollapsed(!collapsed)}
                >
                </Button>
            </Space>
        </Header>
    );
};

export default CustomHeader;