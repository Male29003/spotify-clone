import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplyArtist } from '../../hooks/artist/useArtists';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import {  CloudUploadOutlined, AddPhotoAlternateOutlined, CloseOutlined, CropOutlined, DeleteOutline, ArrowBackRounded, InfoOutlined } from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth/authStore';
import ImageCropperModal from '../../sections/apply-artist/ImageCropModal';

const InfoTooltip = ({ text }: {text: React.ReactNode}) => {
    return (
        <span className="relative -translate-y-1/3 inline-block group cursor-help">
            <InfoOutlined sx={{ fontSize: 14 }} className="text-text-sub hover:text-highlight transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-panel border border-border text-xs text-text-main rounded-lg shadow-xl z-50 font-normal leading-relaxed normal-case tracking-normal text-left">
                {text}
            </div>
        </span>
    );
};

const ArtistApplicationPage: React.FC = () => {
    const { user } = useAuthStore(state => state);
    const navigate = useNavigate();
    
    // quản lý ảnh
    // và file ah3
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    
    // xử lý cắt ảnh
    const [rawAvatarUrl, setRawAvatarUrl] = useState<string | null>(null); // Ảnh gốc để crop
    const [isCropping, setIsCropping] = useState(false);
    
    const [viewingAvatar, setViewingAvatar] = useState<string | null>(null); // Để xem to Avatar
    
    // quản lý data khác
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [viewingDocument, setViewingDocument] = useState<string | null>(null); // Để xem to CCCD
    const [formData, setFormData] = useState({ 
        stage_name: '', 
        social_link: '', 
        contact_phone: user?.phone,
        email: user?.email
    });
    // dđiểu chỉnh túy theo thay đổi sdt cho phù hợp
    useEffect(() => {
        if (user?.phone && !formData.contact_phone) {
            setFormData(prev => ({ ...prev, contact_phone: user.phone }));
        }
    }, [user?.phone]);
    
    const { mutate: applyArtist, isPending } = useApplyArtist();

    useEffect(() => {
        document.documentElement.classList.add('light');
        return () => document.documentElement.classList.remove('light');
    }, []);

    // Xử lý ảnh : 2 kiểu -> kéo thả hoặc chọn ảnh từ máy
    const [dragAvatar, setDragAvatar] = useState(false);
    const [dragDoc, setDragDoc] = useState(false);
        // chọn ảnh
    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processAvatarFile(file);
        e.target.value = ''; 
    };
        // kéo thả
    const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Chặn trình duyệt mở ảnh sang tab mới
        setDragAvatar(false); // Tắt hiệu ứng viền
        const file = e.dataTransfer.files?.[0];
        if (file) processAvatarFile(file);
    };
    const processAvatarFile = (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) 
            return CustomToast.error("Chỉ hỗ trợ JPG, PNG, WEBP.");
        if (file.size > 5 * 1024 * 1024) 
            return CustomToast.error("Dung lượng ảnh tối đa 5MB.");

        setRawAvatarUrl(URL.createObjectURL(file));
        setIsCropping(true);
    };
    
        // keo1 tha3 verified doc
    const handleDocumentDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragDoc(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processDocumentFile(file);
    };
    const processDocumentFile = (file: File) => {
        if (!file.type.startsWith('image/')) 
            return CustomToast.error("Please choose an image file!");
        if (file.size > 5 * 1024 * 1024) 
            return CustomToast.error("Tối đa 5MB!");
        setImageFile(file);
    };

    const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processDocumentFile(file);
        e.target.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!avatarFile) 
            return CustomToast.error("Please upload your avatar!");
        if (!imageFile) 
            return CustomToast.error("Please upload a verified document!");

        const submitData = new FormData();
        submitData.append('stage_name', formData.stage_name);
        submitData.append('social_link', formData.social_link);
        submitData.append('contact_phone', formData.contact_phone || '');
        submitData.append('identity_document', imageFile);
        submitData.append('image', avatarFile);

        applyArtist(submitData, {
            onSuccess: (data: any) => {
                CustomToast.success(data.detail || "Successfully submit your application!");
                navigate('/');
            },
            onError: (error: any) => {
                CustomToast.error(error.response?.data?.detail || "An error occured! Please try again later! We are so sorry for this inconvenience");
            }
        });
    };

    return (
        <>
            <button 
                onClick={() => navigate(-1)} 
                className="absolute z-30 top-5 left-1/6 flex items-center gap-2 text-text-sub border hover:text-highlight mb-8 transition-colors font-semibold hover:bg-hover rounded-full p-2"
            >
                <ArrowBackRounded fontSize="small" />
            </button>
            <div className="max-w-3xl mx-auto py-10 px-6 animate-fadeIn text-text-main relative">
                <div className="bg-card p-8 md:p-10 rounded-2xl shadow-2xl border border-border">
                    <h1 className="text-4xl font-bold text-text-main mb-2">You wanna be an artist</h1>
                    <p className="text-text-sub mb-8 text-sm">Please provide correct and legal information for for identity verification to grant you permission to release your music.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* avatar */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-search rounded-2xl border border-border">
                            {/* ảnh */}
                            <div 
                                className={`relative w-32 h-32 rounded-full border-4 overflow-hidden bg-base shrink-0 group cursor-pointer shadow-lg transition-all
                                    ${dragAvatar ? 'border-highlight scale-105 opacity-80' : 'border-border'}`}
                                onClick={() => avatarPreview ? setViewingAvatar(avatarPreview) : avatarInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragAvatar(true); }}
                                onDragLeave={() => setDragAvatar(false)}
                                onDrop={handleAvatarDrop}
                                title={avatarPreview ? "Click to view image" : ""}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover group-hover:brightness-75 transition-all" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-text-sub pointer-events-none">
                                        <AddPhotoAlternateOutlined className={`text-3xl ${dragAvatar ? 'text-highlight' : 'opacity-50'}`} />
                                        {dragAvatar && 
                                            <span className="text-xs font-bold text-highlight">Dop here</span>
                                        }
                                    </div>
                                )}
                            </div>

                            {/* nút chức năng */}
                            <div className="flex flex-col gap-3 flex-1 text-center sm:text-left">
                                <div>
                                    <h3 className="font-bold text-text-main text-lg">Avatar <span className="text-error">*</span></h3>
                                    <p className="text-xs text-text-sub mt-1">Use clear images. Supports JPG, PNG, and WEBP (maximum 5MB).</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="px-4 py-2 bg-base hover:bg-hover text-text-main text-sm font-bold rounded-full transition-colors border border-border shadow-sm"
                                    >
                                        {avatarPreview ? "Change avatar" : "Upload"}
                                    </button>
                                    
                                    {avatarPreview && rawAvatarUrl && (
                                        <button 
                                            type="button" 
                                            onClick={() => setIsCropping(true)}
                                            className="px-4 py-2 bg-highlight/10 text-highlight hover:bg-highlight hover:text-text-dark text-sm font-bold rounded-full transition-colors flex items-center gap-1"
                                        >
                                            <CropOutlined fontSize="small" /> Crop
                                        </button>
                                    )}
                                    
                                    {avatarPreview && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setAvatarPreview(null); setAvatarFile(null); setRawAvatarUrl(null); }}
                                            className="p-2 text-error/85 hover:bg-error/85/10 rounded-full transition-colors"
                                            title="Delete"
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarSelect} />
                            </div>
                        </div>

                        {/* Nghệ danh vaà meail*/}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-sub flex items-center">
                                    Stage Name <span className="text-error mx-1">*</span>
                                    <InfoTooltip 
                                        text='Your unique artist identifier on the platform.'
                                    />
                                </label>
                                <input 
                                    type="text"
                                    required 
                                    value={formData.stage_name} 
                                    onChange={e => setFormData({...formData, stage_name: e.target.value})} 
                                    className="bg-search text-text-main p-4 rounded-xl outline-none focus:ring-2 focus:ring-highlight/50 transition-all border border-transparent" 
                                    placeholder="Sơn Tùng M-TP..." 
                                />
                                <p className="text-xs text-text-sub mt-1 italic">
                                    <span className="text-error/85 font-bold">Be aware:</span> This stage name will be permanently associated with your music and personal brand. We are not responsible for and cannot modify it later even if you enter it incorrectly.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-sub flex items-center">
                                    Email <span className="text-error mx-1">*</span>
                                    <InfoTooltip 
                                        text='This will be the contact email we use to reach you immediately for special notifications and your artist account login.'
                                    />
                                </label>
                                <input 
                                    type="text"
                                    disabled
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    className="bg-search text-text-main p-4 rounded-xl outline-none focus:ring-2 focus:ring-highlight/50 transition-all border border-transparent" 
                                    placeholder="Sơn Tùng M-TP..." 
                                />
                            </div>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SĐT */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-sub flex items-center">
                                    Phone <span className="text-error mx-1">*</span>
                                    <InfoTooltip 
                                        text='This will be the contact phone number we use to reach you immediately when there are issues regarding copyright or your releases.'
                                    />
                                </label>
                                <input 
                                    type="text"
                                    required 
                                    value={formData.contact_phone} 
                                    onChange={e => setFormData({...formData, contact_phone: e.target.value})} 
                                    className="bg-search text-text-main p-4 rounded-xl outline-none focus:ring-2 focus:ring-highlight/50 transition-all border border-transparent" 
                                    placeholder="090..." 
                                />
                            </div>
                            {/* Link MXH */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-sub flex items-center">
                                    Social link <span className="text-error mx-1">*</span>
                                    <InfoTooltip 
                                        text='Providing a previously verified account (e.g., blue tick on Facebook/Instagram) will significantly speed up the review process.'
                                    />
                                </label>
                                <input 
                                    type="url" 
                                    required 
                                    placeholder="Facebook, Youtube, ..." 
                                    value={formData.social_link} 
                                    onChange={e => setFormData({...formData, social_link: e.target.value})} 
                                    className="bg-search text-text-main p-4 rounded-xl outline-none focus:ring-2 focus:ring-highlight/50 transition-all border border-transparent" 
                                />
                            </div>
                        </div>

                        {/* Upload CCCD */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-text-sub flex items-center">
                                Verified Document <span className="text-error mx-1">*</span>
                                <InfoTooltip 
                                    text='Any legal document proving your identity or artist persona. It does not strictly have to be an ID card (CCCD); passports or official artist certificates are also accepted.'
                                />
                            </label>
                            <div className="flex flex-col gap-3">
                                <div 
                                    onClick={() => fileInputRef.current?.click()} 
                                    onDragOver={(e) => { e.preventDefault(); setDragDoc(true); }}
                                    onDragLeave={() => setDragDoc(false)}
                                    onDrop={handleDocumentDrop}
                                    className={`border-2 border-dashed p-8 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-search
                                        ${dragDoc ? 'border-highlight bg-highlight/10 scale-[1.02]' : 'border-border hover:border-highlight hover:bg-highlight/5'}`}
                                >
                                    <CloudUploadOutlined className={imageFile ? "text-highlight text-4xl" : "text-text-sub text-4xl"} />
                                    <span className="text-text-main font-bold pointer-events-none">
                                        {imageFile ? imageFile.name : (dragDoc ? "Drop here!" : "Browse")}
                                    </span>
                                    {!imageFile ? 
                                        <span className="text-text-sub text-xs">JPG, PNG (Max 5MB)</span>
                                    : (
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setViewingDocument(URL.createObjectURL(imageFile))
                                            }}
                                            className="text-sm text-highlight bg-panel shadow-2xl px-3 py-4 hover:underline self-center rounded-full border hover:font-bold"
                                        >
                                            Preview
                                        </button>
                                    )}
                                    <input 
                                        type="file"
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/jpeg, image/png, image/webp" 
                                        onChange={handleDocumentSelect} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={isPending} 
                                className="w-full bg-highlight text-text-dark font-bold py-4 rounded-full text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-highlight/20"
                            >
                                {isPending ? "Processing..." : "Sent Application"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* modal cắt ảnh */}
                {isCropping && rawAvatarUrl && (
                    <ImageCropperModal 
                        rawUrl={rawAvatarUrl} 
                        onClose={() => setIsCropping(false)} 
                        onCropSuccess={(croppedFile) => {
                            setAvatarFile(croppedFile);
                            setAvatarPreview(URL.createObjectURL(croppedFile));
                            setIsCropping(false);
                        }} 
                    />
                )}

                {/* xem ảnh */}
                {(viewingAvatar || viewingDocument) && (
                    <div 
                        className="fixed inset-0 z-100 bg-base/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
                        onClick={() => { setViewingAvatar(null); setViewingDocument(null); }}
                    >
                        <button className="absolute top-6 right-6 text-white hover:text-error/85 bg-white/10 p-2 rounded-full transition-colors">
                            <CloseOutlined fontSize="large" />
                        </button>
                        <img 
                            src={(viewingAvatar || viewingDocument) as string} 
                            alt="Enlarged View" 
                            className={`max-w-full max-h-[90vh] object-contain shadow-2xl ${viewingAvatar ? 'rounded-full border-4 border-panel' : 'rounded-lg'}`}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default ArtistApplicationPage;