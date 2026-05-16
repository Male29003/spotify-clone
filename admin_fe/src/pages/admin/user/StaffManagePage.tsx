import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../../components/shared/ui/Pagination";
import { useCreatedStaff, useDeleteStaff, useGetStaff, useUpdateStaff } from "../../../hooks/user/useUsers";
import { useConfirmModalStore } from "../../../stores/useConfirmModalStore";
import { CustomToast } from "../../../components/shared/feedback/CustomToast";
import DataTable from "../../../components/main_ui/DataTable";
import PageTitle from "../../../components/main_ui/Title";
import ActionHeader from "../../../components/main_ui/ActionHeader";
import SearchInput from "../../../components/main_ui/SearchInput";
import { AddOutlined } from "@mui/icons-material";
import { useAuthStore } from "../../../stores/auth/authStore";
import StaffFormModal from "../../../sections/staff/AddEditStaffModal";
import { StaffColumns } from "../../../sections/staff/StaffColumns";

const StaffManagePage: React.FC = () => {
    const { user: currentUser } = useAuthStore(state => state);
    const isSuperAdmin = (currentUser as any)?.is_superuser;

    // Quản lý search
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    // quản lý modal tạo mới
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const updateParams = (newParams: any) => {
        const currentParams = Object.fromEntries([...searchParams]);
        setSearchParams({ ...currentParams, ...newParams });
    };

    // Lấy data
    const { data: staffData, isLoading } = useGetStaff({
        search: query, page: page, limit: limit
    });

    // quản lý chức năng
    const { mutate: createStaff, isPending: creatingStaff } = useCreatedStaff()
    const { mutate: updateStaff, isPending: updatingStaff } = useUpdateStaff();
    const { mutate: deleteStaff, isPending: deletingStaff } = useDeleteStaff();
    const { showConfirm, closeModal, setLoading} = useConfirmModalStore()

    const { data, columns, totalCount } = useMemo(() => {
        const staffs = (staffData as any)?.results || (staffData as any)?.data || staffData || [];
        return {
            data: staffs,
            totalCount: (staffData as any)?.count || 0,
            columns: StaffColumns({
                onEdit: (staff: any) => { 
                    setSelectedStaff(staff); 
                    setIsModalOpen(true); 
                },
                onDelete: (staff: any) => handleDeleteStaff(staff),
                isAdmin: isSuperAdmin
            })
        }
    }, [staffData])

    const handleSaveStaff = (formData: any) => {
        setLoading(true);
        
        const payload = { ...formData };
        if (!payload.new_password) delete payload.new_password;
    
        if (selectedStaff) {
            updateStaff({ 
                id: selectedStaff.id, 
                data: payload 
            }, {
                onSuccess: () => { 
                    setIsModalOpen(false); 
                    CustomToast.success("Staff updated successfully!"); 
                },
                onSettled: () => setLoading(false)
            });
        } else {
            createStaff(payload, {
                onSuccess: () => { 
                    setIsModalOpen(false); 
                    CustomToast.success("Staff created!"); 
                },
                onSettled: () => setLoading(false)
            });
        }
    };
    
    const handleDeleteStaff = (staff: any) => {
        showConfirm('warning', () => {
            setLoading(true);
            deleteStaff(staff.id, {
                onSuccess: () => { 
                    CustomToast.success("Staff deleted forever!"); 
                    closeModal(); 
                },
                onSettled: () => setLoading(false)
            });
        }, {
            title: "PERMANENT DELETE",
            message: `Are you sure you want to delete staff "${staff.username}"? This cannot be undone.`,
            confirmBtn: "Delete Forever"
        });
    };

    const isPending = creatingStaff || updatingStaff || deletingStaff

    return (
        <div className='w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10 animate-fadeIn'>
            {/* header*/}
            <PageTitle 
                title="Staff Management"
                subtitle="Manage internal system accounts and moderators"
                children={isSuperAdmin && (
                    <button 
                        onClick={() => {
                            setSelectedStaff(undefined)
                            setIsModalOpen(true)
                        }}
                        className="flex items-center gap-2 bg-highlight text-text-dark px-6 py-2.5 rounded-full font-bold transition-transform hover:scale-105 whitespace-nowrap shadow-lg"
                    >
                        <AddOutlined fontSize="small" /> New Staff
                    </button>
                )}
            />
            
            {/* thanh tìm kiếm và nút tạo mới */}
            <ActionHeader>
                <div className="flex-1 max-w-[70vw]">
                    <SearchInput 
                        initialValue={query}
                        placeholder="Search by name, email..."
                        onSubmit={(val: any) => {
                            setPage(1)
                            updateParams({ q: val })
                        }}
                        />
                </div>
            </ActionHeader>

            {/* Modal */}
            {isModalOpen && (
                <StaffFormModal 
                    staff={selectedStaff} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveStaff}
                    isLoading={isLoading || isPending}
                />
            )}

            {/* bảng dữ liệu */}
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
        </div>
    );
};

export default StaffManagePage;