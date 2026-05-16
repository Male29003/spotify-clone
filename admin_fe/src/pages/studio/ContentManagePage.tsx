import React, { useCallback, useMemo, useState } from "react";
import { LibraryMusic } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import Pagination from "../../components/shared/ui/Pagination";
import DataTable from "../../components/main_ui/DataTable";
import { useDeleteDraftRelease, useGetMyReleases, useToggleActiveRelease } from "../../hooks/release/useReleases";
import { ReleaseColumns } from "../../sections/release/ReleaseColumn";
import ReleaseDetailModal from "../../sections/release/detail/studio/StudioReleaseDetailModal";
import { useConfirmModalStore } from "../../stores/useConfirmModalStore";
import { CustomToast } from "../../components/shared/feedback/CustomToast";
import SearchInput from "../../components/main_ui/SearchInput";
import Filter from "../../components/main_ui/Filter";
import ActionHeader from "../../components/main_ui/ActionHeader";
import PageTitle from "../../components/main_ui/Title";

const STATUS_FILTER = [
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Draft' },
    { id: 'pending', label: 'Pending' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'blocked', label: 'Blocked' },
];

const TYPE_FILTER = [
    { id: 'all', label: 'All' },
    { id: 'single', label: 'Singles' },
    { id: 'ep', label: 'EPs' },
    { id: 'album', label: 'Albums' },
];

const ContentManagePage: React.FC = () => {
    const navigate = useNavigate();
    
    // Set up tìm kiếm & Filter từ URL
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status') || 'published'; 
    const typeFilter = searchParams.get('type') || 'all';

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    
    // Quản lý Modal
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selectedRelease, setSelectedRelease] = useState<string>('');

    // Xử lý lấy param để lọc -> gọi API -> lấy đúng data cần
    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Truyền đầy đủ params xuống để Backend lọc
    const { data: myReleasesData, isLoading: loadingReleases } = useGetMyReleases({ 
        search: query, 
        page: page, 
        limit: limit, 
        status: statusFilter,
        type: typeFilter
    });

    // Quản lý chức năng
    const { mutate: deleteDraftRelease, isPending: deletingRelease } = useDeleteDraftRelease()
    const { mutate: toggleActiveRelease, isPending: deactivatingRelease } = useToggleActiveRelease();
    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();
    // xóa bản draft vĩnh viễn
    const handleDelete = useCallback((item: any) => {
        showConfirm('delete', () => {
            setLoading(true)
            deleteDraftRelease(item.short_id, {
                onSuccess: () => CustomToast.success(`Successfully delete draft release: ${item.title}`),
                onError: () => {
                    CustomToast.error(`Failed to delete release ${item.title}!`);
                },
                onSettled: () => {
                    setLoading(false);
                    closeModal();
                },
            });
        }, {
            title: `Delete Draft Release`,
            message: `Are you sure you want to delete "${item.title}"? It will be deleted permanently.`
        });
    }, [deleteDraftRelease, showConfirm, setLoading, closeModal]);
    // chỉ ẩn thôi 
    const handleSoftDelete = useCallback((item: any) => {
        const isDeactivating = item.is_active;
        const action = isDeactivating ? 'Deactivate' : 'Activate';
        showConfirm(isDeactivating ? 'delete' : 'save', () => {
            setLoading(true);
            toggleActiveRelease({
                short_id: item.short_id, 
                is_active: !item.is_active
            }, {
                onSuccess: () => CustomToast.success(`${action}d successfully!`),
                onError: () => {
                    CustomToast.error(`Failed to ${action.toLowerCase()} release!`);
                },
                onSettled: () => {
                    setLoading(false);
                    closeModal();
                },
            });
        }, {
            title: `${action} Release`,
            message: isDeactivating 
                ? `Are you sure you want to deactivate "${item.title}"? It will be hidden from listeners.`
                : `Activate "${item.title}" to make it visible again?`,
            confirmBtn: `${action}`
        });
    }, [toggleActiveRelease, showConfirm, setLoading, closeModal]);
    // Xử lý data render
    const { data, totalCount, columns } = useMemo(() => {
        const releases = (myReleasesData as any)?.results || (myReleasesData as any)?.data || myReleasesData || [];
        return {
            data: releases,
            totalCount: (myReleasesData as any)?.count || 0,
            columns: ReleaseColumns({
                onEdit: (short_id: string) => {
                    setSelectedRelease(short_id);
                    setIsOpenModal(true);
                },
                onDelete: (item: any) => {
                    if (item.is_blocked) {
                        CustomToast.error("Cannot perform action! This release is blocked by Admin.");
                        return;
                    }
                    // Nếu đã public -> cho phép Deactivate
                    if (item.is_published) {
                        handleSoftDelete(item);
                    } 
                    // Nếu đang Pending -> ko xóa
                    else if (item.status === 'pending' || item.is_pending) {
                        CustomToast.error("This release is pending approval. You cannot delete it now.");
                    }
                    // Nếu là Bản nháp (Draft) -> Cho phép xóa vĩnh viễn
                    else {
                        handleDelete(item);
                    }
                },
                isAdmin: false
            })
        };
    }, [myReleasesData, handleDelete, handleSoftDelete]);
    
    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10 animate-fadeIn">
            {/* header */}
            <PageTitle
                title="My Releases"
                children={(
                    <button 
                        onClick={() => navigate('/studio/upload')}
                        className="bg-highlight text-text-dark font-bold px-5 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                    >
                        <LibraryMusic fontSize="small" /> Upload Release
                    </button>
                )}
            />

            {/* thanh tìm kiếm và bộ lọc */}
            <ActionHeader>
                <div className="max-w-[70vw]">
                    <SearchInput 
                        initialValue={query}
                        placeholder="Search by title..."
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
            
            {/* Bảng dữ liệu */}
            <DataTable 
                columns={columns}
                data={data}
                isLoading={loadingReleases || deactivatingRelease || deletingRelease}
            />

            <Pagination 
                page={page} 
                limit={limit} 
                totalCount={totalCount}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />

            {/* Modal chi tiết release */}
            {isOpenModal && selectedRelease && (
                <ReleaseDetailModal
                    short_id={selectedRelease}
                    onClose={() => {
                        setIsOpenModal(false);
                        setSelectedRelease('');
                    }}
                />
            )}
        </div>
    );
};

export default ContentManagePage;