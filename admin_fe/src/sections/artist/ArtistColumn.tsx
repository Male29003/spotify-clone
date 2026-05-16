import { Block, SettingsBackupRestore, Visibility } from '@mui/icons-material';
import type { Column } from '../../components/main_ui/DataTable';
import { formatNumber } from '../../utils/formatters';

export const ArtistColumns = ({ onEdit, onDelete }: any): Column[] => {
    return [
        {
            key: 'id',
            header: 'ID',
            width: '5%',
            className: 'border-r border-border text-center',
            render: (item: any) => <span className="text-text-sub">{item.id}</span>
        },
        {
            key: 'avatar',
            header: 'Avatar',
            width: '20%',
            className: 'border-r border-border',
            render: (item: any) => item.image ?
                <div className='w-18 h-18 lg:w-24 lg:h-24 md:w-20 md:h-20 rounded-full overflow-hidden bg-search mx-auto border border-border'>
                    <img 
                        src={item.image} 
                        alt={item.stage_name} 
                        className="w-full h-full object-cover"
                    /> 
                </div>
            : 
                <span className="w-full h-full flex items-center justify-center text-xs text-text-sub text-center font-bold">
                    {item.stage_name?.charAt(0).toUpperCase()}
                </span>
        },
        {
            key: 'stage_name',
            header: 'Stage name',
            width: '30%',
            className: 'border-r border-border', 
            render: (item: any) => 
                <div className="font-bold text-text-main capitalize truncate">
                    {item.stage_name}
                </div>
        },
        {
            key: 'releases',
            header: 'Releases',
            width: '15%',
            className: 'border-r border-border text-center',
            render: (item: any) => {
                return item.releases ? (
                    <span className="text-text-sub line-clamp-2">{formatNumber(item.releases.length)}</span>
                ) : (
                    <span className='text-text-sub line-clamp-2'>---</span>
                );
            }
        },
        {
            key: 'followers',
            header: 'Followers',
            width: '15%',
            className: 'border-r border-border text-center',
            render: (item: any) => {
                return item.user ? (
                    <span className="text-text-sub line-clamp-2">{formatNumber(item.followers_count)}</span>
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
                    <div className="flex items-center justify-center text-center gap-1">
                        <button 
                            onClick={() => onEdit(item.short_id)} 
                            className="text-info/90 rounded-md w-8 h-8
                                    hover:bg-base hover:text-info-dark"
                        >
                            <Visibility fontSize="small" className='hover:scale-105'/>
                        </button>
                        <button 
                            onClick={() => onDelete(item)} 
                            className={` rounded-md w-8 h-8  hover:scale-105
                                ${isBlocked ? 
                                    'text-highlight/80 hover:bg-highlight/10 hover:text-highlight'
                                    : 'text-error/95 hover:text-error hover:bg-error/50'}`
                                }
                        >
                            {isBlocked ? 
                                <SettingsBackupRestore fontSize="small" className='hover:scale-105'/>
                            : 
                                <Block fontSize="small" className='hover:scale-105'/>
                            }
                        </button>
                    </div>
                );
            }
        }
    ]
}