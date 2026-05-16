import { EditOutlined, Block, SettingsBackupRestore } from '@mui/icons-material';
import type { Column } from '../../components/main_ui/DataTable';

export const GenreColumns = ({ onEdit, onDelete }: any): Column[] => {
    return  [
        {
            key: 'id',
            header: 'ID',
            width: '10%',
            className: 'border-r border-border text-center',
            render: (_: any, index: number) => <span className="text-text-sub">{index + 1}</span>
        },
        {
            key: 'image',
            header: 'Image',
            width: '15%',
            className: 'border-r border-border',
            render: (item: any) => (
                item.image ? <img src={item.image} alt="Genre" className="w-20 rounded object-cover" /> : <span>-</span>
            )
        },
        {
            key: 'name',
            header: 'Name',
            width: '25%',
            className: 'border-r border-border', 
            render: (item: any) => <span className="font-bold text-text-main">{item.name}</span>
        },
        {
            key: 'description',
            header: 'Description',
            width: '35%',
            className: 'border-r border-border',
            render: (item: any) => <span className="text-text-sub line-clamp-2">{item.description}</span>
        },
        {
            key: 'action',
            header: 'Action',
            width: '15%',
            className: 'text-center',
            render: (item: any) => (
                <div className="flex items-center justify-center text-center gap-1">
                    <button 
                        onClick={() => onEdit(item)} 
                        className="text-info/90 rounded-md w-8 h-8
                                hover:bg-base hover:text-info-dark"
                    >
                        <EditOutlined fontSize="small" className='hover:scale-105'/>
                    </button>
                    <button 
                        onClick={() => onDelete(item)} 
                        className={`rounded-md w-8 h-8 hover:scale-105
                            ${item.is_active ? 
                                'text-error/95 hover:bg-600/20 hover:text-error' 
                                : 'text-highlight/80 hover:bg-highlight/10 hover:text-highlight'}`
                            }
                    >
                        {item.is_active ? 
                            <Block fontSize="small" className='hover:scale-105'/>
                        : 
                            <SettingsBackupRestore fontSize="small" className='hover:scale-105'/>
                        }
                    </button>
                </div>
            )
        }
    ];
};