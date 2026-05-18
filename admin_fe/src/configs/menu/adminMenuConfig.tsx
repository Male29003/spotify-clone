import {
    SpaceDashboardOutlined,
    PendingActionsOutlined,
    QueueMusicOutlined,
    MusicNoteOutlined,
    AlbumOutlined,
    MicExternalOnOutlined,
    AutoAwesomeMosaicOutlined,
    ManageAccountsOutlined,
    PeopleAltOutlined,
} from '@mui/icons-material';

export const ADMIN_PERMISSION_LIST = [
    { key: 'dashboard', label: 'Dashboard', desc: 'View statistics' },
    { key: 'approvals', label: 'Approvals', desc: 'Approve new releases' },
    { key: 'tracks', label: 'Songs', desc: 'Manage tracks' },
    { key: 'releases', label: 'Releases', desc: 'Manage releases' },
    { key: 'artists', label: 'Artists', desc: 'Manage artist profiles' },
    { key: 'genres', label: 'Genres', desc: 'Manage genres' },
    { key: 'users', label: 'Users', desc: 'Manage user accounts' },
    { key: 'staffs', label: 'Staff Management', desc: 'Manage staff accounts' },
];

export const AdminMenu = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <SpaceDashboardOutlined />,
        path: "/admin",
    },
    {
        key: 'approvals',
        label: 'Approvals',
        icon: <PendingActionsOutlined />, 
        path: "/admin/approvals",
    },
    {
        key: 'music_group',
        label: 'Music',
        icon: <QueueMusicOutlined />,
        children: [
            {
                key: 'tracks',
                label: 'Songs',
                icon: <MusicNoteOutlined />,
                path: "/admin/tracks",
            },
            {
                key: 'releases',
                label: 'Releases',
                icon: <AlbumOutlined />,
                path: "/admin/releases",
            },
        ]
    },
    {
        key: 'artists',
        label: 'Artists',
        icon: <MicExternalOnOutlined />,
        path: "/admin/artists", 
    },
    {
        key: 'genres',
        label: 'Genres',
        icon: <AutoAwesomeMosaicOutlined />,
        path: "/admin/genres",
    },
    {
        key: 'users',
        label: 'User',
        icon: <PeopleAltOutlined />,
        path: "/admin/users",
    },
    
    {
        key: 'staffs',
        label: 'Staff',
        icon: <ManageAccountsOutlined />,
        path: "/admin/staffs",
    },
];