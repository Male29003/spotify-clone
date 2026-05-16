import { Block, DiamondOutlined, SettingsBackupRestore, Visibility } from '@mui/icons-material';
import type { Column } from '../../components/main_ui/DataTable';
import { DEFAULT_STAFF_IMAGE } from '../../constants/constants';

export const StaffColumns = ({ onEdit, onDelete}: any): Column[] => {
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
            render: (item: any) => 
                <div className='w-12 h-12 lg:w-20 lg:h-20 md:w-16 md:h-16 rounded-full overflow-hidden bg-search mx-auto border border-border'>
                    <img 
                        src={item.profile_picture || DEFAULT_STAFF_IMAGE} 
                        alt={item.username} 
                        className="w-full h-full object-cover"
                    /> 
                </div>
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
            key: 'status',
            header: 'Status',
            width: '15%',
            className: 'border-r border-border text-center',
            render: (item: any) => item.is_active ? (
                <span className="bg-highlight/10 text-highlight text-xs font-bold border border-highlight/60 px-2 py-1 rounded-md">
                    Active
                </span>
            ) : (
                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-md text-xs font-bold">
                    Deactive
                </span>
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
                        onClick={() => onEdit(item)} 
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