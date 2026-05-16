import { Block, SettingsBackupRestore, Visibility } from '@mui/icons-material';
import type { Column } from '../../components/main_ui/DataTable';
import { formatNumber } from '../../utils/formatters';

export const ReleaseColumns = ({ onEdit, onDelete, isAdmin = false}: any): Column[] => {
    return [
        {
            key: 'id',
            header: 'ID',
            width: '10%',
            className: 'border-r border-border text-center',
            render: (item: any) => <span className="text-text-sub">{item.id}</span>
        },
        {
            key: 'image',
            header: 'Image',
            width: '15%',
            className: 'border-r border-border',
            render: (item: any) => item.image ?
                <div className='flex items-center justify-center'>
                    <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-12 h-12 lg:w-20 lg:h-20 md:w-16 md:h-16 rounded object-cover"
                    /> 
                </div>
                : <div className='w-full h-full bg-search'>-</div>
        },
        {
            key: 'title',
            header: 'Title',
            width: '30%',
            className: 'border-r border-border', 
            render: (item: any) => 
                <div className="font-bold text-text-main capitalize truncate">
                    {item.title}
                </div>
        },
        {
            key: 'listens',
            header: 'Listens',
            width: '20%',
            className: 'border-r border-border text-center',
            render: (item: any) => 
                {return item.total_listens ? (
                    <span className="text-text-sub line-clamp-2">{formatNumber(item?.total_listens)}</span>
                ) : (
                    <span className='text-text-sub line-clamp-2'>---</span>
                );
            }
        },
        {
            key: 'songs',
            header: 'Songs',
            width: '10%',
            className: 'border-r border-border text-center',
            render: (item: any) => {
                return item.total_tracks ? (
                    <span className="text-text-sub line-clamp-2">{formatNumber(item?.total_tracks)}</span>
                ) : (
                    <span className='text-text-sub line-clamp-2'>---</span>
                );
            }
        },
        {
            key: 'action',
            header: 'Action',
            width: '15%',
            className: 'text-center',
            render: (item: any) => {
                const isBlocked = item.is_blocked;
                return (
                    <div className="flex items-center justify-center gap-2">
                        {/* Nút Xem/Sửa luôn có */}
                        <button 
                            onClick={() => onEdit(item.short_id)} 
                            className="text-info/90 rounded-md w-8 h-8
                                    hover:bg-base hover:text-info-dark"
                        >
                            <Visibility fontSize="small" className='hover:scale-105'/>
                        </button>
                        {/* Logic cho Admin */}
                        {isAdmin && (
                            <button 
                                onClick={() => onDelete(item)} // Hàm onDelete này sẽ gọi handleAdminToggleStatus
                                className={`p-1 rounded-md transition-all ${isBlocked ? 'text-highlight hover:bg-highlight/10' : 'text-error hover:bg-error/10'}`}
                                title={isBlocked ? "Unblock Release" : "Block Release"}
                            >
                                {isBlocked ? <SettingsBackupRestore fontSize='small'/> : <Block fontSize='small'/>}
                            </button>
                        )}
                        {/* Logic cho Artist */}
                        {!isAdmin && (
                            !isBlocked && (
                                /* Trường hợp bình thường: Cho phép Deactivate/Activate */
                                <button 
                                    onClick={() => onDelete(item)} 
                                    className={`p-1 rounded-md transition-all ${item.is_active ? 'text-error/95 hover:bg-error/10' : 'text-highlight/80 hover:bg-highlight/10'}`}
                                    title={item.is_active ? "Deactivate" : "Activate"}
                                >
                                    {item.is_active ? <Block fontSize='small'/> : <SettingsBackupRestore fontSize='small'/>}
                                </button>
                            )
                        )}
                    </div>
                );
            }
        }
    ]
};