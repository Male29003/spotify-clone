import {
    InsightsOutlined,
    CloudUploadOutlined,
    AccountBoxOutlined,
    QueueMusicOutlined
} from '@mui/icons-material';                                                    

export const ArtistMenu = [
    {
        key: '0',
        label: 'Dashboard',
        icon: <InsightsOutlined />,
        path: "/studio",
    },
    {
        key: '1',
        label: 'Release',
        icon: <QueueMusicOutlined />,
        path: "/studio/content-management",
    },
    {
        key: '2',
        label: 'Upload',
        icon: <CloudUploadOutlined />, 
        path: "/studio/upload",
    },
    {
        key: '3',
        label: 'Profile',
        icon: <AccountBoxOutlined />,
        path: "/studio/profile",
    },
];