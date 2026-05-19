import React from 'react';
import Loader from '../../components/shared/ui/Loader';
import { Block, Close, DateRangeOutlined, DiamondOutlined, EmailOutlined, PersonOutline, PhoneOutlined, PublicOutlined, SettingsBackupRestore, VerifiedUserOutlined, WcOutlined } from '@mui/icons-material';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useGetUserDetail, useToggleUserStatus } from '../../hooks/user/useUsers';
import { useBlockModalStore } from '../../stores/useBlockModalStore';
import { BLOCKED_REASON } from '../../constants/constants';
import { UserDetailSkeleton } from '../../components/shared/skeleton/UserDetailSkeleton';

interface Props {
    user_id: number;
    onClose: () => void;
}

const UserDetailModal: React.FC<Props> = ({ user_id, onClose }) => {
    // Lấy data
    const { data, isLoading } = useGetUserDetail(user_id);
    const user = (data as any)?.results || data || {};

    // Quản lý chức năng
    const { mutate: toggleUserStatus, isPending: isBanning } = useToggleUserStatus();
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();
    

    if (!user_id) return null;

    // Xử lý Block Artist
    const handleBanClick = (user: any, is_active: boolean) => {
        // gỡ block
        if(is_active) {
            showConfirm('save', () => {
                setConfirmLoading(true)
                toggleUserStatus({
                    id: user.id,
                    data: {
                        is_active: is_active,
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
    };

    if (isLoading) return <div className="fixed inset-0 bg-base/50 z-50 flex items-center justify-center"><Loader /></div>;
    
    const formattedDate = new Date(user.date_joined).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
    const isBlocked = !user.is_active;

    return (
        <div className="fixed inset-0 bg-base/80 z-50 flex justify-center items-center backdrop-blur-sm">
            {isLoading ? 
                <UserDetailSkeleton />
            :
                <div className="bg-panel w-[70vw] lg:w-[60vw] h-[80vh] rounded-2xl border border-border flex flex-col overflow-hidden relative shadow-2xl">
                    {/* header */}
                    <div className="p-6 border-b border-border flex justify-between items-center bg-search">
                        <div className="flex items-center gap-4">
                            <img src={user.profile_picture} alt="avatar" className="w-16 h-16 rounded-full object-cover shadow-lg" />
                            <div>
                                <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                                    {user.username} 
                                    {isBlocked && 
                                        <span className="text-xs bg-error text-text-main px-2 py-1 rounded-full uppercase tracking-wider">Blocked</span>
                                    }
                                </h2>
                                <p className="text-text-sub text-sm">{user.email}</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleBanClick(user, !isBlocked)}
                            disabled={isBanning}
                            className={`px-4 py-2 mr-10 flex items-center gap-2 rounded-full font-bold transition-transform hover:scale-105 
                                ${!isBlocked ? 'bg-error/10 text-error hover:bg-error hover:text-text-dark' : 'bg-highlight/10 text-highlight hover:bg-highlight hover:text-text-dark'}`}
                        >
                            {!isBlocked ? 
                                <>
                                    <Block fontSize="small"/> Block
                                </> 
                            : 
                                <>
                                    <SettingsBackupRestore fontSize="small"/> Activate
                                </>
                            }
                        </button>

                        <button 
                            onClick={onClose} 
                            className="absolute right-4 top-4 text-text-sub rounded-full border border-hover hover:text-text-main hover:scale-110 transition-all duration-300"
                        >
                            <Close fontSize="medium"/>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-panel">
                        {/* info*/}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Thông tin cá nhân */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2">
                                    Personal Information
                                </h3>
                                
                                <div className="flex items-center gap-3">
                                    <PersonOutline className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Full Name</p>
                                        <p className="text-text-main font-medium">{fullName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <EmailOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Email</p>
                                        <p className="text-text-main font-medium">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <PhoneOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Phone</p>
                                        <p className="text-text-main font-medium">{user.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <WcOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Gender</p>
                                        <p className="text-text-main font-medium capitalize">{user.gender || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <PublicOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Country</p>
                                        <p className="text-text-main font-medium uppercase">{user.country || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chi tiết tài khoản */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2">
                                    Account Details
                                </h3>

                                <div className="flex items-center gap-3">
                                    <VerifiedUserOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Role</p>
                                        <p className="text-text-main font-medium capitalize">
                                            {user.is_staff ? 'Admin / Staff' : user.type}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <DiamondOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Subscription</p>
                                        {user.is_premium ? (
                                            <span className="inline-flex items-center bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded text-xs font-bold mt-0.5">
                                                {user.subscription_plan}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded text-xs font-bold mt-0.5">
                                                Free
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <DateRangeOutlined className="text-text-sub" fontSize="small" />
                                    <div>
                                        <p className="text-xs text-text-sub">Date Joined</p>
                                        <p className="text-text-main font-medium">{formattedDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

export default UserDetailModal;