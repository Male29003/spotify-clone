import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../../components/main_ui/DataTable';
import { TrackColumns } from '../../../sections/track/TrackColumns';
import { useGetTracks, useAdminUpdateTrackStatus } from '../../../hooks/track/useTracks';
import Pagination from '../../../components/shared/ui/Pagination';
import TrackDetailModal from '../../../sections/track/TrackDetailModal';
import PageTitle from '../../../components/main_ui/Title';
import ActionHeader from '../../../components/main_ui/ActionHeader';
import SearchInput from '../../../components/main_ui/SearchInput';
import { useConfirmModalStore } from '../../../stores/useConfirmModalStore';
import { CustomToast } from '../../../components/shared/feedback/CustomToast';
import Filter from '../../../components/main_ui/Filter';
import BlockConfirmModal from '../../../components/shared/feedback/BlockConfirmModal';
import { BLOCKED_REASON } from '../../../constants/constants';
import { useBlockModalStore } from '../../../stores/useBlockModalStore';

const STATUS_FILTER =[
    { id: 'active', label: 'Active' },
    { id: 'blocked', label: 'Blocked' },
]

const TrackManagePage: React.FC = () => {
    // Set up tìm kiếm & Filter từ URL
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const statusFilter = searchParams.get('status') || 'active';
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Quản lý mở modal chi tiết
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingTrack, setEditingTrack] = useState<any>(null);
    const { showConfirm, closeModal, setLoading: setConfirmLoading} = useConfirmModalStore()
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore()

    // Render data
    const { data: tracksData, isLoading } = useGetTracks({
        search: query, 
        page: page, 
        limit: limit,
        status: statusFilter
    });
    // Quản lý chức năng
    const { mutate: toggleTrackStatus, isPending } = useAdminUpdateTrackStatus()

    const { data, totalCount, columns} = useMemo(() => {
        const tracks = (tracksData as any)?.results || tracksData || [];
        return {
            data: tracks,
            totalCount: (tracksData as any)?.count || 0,
            columns: TrackColumns({
                onEdit: (track: any) => {
                    setEditingTrack(track);
                    setIsOpenModal(true);
                },
                onDelete: (track: any) => {
                    // gỡ block
                    if(track.is_blocked) {
                        showConfirm('save', () => {
                            setConfirmLoading(true);
                            toggleTrackStatus({
                                short_id: track.short_id,
                                data: { action: 'unblock' }
                            }, {
                                onSuccess: () => CustomToast.success(`Successfully unblocked song ${track.title}.`),
                                onError: (error) => {
                                    CustomToast.error(`Failed to unblock ${track.title}!`)
                                    console.error(`Error: ${error}`)
                                },
                                onSettled: () => { 
                                    setConfirmLoading(false); 
                                    closeModal(); 
                                }
                            });
                        }, { 
                            title: "Unblock Song", 
                            message: `Restore song "${track.title}"?` 
                        });
                    } 
                    // block
                    else {
                        openBlockModal((reasonId, note) => {
                            setBlockLoading(true);
                            toggleTrackStatus({
                                short_id: track.short_id,
                                data: { 
                                    action: 'block', 
                                    block_reason: reasonId, 
                                    block_note: note 
                                }
                            }, {
                                onSuccess: () => {
                                    CustomToast.success(`Successfully blocked song "${track.title}"`);
                                    closeBlockModal();
                                },
                                onError: (error) => {
                                    CustomToast.error(`Failed to block ${track.title}!`)
                                    console.error(`Error: ${error}.`)
                                },
                                onSettled: () => setBlockLoading(false)
                            });
                        }, {
                            title: "Block Song",
                            itemName: track.title,
                            reasons: BLOCKED_REASON,
                            actionLabel: "Block"
                        });
                    }
                }
            })
        }
    }, [tracksData])

    return (
        <div className='w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10'>
            {/* header*/}
            <PageTitle
                title="Track"
                subtitle="Manage status of songs in system"
            />

            <ActionHeader>
                <div className="max-w-[70vw]">
                    <SearchInput 
                        initialValue={query}
                        placeholder="Search by title, artist, ..."
                        onSubmit={(val: any) => {
                            setPage(1)
                            updateParams({ q: val })
                        }}
                    />
                </div>
                <div className="flex flex-wrap items-end gap-6 border-t border-border pt-5 mt-2">
                    <Filter
                        label='Status'
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

            {isOpenModal &&
                <TrackDetailModal
                    track={editingTrack}
                    onClose={() => setIsOpenModal(false)}
                />
            }
        </div>
    );
};

export default TrackManagePage;