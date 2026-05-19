import React, { useState } from 'react';
import Loader from '../../components/shared/ui/Loader';
import { Block, Close, DateRangeOutlined, EmailOutlined, EventAvailableOutlined, PersonOutline, PublicOutlined, SettingsBackupRestore, VerifiedUserOutlined, WcOutlined } from '@mui/icons-material';
import {useGetAdminArtistDetail, useAdminToggleArtist} from '../../hooks/artist/useArtists';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import Player from '../../layouts/player/Player';
import ReleaseRow from './ReleaseRow';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useBlockModalStore } from '../../stores/useBlockModalStore';
import { BLOCKED_REASON } from '../../constants/constants';
import { formatDate } from '../../utils/formatters';
import { ArtistDetailSkeleton } from '../../components/shared/skeleton/ArtistDetailSkeleton';

interface Props {
    short_id: string;
    onClose: () => void;
}

const ArtistDetailModal: React.FC<Props> = ({ short_id, onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');
    // Lấy data
    const { data, isLoading } = useGetAdminArtistDetail(short_id);
    const artist = (data as any)?.results || data || {};
    const releases = (data as any)?.releases || [];

    // Quản lý chức năng
    const { setCurrentTrack, setQueue } = usePlayerStore()
    const { mutate: toggleArtistBan, isPending: isBanning } = useAdminToggleArtist();
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();

    if (!short_id) return null;

    // Xử lý Block Artist
    const handleBanClick = () => {
        // gỡ block
        if (artist.is_blocked) {
            showConfirm('save', () => {
                setConfirmLoading(true);
                toggleArtistBan({ 
                    short_id, 
                    data: { action: 'unblock' } 
                }, {
                    onSuccess: () => 
                        CustomToast.success(`Successfully unblocked artist ${artist.stage_name}.`),
                    onError: (error) => {
                        CustomToast.error("Failed to unblock artist!");
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => { 
                        setConfirmLoading(false); 
                        closeModal(); 
                    }
                });
            }, { 
                title: "Unblock Artist", 
                message: "Are you sure you want to restore this artist?" 
            });
        } 
        // block
        else {
            openBlockModal((reasonId, note) => {
                setBlockLoading(true);
                toggleArtistBan({ 
                    short_id, 
                    data: { 
                        action: 'block', 
                        block_reason: reasonId, 
                        block_note: note 
                    }
                }, {
                    onSuccess: () => {
                        CustomToast.success("Successfully blocked release!");
                        closeBlockModal();
                    },
                    onError: (error) => {
                        CustomToast.error("Failed to block artist!");
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => setBlockLoading(false)
                });
            }, {
                title: "Block Artist",
                itemName: artist.stage_name,
                reasons: BLOCKED_REASON,
                actionLabel: "Block"
            });
        }
    };

    const handleClose = () => {
        setCurrentTrack(null);
        setQueue([]);
        onClose();
    };

    const user = artist?.user

    const fullName = `${user?.first_name} ${user?.last_name}`.trim() || user.username;
    const isBlocked = artist.is_blocked;

    return (
            <div className="fixed inset-0 bg-base/80 z-50 flex justify-center items-center backdrop-blur-sm">
                {isLoading ? <ArtistDetailSkeleton />
                :
                <div className="bg-panel w-[80vw] h-[80vh] rounded-2xl border border-border flex flex-col overflow-hidden relative shadow-2xl">
                    {/* header */}
                    <div className="relative p-6 pt-10 border-b border-border flex flex-wrap justify-between items-end gap-4 min-h-[180px] overflow-hidden">
                        {/* Background Banner giữ nguyên */}
                        <div 
                            className={`absolute inset-0 bg-cover bg-center z-20 
                                ${!artist?.banner ? 'blur-2xl opacity-40 scale-125' : 'opacity-80'}`}
                            style={{ backgroundImage: `url(${artist?.banner || artist?.image})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/80 to-transparent -z-10" />

                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleClose();
                            }} 
                            className="absolute top-4 right-4 z-40 text-text-sub bg-panel/50 backdrop-blur-md rounded-full border border-hover hover:text-text-main hover:bg-panel hover:scale-110 p-1.5 transition-all duration-300"
                        >
                            <Close fontSize="medium" />
                        </button>

                        {/* thông tin ảnh và nghệ danh */}
                        <div className="flex items-center gap-4 relative z-50 min-w-[250px] flex-1">
                            <img 
                                src={artist.image} 
                                alt="avatar" 
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-2xl border-2 border-panel shrink-0" 
                            />
                            <div className="min-w-0">
                                <h2 className="text-2xl sm:text-3xl font-bold text-text-main flex items-center gap-2 drop-shadow-md truncate">
                                    <span className="truncate" title={artist.stage_name}>{artist.stage_name}</span>
                                    {isBlocked && 
                                        <span className="text-[10px] sm:text-xs bg-error text-text-main px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                                            Blocked
                                        </span>
                                    }
                                </h2>
                                <p 
                                    className="text-text-main font-medium drop-shadow-md text-sm truncate" 
                                    title={user?.email}
                                >
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        
                        {/* nút Block/ Unblock */}
                        <div className="relative z-50 flex shrink-0">
                            <button 
                                onClick={() => handleBanClick()}
                                disabled={isBanning}
                                className={`px-4 py-2 sm:px-6 sm:py-2.5 flex items-center gap-2 rounded-full font-bold transition-transform hover:scale-105 shadow-lg
                                    ${!isBlocked ? 'bg-error/10 text-error border border-error/50 hover:bg-error hover:text-text-main' 
                                                : 'bg-highlight/10 text-highlight border border-highlight/50 hover:bg-highlight hover:text-text-main'}`}
                            >
                                {!isBlocked ? 
                                    <>
                                        <Block fontSize="small"/> <span className="sr-only md:not-sr-only md:inline">Block</span>
                                    </>
                                : 
                                    <>
                                        <SettingsBackupRestore fontSize="small"/> <span className="sr-only md:not-sr-only md:inline">Unblock</span>
                                    </>
                                }
                            </button>
                        </div>
                    </div>

                    {/* khung chuyển tab */}
                    <div className="flex gap-6 px-6 pt-4 border-b border-border bg-panel">
                        <button 
                            onClick={() => setActiveTab('profile')} 
                            className={`pb-3 font-bold transition-colors ${activeTab === 'profile' ? 'text-highlight border-b-2 border-highlight' : 'text-text-sub hover:text-text-main'}`}
                        >
                            Profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('releases')} 
                            className={`pb-3 font-bold transition-colors ${activeTab === 'releases' ? 'text-highlight border-b-2 border-highlight' : 'text-text-sub hover:text-text-main'}`}
                        >
                            Releases
                        </button>
                    </div>

                    {/* contnet */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-panel">
                        {/* Thông tin cá nhân */}
                        {activeTab === 'profile' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5 px-5 py-2">
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
                                    
                                    <div className="flex items-center gap-3">
                                        <EventAvailableOutlined className="text-highlight" fontSize="small" />
                                        <div>
                                            <p className="text-xs text-text-sub">Verified Date</p>
                                            <p className="text-text-main font-medium">{formatDate(user.date_joined)}</p> 
                                        </div>
                                    </div>
                                </div>
        
                                {/* Chi tiết tài khoản */}
                                <div className="space-y-5 px-5 py-2">
                                    <h3 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2">
                                        Account Details
                                    </h3>
        
                                    <div className="flex items-center gap-3">
                                        <EmailOutlined className="text-text-sub" fontSize="small" />
                                        <div>
                                            <p className="text-xs text-text-sub">Email</p>
                                            <p className="text-text-main font-medium">{user.email}</p>
                                        </div>
                                    </div>

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
                                        <DateRangeOutlined className="text-text-sub" fontSize="small" />
                                        <div>
                                            <p className="text-xs text-text-sub">Date Joined</p>
                                            <p className="text-text-main font-medium">{formatDate(user.date_joined)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thông tin toàn bộ release */}
                        {activeTab === 'releases' && (
                            <div className='m-5'>
                                <Player />
                                <table className="w-full text-left mt-5">
                                    <thead>
                                        <tr className="bg-search text-text-sub text-xs uppercase tracking-wider border-b border-border">
                                            <th className="py-3 pl-3 w-10"></th>
                                            <th className="py-3 font-medium">Release</th>
                                            <th className="py-3 font-medium">Total Listens</th>
                                            <th className="py-3 pr-6 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {releases.map((release: any) => (
                                            <ReleaseRow 
                                                key={release.short_id} 
                                                release={release} 
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            }
        </div>
    );
};

export default ArtistDetailModal;