import  { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useConfirmModalStore } from "../../../stores/useConfirmModalStore";
import { useAdminToggleArtist, useGetAdminArtists } from "../../../hooks/artist/useArtists";
import { ArtistColumns } from "../../../sections/artist/ArtistColumn";
import { CustomToast } from "../../../components/shared/feedback/CustomToast";
import PageTitle from "../../../components/main_ui/Title";
import ActionHeader from "../../../components/main_ui/ActionHeader";
import SearchInput from "../../../components/main_ui/SearchInput";
import DataTable from "../../../components/main_ui/DataTable";
import ArtistDetailModal from "../../../sections/artist/ArtistDetailModal";
import Filter from "../../../components/main_ui/Filter";
import Pagination from "../../../components/shared/ui/Pagination";
import { BLOCKED_REASON } from "../../../constants/constants";
import { useBlockModalStore } from "../../../stores/useBlockModalStore";


const STATUS_FILTER = [
    { id: 'active', label: 'Active' },
    { id: 'blocked', label: 'Blocked' },
]

const ArtistManagePage = () => {
    // Quản lý Search & Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const statusFilter = searchParams.get('status') || 'active'

    // Xử lý lấy param để lọc -> gọi API -> lấy đúng data cần
    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Quản lý Modal
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selectedArtistId, setSelectedArtistId] = useState<string>();

    // Quản lý lấy data theo filter
    const { data: artistData, isLoading } = useGetAdminArtists({ 
        search: query, 
        page: page, 
        limit: limit, 
        status: statusFilter,
    });
   

    //Quản lý chức năng
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();
    const { mutate: toggleBlockArtist, isPending: loadingBlocking } = useAdminToggleArtist()

    // Lấy data NS
    const { data, columns, totalCount } = useMemo(() => {
        const artists = (artistData as any)?.results || artistData ||  []
        return {
            data: artists,
            totalCount: (artistData as any)?.count || 0,
            columns: ArtistColumns({
                onEdit: (short_id: string) => {
                    setSelectedArtistId(short_id)
                    setIsOpenModal(true)
                },
                onDelete: (artist: any) => {
                    // gỡ block
                    if(artist.is_blocked){
                        showConfirm('save', () => {
                            setConfirmLoading(true)
                            toggleBlockArtist({
                                short_id: artist.short_id,
                                data: {
                                    action: 'unblock'
                                }
                            }, {
                                onSuccess: () => CustomToast.success(`Successfully unblock artist ${artist.stage_name}.`),
                                onError: (error) => {
                                    CustomToast.error(`Failed to unblock ${artist.stage_name}!`)
                                    console.error(`Error: ${error}`)
                                },
                                onSettled: () => {
                                    setConfirmLoading(false)
                                    closeModal()
                                }
                            })
                        }, {
                            title: `Unblock Artist Confirm`,
                            message: `Are you sure you want to unblock "${artist.stage_name}"?`
                        })
                    } 
                    // block
                    else {
                        openBlockModal((reasonId, note) => {
                            setBlockLoading(true);
                            toggleBlockArtist({
                                short_id: artist.short_id,
                                data: { 
                                    action: 'block', 
                                    block_reason: reasonId, 
                                    block_note: note 
                                }
                            }, {
                                onSuccess: () => {
                                    CustomToast.success(`Successfully blocked release "${artist.stage_name}"`);
                                    closeBlockModal();
                                },
                                onError: (error) => {
                                    CustomToast.error(`Failed to block ${artist.stage_name}!`)
                                    console.error(`Error: ${error}.`)
                                },
                                onSettled: () => 
                                    setBlockLoading(false)
                            });
                        }, {
                            title: "Block Release",
                            itemName: artist.stage_name,
                            reasons: BLOCKED_REASON,
                            actionLabel: "Block"
                        });
                    }
                }
            })
        }
    }, [artistData])

    return (
        <div className='w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10 animate-fadeIn'>
            {/* header */}
            <PageTitle
                title='Artist Manage'
                subtitle='Process pending applications of new artists and manage status of active artists in system'
            />
            {/* thanh tìm kiếm và bộ lọc */}
            <ActionHeader>
                <div className="max-w-[70vw]">
                    <SearchInput 
                        initialValue={query}
                        placeholder="Find by name, stage name..."
                        onSubmit={(val) => {
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

            {/* bảng dữ liệu*/}
            <DataTable 
                columns={columns}
                data={data}
                isLoading={isLoading || loadingBlocking}
            />

            <Pagination
                page={page} 
                limit={limit} 
                totalCount={totalCount}
                onPageChange={setPage} 
                onLimitChange={(l) => { 
                    setLimit(l); 
                    setPage(1); 
                }}
            />

            {/* Modal chi tiết */}
            {isOpenModal && selectedArtistId && (
                <ArtistDetailModal
                    short_id={selectedArtistId}
                    onClose={() => setSelectedArtistId('')} 
                />
            )}

        </div>
    );
};

export default ArtistManagePage;