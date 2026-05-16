import { useState } from 'react';
import { useActionVerification, useGetPendingVerifications } from '../../../hooks/artist/useArtists';
import { useGetPendingReleases, useActionRelease } from '../../../hooks/release/useReleases';
import { CustomToast } from '../../../components/shared/feedback/CustomToast';
import { CheckCircleOutline, HighlightOffOutlined, PersonSearchOutlined, AlbumOutlined, EmailOutlined, PhoneAndroidOutlined, CloseOutlined, VisibilityOutlined } from '@mui/icons-material';
import Loader from '../../../components/shared/ui/Loader';
import { REJECTED_REASON, RELEASE_REJECTED_REASON } from '../../../constants/constants';
import { useConfirmModalStore } from '../../../stores/useConfirmModalStore';
import { useBlockModalStore } from '../../../stores/useBlockModalStore';
import { formatDate } from '../../../utils/formatters';
import AdminReleaseDetailModal from '../../../sections/release/detail/admin/AdminReleaseDetailModal';

const ApprovalsPage = () => {
    const [approvalType, setApprovalType] = useState<'artists' | 'releases'>('artists');
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    
    // data artist
    const { data: pendingArtistsData, isLoading: isLoadingArtists } = useGetPendingVerifications();
    const pendingArtists = (pendingArtistsData as any)?.results || pendingArtistsData?.data || pendingArtistsData || [];
    
    // data release
    const { data: pendingReleasesData, isLoading: isLoadingReleases } = useGetPendingReleases();
    const pendingReleases = (pendingReleasesData as any)?.results || pendingReleasesData?.data || pendingReleasesData || [];

    // Quản lý mở modal chi tiết
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selectedShort_id, setSelectedShort_id] = useState<any>(null);

    // quản lý chức năng
    const { mutate: actionArtist, isPending: isActioningArtist } = useActionVerification();
    const { mutate: actionRelease, isPending: isActioningRelease } = useActionRelease();
    
    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore(); 

    // ================= Xử lý approve / reject đơn apply artist =================
    const handleApproveArtist = (app: any) => {
        showConfirm('save', () => {
            setLoading(true);
            actionArtist({ id: app.id, data: { action: 'approve' } }, {
                onSuccess: (res: any) => CustomToast.success(res.detail),
                onError: (err: any) => CustomToast.error(err.response?.data?.detail || "Error!"),
                onSettled: () => { setLoading(false); closeModal(); }
            });
        }, { title: "Approve Artist", message: `Are you sure you want to approve "${app.stage_name}"?` });
    };

    const handleRejectArtist = (app: any) => {
        openBlockModal((reasonId, note) => {
            setBlockLoading(true);
            actionArtist({
                id: app.id,
                data: { action: 'reject', reject_reason: reasonId, reject_note: note } 
            }, {
                onSuccess: (res: any) => { CustomToast.success(res.detail); closeBlockModal(); },
                onError: (error) => { CustomToast.error(`Failed to reject application!`); },
                onSettled: () => setBlockLoading(false)
            });
        }, { title: "Reject Application", itemName: app.stage_name, reasons: REJECTED_REASON, actionLabel: "Reject" });
    };

    // ================= Xử lý approve / reject release mới =================
    const handleApproveRelease = (release: any) => {
        showConfirm('save', () => {
            setLoading(true);
            actionRelease({ 
                short_id: release.short_id, 
                data: { action: 'approve' } 
            }, {
                onSuccess: (res: any) => CustomToast.success(res.detail),
                onError: (err: any) => CustomToast.error(err.response?.data?.detail || "Error!"),
                onSettled: () => { setLoading(false); closeModal(); }
            });
        }, { 
            title: "Approve Release", 
            message: `Publish "${release.title}" by ${release.artist_name}?` 
        });
    };

    const handleRejectRelease = (release: any) => {
        openBlockModal((reasonId, note) => {
            setBlockLoading(true);
            actionRelease({
                short_id: release.short_id,
                data: { 
                    action: 'reject', 
                    reject_reason: reasonId, 
                    reject_note: note 
                } 
            }, {
                onSuccess: (res: any) => { CustomToast.success(res.detail); closeBlockModal(); },
                onError: (error) => { CustomToast.error(`Failed to reject release!`); },
                onSettled: () => setBlockLoading(false)
            });
        }, { 
            title: "Reject Release", 
            itemName: release.title, 
            reasons: RELEASE_REJECTED_REASON, 
            actionLabel: "Reject" 
        });
    };

    if (isLoadingArtists || isLoadingReleases) return <Loader />

    return (
        <div className="p-6 md:p-8 text-text-main w-full">
            {/* header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-panel p-4 rounded-2xl border border-border">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">Inbox</h2>
                </div>
                
                <div className="flex items-center gap-2 bg-search p-1 rounded-xl">
                    <button 
                        onClick={() => setApprovalType('artists')}
                        className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all 
                            ${approvalType === 'artists' ? 'bg-highlight text-text-dark shadow-md' : 'text-text-sub hover:text-text-main'}`}
                    >
                        <PersonSearchOutlined fontSize="small" /> Artist
                        {pendingArtists.length > 0 && <span className="ml-1 bg-error text-text-dark text-[10px] px-1.5 py-0.5 rounded-full">{pendingArtists.length}</span>}
                    </button>
                    <button 
                        onClick={() => setApprovalType('releases')}
                        className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all 
                            ${approvalType === 'releases' ? 'bg-highlight text-text-dark shadow-md' : 'text-text-sub hover:text-text-main'}`}
                    >
                        <AlbumOutlined fontSize="small" /> Music
                        {pendingReleases.length > 0 && <span className="ml-1 bg-error text-text-dark text-[10px] px-1.5 py-0.5 rounded-full">{pendingReleases.length}</span>}
                    </button>
                </div>
            </div>

            {/* danh sách artist */}
            {approvalType === 'artists' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
                    {pendingArtists?.length === 0 && <p className="text-text-sub col-span-full text-center py-10">No pending artists.</p>}
                    
                    {pendingArtists?.map((app: any) => (
                        <div 
                            key={app.id} 
                            className="bg-panel rounded-2xl p-6 border border-border shadow-lg flex flex-col justify-between hover:border-border/20 transition-all"
                        >
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className='group w-36 h-36 rounded-full border border-border overflow-hidden cursor-pointer shrink-0'>
                                        <img 
                                            src={app.image} 
                                            alt="avatar" 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                            onClick={() => setViewingImage(app.image)} 
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            Stage name: <span className="text-xl font-bold text-highlight">{app.stage_name}</span>
                                        </h3>
                                        <p className="text-sm font-bold text-text-sub">
                                            Real name: {app.full_name}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mb-6 text-sm">
                                    <p className="flex items-center gap-2 text-text-sub">
                                        <EmailOutlined fontSize="small" /> {app.user_email}
                                    </p>
                                    <p className="text-text-sub">
                                        <PhoneAndroidOutlined fontSize='small'/> 
                                        Phone: <span className="text-text-main font-bold">{app.contact_phone}</span>
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <a 
                                            href={app.social_link} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="flex-1 text-center bg-info/20 text-info/90 py-2 rounded-lg font-bold hover:bg-info/40"
                                        >
                                            Check Social
                                        </a>
                                        <button 
                                            onClick={() => setViewingImage(app.document_url)} 
                                            className="flex-1 text-center bg-accent-purple/20 text-accent-purple/85 py-2 rounded-lg font-bold hover:bg-accent-purple/40"
                                        >
                                            View Doc
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button 
                                    disabled={isActioningArtist} 
                                    onClick={() => handleApproveArtist(app)} 
                                    className="flex-1 flex justify-center items-center gap-1 bg-highlight/10 text-highlight hover:bg-highlight hover:text-text-main py-2 rounded-lg font-bold transition-all"
                                >
                                    <CheckCircleOutline fontSize="small"/> Approve
                                </button>
                                <button 
                                    disabled={isActioningArtist} 
                                    onClick={() => handleRejectArtist(app)} 
                                    className="flex-1 flex justify-center items-center gap-1 bg-error/10 text-error hover:bg-error hover:text-text-main py-2 rounded-lg font-bold transition-all"
                                >
                                    <HighlightOffOutlined fontSize="small"/> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* danh sách release */}
            {approvalType === 'releases' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
                    {pendingReleases?.length === 0 && <p className="text-text-sub col-span-full text-center py-10">No pending releases.</p>}

                    {pendingReleases?.map((release: any) => (
                        <div key={release.short_id} className="bg-panel rounded-2xl p-6 border border-border shadow-lg flex flex-col justify-between hover:border-border/20 transition-all">
                            <div>
                                <div className="flex gap-4 mb-4">
                                    <div className='group w-32 h-32 rounded-lg border border-border overflow-hidden cursor-pointer shrink-0'>
                                        <img 
                                            src={release.image} 
                                            alt="cover" 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                            onClick={() => setViewingImage(release.image)}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="uppercase text-[10px] tracking-wider font-bold text-text-sub mb-1">
                                            {release.release_type}
                                        </div>
                                        <h3 className="text-xl font-bold text-text-main line-clamp-2 leading-tight">
                                            {release.title}
                                        </h3>
                                        <p className="text-sm font-bold text-highlight mt-2">
                                            {release.artist_name}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-6 text-sm border-t border-border/50 pt-4">
                                    <p className="flex items-center justify-between text-text-sub">
                                        <span>Submitted on:</span>
                                        <span className="font-mono text-text-main">{formatDate(release.created_at)}</span>
                                    </p>
                                    <p className="flex items-center justify-between text-text-sub">
                                        <span>Content ID:</span>
                                        <span className="font-mono text-text-main">{release.short_id}</span>
                                    </p>
                                    <div className="flex mt-4 pt-2">
                                    <button 
                                        onClick={() => {
                                            setIsOpenModal(true)
                                            setSelectedShort_id(release.short_id)
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-info/20 text-info/90 py-2.5 rounded-lg font-bold hover:bg-info/40 transition-all"
                                    >
                                        <VisibilityOutlined fontSize="small" /> Details
                                    </button>
                                </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button 
                                    disabled={isActioningRelease} 
                                    onClick={() => handleApproveRelease(release)} 
                                    className="flex-1 flex justify-center items-center gap-1 bg-highlight/10 text-highlight hover:bg-highlight hover:text-text-main py-2 rounded-lg font-bold transition-all"
                                >
                                    <CheckCircleOutline fontSize="small"/> Approve
                                </button>
                                <button 
                                    disabled={isActioningRelease} 
                                    onClick={() => handleRejectRelease(release)} 
                                    className="flex-1 flex justify-center items-center gap-1 bg-error/10 text-error hover:bg-error hover:text-text-main py-2 rounded-lg font-bold transition-all"
                                >
                                    <HighlightOffOutlined fontSize="small"/> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal xem ảnh */}
            {viewingImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-base/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn" 
                    onClick={() => setViewingImage(null)}
                >
                    <button className="absolute top-6 right-6 text-text-main hover:text-error/95 bg-base/10 p-2 rounded-md transition-colors">
                        <CloseOutlined fontSize="large" />
                    </button>
                    <img 
                        src={viewingImage} 
                        alt="Enlarged" 
                        className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-md border-4 border-panel" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* momdal xem chi tiết release */}
            
            {isOpenModal && selectedShort_id && (
                <AdminReleaseDetailModal
                    short_id={selectedShort_id}
                    onClose={() => {
                        setIsOpenModal(false);
                        setSelectedShort_id(null);
                    }}
                />
            )}
        </div>
    );
};

export default ApprovalsPage;