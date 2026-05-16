import { Block, SettingsBackupRestore, Visibility } from '@mui/icons-material';
import type { Column } from '../../components/main_ui/DataTable';
import { formatNumber } from '../../utils/formatters';

export const TrackColumns = ({ onEdit, onDelete}: any): Column[] => {
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
            width: '25%',
            className: 'border-r border-border', 
            render: (item: any) => 
                <div className="font-bold text-text-main capitalize truncate">
                    {item.title}
                </div>
        },
        {
            key: 'artist',
            header: 'Artist',
            width: '10%',
            className: 'border-r border-border', 
            render: (item: any) => <span className="font-bold text-text-main capitalize ">{item.artist.stage_name}</span>
        },
        {
            key: 'listens',
            header: 'Listens',
            width: '15%',
            className: 'border-r border-border text-center',
            render: (item: any) => {
                return item.downloads ? (
                    <span className="text-text-sub line-clamp-2">{formatNumber(item.listens)}</span>
                ) : (
                    <span className='text-text-sub line-clamp-2'>---</span>
                );
            }
        },
        {
            key: 'downloads',
            header: 'Downloads',
            width: '15%',
            className: 'border-r border-border text-center',
            render: (item: any) => {
                return item.downloads ? (
                    <span className="text-text-sub line-clamp-2">{formatNumber(item.downloads)}</span>
                ) : (
                    <span className='text-text-sub line-clamp-2'>---</span>
                );
            }
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
                        className="text-info/90 rounded-md w-8 h-8 hover:bg-base hover:text-info-dark"
                    >
                        <Visibility fontSize="small" />
                    </button>
                    <button 
                        onClick={() => onDelete(item)} 
                        className={`p-1 rounded-md transition-all ${(item.is_active || item.is_blocked) ? 'text-error/95 hover:bg-error/10' : 'text-highlight/80 hover:bg-highlight/10'}`}
                        title={item.is_active ? "Deactivate" : "Activate"}
                    >
                        {(item.is_active || item.is_blocked) ? 
                            <Block fontSize='small'/> 
                        : 
                            <SettingsBackupRestore fontSize='small'/>
                        }
                    </button>
                </div>
            )
        }
    ];
};