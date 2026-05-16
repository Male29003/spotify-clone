import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../../components/shared/ui/Pagination";
import { useGetUsers, useToggleUserStatus } from "../../../hooks/user/useUsers";
import { useConfirmModalStore } from "../../../stores/useConfirmModalStore";
import { CustomToast } from "../../../components/shared/feedback/CustomToast";
import DataTable from "../../../components/main_ui/DataTable";
import { UserColumns } from "../../../sections/user/UserColumns";
import UserDetailModal from "../../../sections/user/UserDetailModal";
import PageTitle from "../../../components/main_ui/Title";
import ActionHeader from "../../../components/main_ui/ActionHeader";
import SearchInput from "../../../components/main_ui/SearchInput";
import Filter from "../../../components/main_ui/Filter";
import { useBlockModalStore } from "../../../stores/useBlockModalStore";
import { BLOCKED_REASON } from "../../../constants/constants";


const STATUS_FILTER =[
    { id: 'active', label: 'Active' },
    { id: 'blocked', label: 'Blocked' },
]

const UsersManagePage: React.FC = () => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null)
    //Quản lý Search & Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status') || 'active';

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Lấy data
    const { data: usersData, isLoading } = useGetUsers({
        search: query, 
        page: page, 
        limit: limit,
        is_active: statusFilter === 'active' ? true : false,
        is_staff: false
    });

    // Quản lý chức năng
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();
        
    const { mutate: toggleUserStatus, isPending } = useToggleUserStatus();
    const { data, totalCount, columns } = useMemo(() => {
        const users = (usersData as any)?.results || (usersData as any)?.data || usersData || [];
        return {
            data: users,
            totalCount: (usersData as any)?.count || 0,
            columns: UserColumns({
                onEdit: (id: number) => {
                    setSelectedId(id);
                    setIsOpenModal(true);
                },
                onDelete: (user: any) => {
                    // gỡ block
                    if(user.is_active) {
                        showConfirm('save', () => {
                            setConfirmLoading(true)
                            toggleUserStatus({
                                id: user.id,
                                data: {
                                    is_active: true,
                                }
                            }, {
                                onSuccess: () => CustomToast.success(`Successfully unblock user ${user.username}.`),
                                onError: (error: any) => {
                                    CustomToast.error(`Failed to unblock ${user.username}!`)
                                    console.error(`Error: ${error}`)
                                },
                                onSettled: () => {
                                    setConfirmLoading(false)
                                    closeModal()
                                }
                            })
                        })
                    } 
                    // block
                    else {
                        openBlockModal((reasonId, note) => {
                            setBlockLoading(true);
                            toggleUserStatus({
                                id: user.id,
                                data: { 
                                    is_active: false, 
                                    block_reason: reasonId, 
                                    block_note: note 
                                }
                            }, {
                                onSuccess: () => {
                                    CustomToast.success(`Successfully blocked user "${user.username}"`);
                                    closeBlockModal();
                                },
                                onError: (error) => {
                                    CustomToast.error(`Failed to block ${user.username}!`)
                                    console.error(`Error: ${error}.`)
                                },
                                onSettled: () => 
                                    setBlockLoading(false)
                            });
                        }, {
                            title: "Block Release",
                            itemName: user.username,
                            reasons: BLOCKED_REASON,
                            actionLabel: "Block"
                        });
                    }
                },
                isAdmin: true
            })
        }
    }, [usersData]);
    
    return (
        <div className='w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10 animate-fadeIn'>
            {/* header */}
            <PageTitle
                title="User"
                subtitle="Manage listeners and artists"
            />

            {/* thanh tìm kiếm và bộ lọc */}
            <ActionHeader>
                <div className="max-w-[70vw]">
                    <SearchInput 
                        initialValue={query}
                        placeholder="Search by name, email..."
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
                data={data}
                columns={columns}
                isLoading={isLoading || isPending}
            />

            <Pagination 
                page={page} 
                limit={limit} 
                totalCount={totalCount}       
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />

            {isOpenModal && selectedId &&
                <UserDetailModal 
                    user_id={selectedId}
                    onClose={() => {
                        setIsOpenModal(false);
                        setSelectedId(null);
                    }}
                />
            }
        </div>
    );
};

export default UsersManagePage;