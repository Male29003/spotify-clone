import React, { useEffect, useMemo, useRef, useState } from "react"
import type { IRelease } from "../../../types";
import { CameraAltOutlined, ErrorOutline } from "@mui/icons-material";
import { CustomToast } from "../../../components/shared/feedback/CustomToast";
import { useUpdateMyRelease } from "../../../hooks/release/useReleases";
import { useConfirmModalStore } from "../../../stores/useConfirmModalStore";
import { BLOCKED_REASON } from "../../../constants/constants";
interface ModalInfoSectionProps {
    release: IRelease;
    isArtist: boolean; 
    onDataChange: (hasChanged: boolean) => void
}

const ModalInfoSection: React.FC<ModalInfoSectionProps> = ({ 
    release, 
    isArtist, 
    onDataChange
}) => {
    const [formData, setFormData] = useState<any>({ 
        title: '', 
        description: '', 
        release_date: '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<any>(null);
    const { mutate: updateRelease, isPending: updatingRelease } = useUpdateMyRelease();
    
    // Set form chi tiết
    useEffect(() => {
        if (release) {
            setFormData({
                title: release.title || "",
                description: release.description || "",
                release_date: release.release_date ? release.release_date?.substring(0, 10) : "",
            });
            setImagePreview(release.image)
        }
    }, [release])
    // đổi ảnh
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview])

    // Ktra data thay đổi
    const isChanged = useMemo(() => {
        // so sánh Title và Description (tránh null vs "")
        if ((formData.title || "") !== (release?.title || "")) 
            return true;
        if ((formData.description || "") !== (release?.description || "")) 
            return true;
    
        // chỉ lấy 10 ký tự đầu YYYY-MM-DD
        const normalizedOriginalDate = release?.release_date ? release.release_date.substring(0, 10) : "";
        if (formData.release_date !== normalizedOriginalDate) 
            return true;
        const normalizedFormDate = formData.release_date || "";
        if (normalizedFormDate !== normalizedOriginalDate) 
            return true;
    
        // Nếu là File object thì là mới, nếu là string thì vẫn là cũ
        if (imagePreview && typeof imagePreview === 'object') return true;
        return false;
    }, [formData, imagePreview, release])
    useEffect(() => {
        onDataChange(isChanged);
    }, [isChanged, onDataChange])

    // Cập nhật thông tin chỉ có artist mới có quyền
    const { showConfirm, closeModal, setLoading} = useConfirmModalStore()
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Kt quyền
        if(!isArtist) return
        // Khóa lại cho đảm bảo dù đã có disabled trong field
        if(release.is_published){
            CustomToast.info('You can not update a published release !!!')
        }
        // Nếu đã publish thì ko cho update
        if (release.short_id && !release.is_published) {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('release_date', formData.release_date);
            if (formData.image) {
                data.append('image', formData.image);
            }
            showConfirm('save', () => {
                setLoading(true);
                updateRelease({ short_id: release.short_id, data }, { 
                    onSuccess: () => CustomToast.success("Successfully updated release!"),
                    onError: () =>
                        CustomToast.success(`Failed to update release ${release.title}!`),
                    onSettled: () => {
                        setLoading(false);
                        closeModal();
                    }
                });
            }, {
                title: `Save Release`,
                message: `Are you sure you want to update this release?`
            });
        }
    }

    const isBlocked = release.is_blocked
    const blockReasonText = release.block_reason 
            ? BLOCKED_REASON.find(r => r.id === release.block_reason)?.label 
            : "Violation of community standards";

    return (
        <div className="flex flex-col w-full">
            {/* nếu bị block */}
            {release.block_reason && (
                <div className="w-full bg-error/10 border border-error/20 rounded-xl p-4 mb-6 flex gap-4 items-start shadow-sm">
                    <div className="p-2 flex items-center bg-error/20 rounded-full shrink-0 mt-0.5">
                        <ErrorOutline className="text-error" fontSize="small" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-error font-bold mb-1">
                            Release Blocked
                        </h4>
                        <div className="text-text-main text-sm space-y-1.5">
                            <p>
                                <span className="text-text-sub font-medium mr-1">Reason:</span> 
                                {blockReasonText}
                            </p>
                            {release.reject_note && (
                                <p>
                                    <span className="text-text-sub font-medium mr-1">Admin Note:</span> 
                                    <span className="italic opacity-90">"{release.reject_note}"</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* modal thông tin */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
                
                {/* Ảnh Bìa */}
                <div className="w-48 md:w-64 shrink-0 flex flex-col items-center">
                    <div 
                        className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-search border border-border group shadow-lg
                            ${isArtist && !release.is_published && !release.is_pending ? 'cursor-pointer hover:shadow-highlight/20' : ''}`}
                        onClick={() => {
                            if (isArtist && !release.is_published && !release.is_pending) {
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <img 
                            src={imagePreview}
                            alt="cover" 
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 
                                ${isBlocked ? 'grayscale opacity-70' : ''}`}
                        />
                        
                        {isArtist && !release.is_published && !release.is_pending && (
                            <>
                                <div className="absolute inset-0 bg-base/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 text-text-main">
                                    <CameraAltOutlined fontSize="large" className="mb-1 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                                    <span className="text-sm font-bold mt-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        Change Cover
                                    </span>
                                </div>
                                <input 
                                    type="file" 
                                    disabled={!isArtist || release.is_published} 
                                    ref={fileInputRef} 
                                    onChange={handleImageChange} 
                                    className="hidden" 
                                    accept="image/jpeg, image/png, image/webp" 
                                />
                            </>
                        )}
                    </div>
                    <p className="mt-3 text-xs text-text-sub font-medium md:hidden">
                        {release.release_type} • {release.tracks?.length || 0} Tracks
                    </p>
                </div>

                {/* thông tin cp7 bản */}
                <form onSubmit={handleSave} className="flex-1 w-full space-y-5">
                    <div className="space-y-4">
                        
                        {/* Tên Release */}
                        <div className={`flex flex-col gap-1.5 ${isBlocked ? 'opacity-70' : ''}`}>
                            <label className="text-xs font-bold uppercase tracking-wider text-text-sub ml-1">Title</label>
                            <input 
                                readOnly={!isArtist || release.is_published}
                                disabled={isBlocked}
                                type="text" 
                                className="w-full bg-search px-4 py-3.5 rounded-xl text-text-main font-semibold outline-none border border-transparent focus:border-highlight focus:bg-panel transition-colors" 
                                value={formData.title} 
                                onChange={e => isArtist && setFormData({...formData, title: e.target.value})} 
                            />
                        </div>
                        
                        {/* Mô tả */}
                        <div className={`flex flex-col gap-1.5 ${isBlocked ? 'opacity-70' : ''}`}>
                            <label className="text-xs font-bold uppercase tracking-wider text-text-sub ml-1">Description</label>
                            <textarea 
                                readOnly={!isArtist || release.is_published} 
                                disabled={isBlocked}
                                className="w-full bg-search px-4 py-3.5 rounded-xl text-text-main text-sm outline-none border border-transparent focus:border-highlight focus:bg-panel transition-colors min-h-[100px] custom-scrollbar resize-y" 
                                value={formData.description} 
                                onChange={e => isArtist && setFormData({...formData, description: e.target.value})} 
                            />
                        </div>
                        
                        {/* Ngày phát hành & release type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`flex flex-col gap-1.5 ${isBlocked ? 'opacity-70' : ''}`}>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-sub ml-1">Release Date</label>
                                <input 
                                    readOnly={!isArtist || release.is_published} 
                                    disabled={isBlocked}
                                    type="date" 
                                    className="w-full bg-search px-4 py-3.5 rounded-xl text-text-main text-sm font-medium outline-none border border-transparent focus:border-highlight focus:bg-panel transition-colors color-scheme-dark" 
                                    value={formData.release_date} 
                                    onChange={e => isArtist && setFormData({...formData, release_date: e.target.value})} 
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-sub ml-1">Type</label>
                                <div className="w-full bg-search/50 px-4 py-3.5 rounded-xl text-text-sub text-sm font-medium border border-transparent cursor-not-allowed">
                                    {release.release_type || 'Single'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nút update - chỉ hiện nếu là Artist và có sự thay đổi */}
                    {isArtist && !release.is_published && (
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={updatingRelease || !isChanged} 
                                className={`bg-highlight text-text-dark px-8 py-3 rounded-full font-bold transition-all shadow-md
                                    ${(updatingRelease || !isChanged) ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:scale-105 hover:shadow-highlight/30'}`}
                            >
                                {updatingRelease ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}

export default ModalInfoSection;