import React, { useMemo, useState } from 'react';
import { AddOutlined  } from '@mui/icons-material';
import { useGetGenres, useToggleActiveGenre } from '../../../hooks/genre/useGenre';
import { useSearchParams } from 'react-router-dom';
import AddEditGenreModal from '../../../sections/genre/AddEditGenreModal';
import { GenreColumns } from '../../../sections/genre/GenreColumn';
import DataTable from "../../../components/main_ui/DataTable";
import Pagination  from '../../../components/shared/ui/Pagination';
import { CustomToast } from '../../../components/shared/feedback/CustomToast';
import { useConfirmModalStore } from '../../../stores/useConfirmModalStore';
import PageTitle from '../../../components/main_ui/Title';
import Filter from '../../../components/main_ui/Filter';
import ActionHeader from '../../../components/main_ui/ActionHeader';
import SearchInput from '../../../components/main_ui/SearchInput';

const STATUS_FILTER =[
    { id: 'active', label: 'Active' },
    { id: 'blocked', label: 'Blocked' },
]

const GenreManagePage: React.FC = () => {
    // Tiìm kiếm
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    // Phân trang
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const statusFilter = searchParams.get('status') || 'active';

    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Lấy data
    const { data: genreData, isLoading } = useGetGenres({
        search: query,
        page: page,
        limit: limit,
        is_active: statusFilter === 'active',
    });
    
    // Quản lý mở edit modal
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingGenre, setEditingGenre] = useState<any>(null);

    const handleOpenModal = (genre: any = null) => {
        setEditingGenre(genre);
        setIsOpenModal(true);
    };

    // Xử lý xóa & mở confirm modal
    const { mutate: deleteGenre, isPending } = useToggleActiveGenre()
    const { showConfirm, closeModal, setLoading} = useConfirmModalStore()
    const { data, columns, totalCount } = useMemo(() => {
        const genres = (genreData as any)?.results || genreData || []
        return {
            data: genres,
            totalCount: (genreData as any)?.count || 0,
            columns: GenreColumns({
                onEdit: (genre: any) => {
                    setEditingGenre(genre);
                    setIsOpenModal(true);
                }, 
                onDelete: (genre: any) => {
                    const action = genre.is_active ? 'Block' : 'Unblock'
                    showConfirm(genre.is_active ? 'delete' : 'save', () => {
                        setLoading(true)
                        deleteGenre({
                            slug: genre.slug,
                            is_active: !genre.is_active
                        }, {
                            onSuccess: () => CustomToast.success(`Successfully ${action.toLowerCase()} genre!`),
                            onError: () => {
                                CustomToast.error(`Failed to ${action.toLowerCase()} !`)
                            },
                            onSettled: () => {
                                setLoading(false)
                                closeModal()
                            },
                        })
                    },{
                        title: `${action} Genre Confirm`,
                        message: `Are you sure you want to ${action.toLowerCase()} genre "${genre.name}"? All tracks belong to this genre will be set to 'Unknown genre'`,
                    })
                }
            })
        }

    }, [genreData])

    console.log(data)
    
    return (
        <div className='w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10'>
            {/* Header */}
            <PageTitle
                title="Genre"
                subtitle="Create, edit, and manage music genres across the platform"
                children={(
                    <button 
                        onClick={() => handleOpenModal()}
                        className="max-w-50 xl:w-full flex items-center justify-center gap-2 bg-highlight text-text-dark px-6 py-2.5 rounded-full font-bold hover:scale-105 transition-all shadow-md shrink-0"
                    >
                        <AddOutlined fontSize="small" /> Add Genre
                    </button>
                )}
            />
            <ActionHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="w-full md:flex-1 md:max-w-2xl">
                        <SearchInput 
                            initialValue={query}
                            placeholder="Search genre by name..."
                            onSubmit={(val: any) => {
                                setPage(1)
                                updateParams({ q: val })
                            }}
                        />
                    </div>
                </div>

                {/* Bộ lọc */}
                <div className="flex flex-wrap items-center gap-6 border-t border-border pt-5 mt-4">
                    <Filter
                        label="Status"
                        value={statusFilter}
                        options={STATUS_FILTER}
                        onChange={(val) => {
                            setPage(1);
                            updateParams({ status: val });
                        }}
                    />
                </div>
            </ActionHeader>

            <DataTable
                columns={columns} 
                data={data} 
                isLoading={isLoading || isPending} 
            />

            
            <Pagination 
                page={page} 
                limit={limit} 
                totalCount={totalCount}
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />

            {isOpenModal  &&
                <AddEditGenreModal
                    genre={editingGenre}
                    onClose={() => setIsOpenModal(false)}
                />
            }
        </div>
    )
    
};

export default GenreManagePage;