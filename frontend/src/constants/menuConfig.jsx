import {
    AudiotrackOutlinedIcon,
    ALbumIcon,
    CategoryIcon,
}   from '@mui/icons-material';
import {
    DashboardOutlined,
    PieChartOutlined,
    UserOutlined,
    AudioOutlined
} from '@ant-design/icons';                                                           
const MenuConfig = () => {
    const menuItems = [
        {
            key: '0',
            label: 'Tổng quan',
            icon: <DashboardOutlined />,
            path: "/admin/dashboard",
        },
        {
            key: '1',
            label: 'Bài hát',
            icon: <AudiotrackOutlinedIcon />,
            path: "/admin/tracks",
        },
        {
            key: '2',
            label: 'Nghệ sĩ',
            icon: <AudioOutlined />,
            path: "/admin/artists",  
        },
        {
            key: '3',
            label: 'Album',
            icon: <ALbumIcon />,
            path: "/admin/albums",
        },
        {
            key: '4',
            label: 'Thể loại',
            icon: <CategoryIcon />,
            path: "/admin/categories",
        },
        {
            key: '5',
            label: 'Tài khoản',
            icon: <UserOutlined/>,
            path: "/admin/users",
        },
        {
            key: '6',
            label: 'Thống kê',
            icon: <PieChartOutlined />,
            path: "/admin/statistics",
        },
    ]
}
