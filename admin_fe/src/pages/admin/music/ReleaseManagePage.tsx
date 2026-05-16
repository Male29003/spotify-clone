import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../../components/shared/ui/Pagination";
import ReleaseDetailModal from "../../../sections/release/detail/admin/AdminReleaseDetailModal";
import { useAdminToggleRelease, useGetAdminReleases } from "../../../hooks/release/useReleases";
import { ReleaseColumns } from "../../../sections/release/ReleaseColumn";
import DataTable from "../../../components/main_ui/DataTable";
import { useConfirmModalStore } from "../../../stores/useConfirmModalStore";
import { CustomToast } from "../../../components/shared/feedback/CustomToast";
import PageTitle from "../../../components/main_ui/Title";
import ActionHeader from "../../../components/main_ui/ActionHeader";
import SearchInput from "../../../components/main_ui/SearchInput";
import Filter from "../../../components/main_ui/Filter";
import { BLOCKED_REASON } from "../../../constants/constants";
import { useBlockModalStore } from "../../../stores/useBlockModalStore";


const STATUS_FILTER = [
    { id: 'published', label: 'Published' },
    { id: 'blocked', label: 'Blocked' },
];

const TYPE_FILTER = [
    { id: 'all', label: 'All' },
    { id: 'single', label: 'Singles' },
    { id: 'ep', label: 'EPs' },
    { id: 'album', label: 'Albums' },
];

const ReleaseManagePage = () => {
    // Set up tìm kiếm & Filter từ URL
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status') || 'published';
    const typeFilter = searchParams.get('type') || 'all';

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Quản lý mở modal chi tiết
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selectedShort_id, setSelectedShort_id] = useState<any>(null);

    // Xử lý lấy param để lọc -> gọi API -> lấy đúng data cần
    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Quản lý lấy data theo filter
    const is_published = statusFilter === 'published';
    const is_blocked = statusFilter === 'blocked';
    const { data: releaseData, isLoading } = useGetAdminReleases({ 
        search: query, 
        page: page, 
        limit: limit, 
        is_blocked: is_blocked,
        is_published: is_published,
        type: typeFilter !== 'all' ? typeFilter : undefined
    });

    
    // Quản lý chức năng
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();
    const { mutate: toggleReleaseStatus, isPending } = useAdminToggleRelease();
    // Xử lý data render
    const { data, totalCount, columns } = useMemo(() => {
        const releases = (releaseData as any)?.results || releaseData || [];
        return {
            data: releases,
            totalCount: (releaseData as any)?.count,
            columns: ReleaseColumns({
                onEdit: (short_id: string) => {
                    setSelectedShort_id(short_id);
                    setIsOpenModal(true);
                },
                onDelete: (release: any) => {
                    // gỡ block
                    if(release.is_blocked) {
                        showConfirm('save', () => {
                            setConfirmLoading(true);
                            toggleReleaseStatus({
                                short_id: release.short_id,
                                data: { action: 'unblock' }
                            }, {
                                onSuccess: () => CustomToast.success(`Successfully unblocked release ${release.title}.`),
                                onError: (error) => {
                                    CustomToast.error(`Failed to unblock ${release.title}!`)
                                    console.error(`Error: ${error}`)
                                },
                                onSettled: () => { 
                                    setConfirmLoading(false); 
                                    closeModal(); 
                                }
                            });
                        }, { 
                            title: 'Unblock Release', 
                            message: `Are you sure you want to unblock ${release.title}?` 
                        });
                    } 
                    // block
                    else {
                        openBlockModal((reasonId, note) => {
                            setBlockLoading(true);
                            toggleReleaseStatus({
                                short_id: release.short_id,
                                data: { 
                                    action: 'block', 
                                    block_reason: reasonId, 
                                    block_note: note 
                                }
                            }, {
                                onSuccess: () => {
                                    CustomToast.success(`Successfully blocked release "${release.title}"`);
                                    closeBlockModal();
                                },
                                onError: (error) => {
                                    CustomToast.error(`Failed to block ${release.title}!`)
                                    console.error(`Error: ${error}.`)
                                },
                                onSettled: () => 
                                    setBlockLoading(false)
                            });
                        }, {
                            title: "Block Release",
                            itemName: release.title,
                            reasons: BLOCKED_REASON,
                            actionLabel: "Block"
                        });
                    }
                },
                isAdmin: true
            })
        }
    }, [releaseData]);

    return (
        <div className='w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10'>
            {/* header */}
            <PageTitle
                title="Release"
                subtitle="Process pending applications of new artists and manage status of active artists in system"
            />

            {/* thanh tìm kiếm và bộ lọc */}
            <ActionHeader>
                <div className="max-w-[70vw]">
                    <SearchInput 
                        initialValue={query}
                        placeholder="Search by release title, artist name..."
                        onSubmit={(val: any) => {
                            setPage(1)
                            updateParams({ q: val })
                        }}
                    />
                </div>
                <div className="flex flex-wrap items-end gap-6 border-t border-border pt-5 mt-2">
                    <Filter
                        label='Release Type'
                        value={typeFilter}
                        options={TYPE_FILTER}
                        onChange={(val) => {
                            setPage(1);
                            updateParams({ type: val });
                        }}
                    />
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
                isLoading={isLoading || isPending}
            />
            
            <Pagination 
                page={page} 
                limit={limit} 
                totalCount={totalCount}
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(l) => { 
                    setLimit(l);
                    setPage(1); 
                }}
            />

            {/* Modal chi tiết */}
            {isOpenModal && selectedShort_id && (
                <ReleaseDetailModal
                    short_id={selectedShort_id}
                    onClose={() => {
                        setIsOpenModal(false);
                        setSelectedShort_id(null);
                    }}
                />
            )}
        </div>
    )
}

export default ReleaseManagePage;