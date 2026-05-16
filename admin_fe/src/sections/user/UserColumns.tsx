import { Block, DiamondOutlined, SettingsBackupRestore, Visibility } from '@mui/icons-material';
import type { Column } from '../../components/main_ui/DataTable';

export const UserColumns = ({ onEdit, onDelete}: any): Column[] => {
    return [
        {
            key: 'id',
            header: 'ID',
            width: '10%',
            className: 'border-r border-border text-center',
            render: (item: any) => <span className="p-4 text-text-sub">{item.id}</span>
        },
        {
            key: 'avatar',
            header: 'Avatar',
            width: '15%',
            className: 'border-r border-border',
            render: (item: any) => item.profile_picture ?
                <div className='w-12 h-12 lg:w-20 lg:h-20 md:w-16 md:h-16 rounded-full overflow-hidden bg-search mx-auto border border-border'>
                    <img 
                        src={item.profile_picture} 
                        alt={item.username} 
                        className="w-full h-full object-cover"
                    /> 
                </div>
            : 
                <span className="w-full h-full flex items-center justify-center text-xs text-text-sub text-center font-bold">
                    {item.username?.charAt(0).toUpperCase()}
                </span>
        },
        {
            key: 'username',
            header: 'Username',
            width: '25%',
            className: 'border-r border-border', 
            render: (item: any) => 
                <div className="p-4 font-bold text-text-main truncate">
                    {item.username}
                </div>
        },
        {
            key: 'email',
            header: 'Email',
            width: '25%',
            className: 'border-r border-border', 
            render: (item: any) => 
                <div 
                    className="text-text-sub truncate pr-4" 
                    title={item.email}
                >
                    {item.email}
                </div>
        },
        {
            key: 'subscription',
            header: 'Subscription',
            width: '15%',
            className: 'border-r border-border text-center',
            render: (item: any) => item.is_premium ? (
                <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-md text-xs font-bold">
                    <DiamondOutlined fontSize="small" className="!text-[14px]"/> VIP
                </span>
            ) : (
                <span className="text-text-sub text-xs bg-search px-2 py-1 rounded-md">Free</span>
            )
        },
        {
            key: 'action',
            header: 'Action',
            width: '10%',
            className: 'text-center',
            render: (item: any) => (
                <div className="flex items-center justify-center text-center gap-1">
                    <button 
                        onClick={() => onEdit(item.id)} 
                        className="text-info/90 rounded-md w-8 h-8
                                hover:bg-base hover:text-info-dark"
                    >
                        <Visibility fontSize="small" className='hover:scale-105'/>
                    </button>
                    <button 
                        onClick={() => onDelete(item)}
                        className={`p-2 rounded-md transition-all font-bold text-xs flex items-center gap-1 disabled:opacity-50
                            ${item.is_active 
                                ? 'text-error/95 hover:bg-error/10 hover:text-error' 
                                : 'text-highlight/80 hover:bg-highlight/10 hover:text-highlight'
                            }
                        `}
                        title={item.is_active ? "Block" : "Unblock"}
                    >
                        {item.is_active ? <Block fontSize="small" /> : <SettingsBackupRestore fontSize="small" />}
                    </button>
                </div>
            )
        }
    ];
};