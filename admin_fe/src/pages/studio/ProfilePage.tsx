import React, { useCallback, useRef, useState } from "react";
import { useUpdateArtistProfile } from "../../hooks/artist/useArtists";
import { useAuthStore } from "../../stores/auth/authStore";
import { EditOutlined, Verified, MicExternalOnOutlined, HeadphonesOutlined, SaveOutlined, CloseOutlined } from "@mui/icons-material";
import { CustomToast } from "../../components/shared/feedback/CustomToast";
import { useConfirmModalStore } from "../../stores/useConfirmModalStore";
import { formatNumber } from "../../utils/formatters";
import { getCroppedImg } from "../../utils/cropImage";
import Cropper from "react-easy-crop";

const EditableField = ({ label, name, value, type = "text", options, isEditing, onChange, displayValue }: any) => (
    <div className="flex flex-col gap-1.5 min-w-0 w-full">
        <span className="text-text-sub uppercase tracking-wider text-xs font-semibold">{label}</span>
        {isEditing ? (
            options ? (
                <select 
                    name={name} 
                    value={value} 
                    onChange={onChange} 
                    className="bg-search border border-border text-text-main text-sm rounded-lg focus:ring-highlight focus:border-highlight block w-full p-2.5 outline-none transition-all"
                >
                    {options.map((opt: any) => 
                        <option 
                            key={opt.value} 
                            value={opt.value}
                        >
                            {opt.label}
                        </option>
                    )}

                </select>
            ) : (
                <input 
                    type={type} 
                    name={name} 
                    value={value}
                    onChange={onChange}
                    disabled={name === 'email'}
                    className="bg-search border border-border text-text-main text-sm rounded-lg focus:ring-highlight focus:border-highlight block w-full p-2.5 outline-none transition-all" 
                />
            )
        ) : (
            <div className="font-semibold text-xl h-10 flex items-center">
                <span className="truncate block w-full" title={value}>
                    {displayValue || value || '-'}
                </span>
            </div>
        )}
    </div>
)

const ArtistProfilePage = () => {
    const { user } = useAuthStore(state => state);
    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();

    // Quản lý trạng thái Edit và Dữ liệu tạm
    const {mutateAsync: updateProfile, isPending} = useUpdateArtistProfile()
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        stage_name: (user as any)?.stage_name || "",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone: user?.phone || "",
        country: user?.country || "",
        gender: user?.gender || "",
    });
    const resetForm = () => {
        setFormData({
            stage_name: (user as any)?.stage_name || "",
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            phone: user?.phone || "",
            country: user?.country || "",
            gender: user?.gender || "",
        });
        setImageFile(null);    
        setImagePreview(null);
        setBannerFile(null);
        setBannerPreview(null);
    };
        // avatar
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
        // banner
    const bannerInputRef = useRef<HTMLInputElement>(null)
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)


    // quản lý cắt ảnh
    const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
    const [isCroppingImage, setIsCroppingImage] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Kích hoạt chế độ sửa
    const handleEditClick = () => {
        resetForm()
        setIsEditing(true);
    };

    // ktra thay đổi data
    const hasChanges = 
        formData.stage_name !== ((user as any)?.stage_name || "") ||
        formData.first_name !== (user?.first_name || "") ||
        formData.last_name !== (user?.last_name || "") ||
        formData.phone !== (user?.phone || "") ||
        formData.country !== (user?.country || "") ||
        formData.gender !== (user?.gender || "") ||
        imageFile !== null || 
        bannerFile !== null;
    
    // Hủy bỏ sửa, reset về ban đầu
    const handleCancel = () => {
        if (hasChanges) { 
            showConfirm('warning',
                () => {
                    setIsEditing(false);
                    resetForm();
                    closeModal();
                },
                {
                    title: "Discard changes?",
                    message: "You have unsaved changes. Are you sure you want to discard them?"
                }
            );
        } else {
            setIsEditing(false);
            resetForm();
        }
    };

    // Xử lý thay đổi input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // xử lý thay đổi ảnh và cắt ảnh avatar
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate Format
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            CustomToast.error('Accepted types: JPG, PNG, WEBP!');
            e.target.value = '';
            return;
        }

        // Validate Size (Tối đa 7MB)
        if (file.size > 7 * 1024 * 1024) {
            CustomToast.error('Maximum size is 7MB!');
            e.target.value = '';
            return;
        }

        // Đẩy vào bộ cắt ảnh
        setRawImageUrl(URL.createObjectURL(file));
        setIsCroppingImage(true);
        e.target.value = '';
    }
    const onCropComplete = useCallback((_: any, pixels: any) => 
        setCroppedAreaPixels(pixels)
    , [])
    const showCroppedImage = async () => {
        try {
            if (!rawImageUrl || !croppedAreaPixels) return;
            // Gọi hàm getCroppedImg của sếp
            const croppedFile = await getCroppedImg(rawImageUrl, croppedAreaPixels);
            
            setImageFile(croppedFile);
            setImagePreview(URL.createObjectURL(croppedFile));
            setIsCroppingImage(false);
        } catch (e) {
            CustomToast.error(`Error! Cannot crop image! ${e}`);
        }
    };
    // xử lý thay đổi banner
    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if(file){
            if(!file.type.startsWith('image/')) 
                return CustomToast.error('Please upload an image!');
            if (file.size > 10 * 1024 * 1024) 
                return CustomToast.error('Max banner size is 10MB!');

            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    }

    // Lưu dữ liệu
    const handleSave = () => {
        showConfirm(
            'save', 
            async () => {
                setLoading(true)
                try {
                    const artistData = new FormData();
                    artistData.append('stage_name', formData.stage_name)
                    
                    const userData = new FormData(); 
                    userData.append('first_name', formData.first_name);
                    userData.append('last_name', formData.last_name);
                    userData.append('phone', formData.phone);
                    userData.append('country', formData.country);
                    userData.append('gender', formData.gender);
                    // nếu có ảnh thì update ảnh
                    if (imageFile) {
                        artistData.append('image', imageFile);
                    }
                    if (bannerFile) {
                        artistData.append('banner', bannerFile)
                    }
                    
                    // update lại thông tin user
                    await updateProfile({ userData, artistData });

                    CustomToast.success("Profile updated successfully!");                    
                    setIsEditing(false);
                    setImageFile(null);
                    setImagePreview(null);
                    closeModal();
                } catch(error) {
                    console.error("Error updating profile!", error);
                    CustomToast.error("Failed to update profile!");
                    closeModal();
                }
            }, 
            {
                title: "Save Profile",
                message: "Are you sure you want to save these changes?"
            }
        );
    };
    return (
        <div className="text-text-main mx-auto p-8 max-w-5xl animate-fadeIn pb-24 scroll">
            <h1 className="text-3xl font-bold mb-8 text-text-main">Profile</h1>
            {/* Banner */}
            <div className="w-full overflow-x-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-10 bg-card p-5 rounded-2xl border border-hover relative overflow-hidden min-h-[300px]">
                        {/* banner */}
                    <div className="absolute inset-0 z-10">
                        <div 
                            className={`w-full h-full bg-cover bg-center transition-all duration-500
                                        ${!(bannerPreview || (user as any)?.banner) ? 'blur-2xl opacity-40 scale-125' : 'opacity-90'}`} 
                            style={{ backgroundImage: `url(${bannerPreview || (user as any)?.banner || user?.image})` }}
                        />
                        {/* Lớp mờ để chữ dễ đọc */}
                        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/60 to-transparent pointer-events-none" />

                        {isEditing && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    bannerInputRef.current?.click();
                                }}
                                className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 transition-all shadow-lg hover:scale-105"
                            >
                                <EditOutlined className="text-white" fontSize="small" />
                                <span className="text-white font-bold text-sm">Edit Banner</span>
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={bannerInputRef} 
                            className="hidden" 
                            accept="image/jpeg, image/png, image/webp" 
                            onChange={handleBannerChange} 
                        />
                    </div>

                    {/* Avatar */}
                    <div 
                        className="relative z-20 group cursor-pointer shrink-0"
                        onClick={() => isEditing && fileInputRef.current?.click()}
                    >
                        <img 
                            src={imagePreview || user?.image || "https://placehold.co/400"} 
                            alt="Avatar" 
                            className={`w-48 h-48 rounded-full object-cover shadow-2xl transition-transform border-4 border-panel
                                ${isEditing ? 'group-hover:brightness-50 group-hover:scale-105' : ''}`}
                        />                
                        {isEditing && 
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/40 pointer-events-none">
                                <EditOutlined className="text-white text-4xl drop-shadow-md" />
                            </div>
                        }
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="relative z-20 flex flex-col gap-2 w-full text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                            <span className="text-sm font-semibold uppercase tracking-widest text-text-sub">Artist</span>
                            {(user as any)?.is_verify && 
                                <span className="text-info/90 flex items-center gap-1 bg-info/10 px-2 py-0.5 rounded-full text-xs font-bold border border-info/20">
                                    <Verified fontSize="small" /> Verified 
                                </span>
                            }
                        </div>
                        
                        {isEditing ? (
                            <div className="flex items-center gap-5 text-text-main font-black w-full">
                                <label />Stage name:
                                <input 
                                    name="stage_name" 
                                    value={formData.stage_name} 
                                    onChange={handleChange} 
                                    className="w-full bg-search border border-border text-3xl rounded-lg focus:ring-highlight focus:border-highlight block p-2 outline-none mb-2" 
                                    placeholder="Enter stage name..." 
                                    required
                                />
                            </div>
                        ) : (
                            <h2 className="text-2xl md:text-5xl font-bold text-text-sub mb-2">{(user as any)?.stage_name}</h2>
                        )}
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-text-sub font-medium">
                            <span className="flex items-center gap-1.5">
                                <HeadphonesOutlined fontSize="small"/> {formatNumber((user as any)?.listens)} listens
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MicExternalOnOutlined fontSize="small"/> {formatNumber((user as any)?.total_releases)} release(s)
                            </span>
                        </div>
                    </div>
                </div>

                {/* thoôn tin cơ bản */}
                <div className="bg-card p-8 rounded-2xl border border-hover transition-all duration-300">
                    <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                        <h3 className="text-2xl font-bold text-text-main">Detail</h3>
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleCancel} 
                                    className="flex items-center gap-1 bg-transparent border border-error/50 text-error/95 font-bold py-1.5 px-4 rounded-full hover:bg-error/10 hover:border-error transition-all"
                                >
                                    <CloseOutlined fontSize="small"/> Cancel
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className={`flex items-center gap-1 text-text-main font-bold py-1.5 px-4 border border-highlight
                                        rounded-full hover:scale-105 transition-all shadow-md
                                        ${!hasChanges || isPending ? 'cursor-not-allowed opacity-70' : 'hover:bg-highlight/90'}
                                        `}
                                    disabled={!hasChanges || isPending}
                                >
                                    <SaveOutlined fontSize="small"/> {isPending ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleEditClick} 
                                className="flex items-center gap-1 bg-transparent border border-text-sub text-text-main font-bold py-1.5 px-6 rounded-full hover:borderbase hover:bg-hover hover:scale-105 transition-all"
                            >
                                <EditOutlined fontSize="small"/> Edit
                            </button>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                        <EditableField 
                            label="First Name" 
                            name="first_name" 
                            value={isEditing ? formData.first_name : user?.first_name}
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <EditableField 
                            label="Last Name" 
                            name="last_name" 
                            value={isEditing ? formData.last_name : user?.last_name} 
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <EditableField 
                            label="Email (Can not change)"
                            name="email" 
                            value={user?.email} 
                            isEditing={isEditing}
                        />
                        <EditableField 
                            label="Phone" 
                            name="phone" 
                            value={isEditing ? formData.phone : user?.phone} 
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <EditableField 
                            label="Country" 
                            name="country" 
                            value={isEditing ? formData.country : user?.country}
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <EditableField 
                            label="Gender" 
                            name="gender" 
                            className="capitalize"
                            value={isEditing ? formData.gender : user?.gender} 
                            options={[{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}, {value: 'other', label: 'Other'}]} 
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
            {/* modal cắt ảnh avatar */}
            {isCroppingImage && rawImageUrl && (
                <div className="fixed inset-0 z-100 bg-base/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                    <div className="bg-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-lg text-text-main">Crop Avatar (1:1)</h3>
                            <button onClick={() => setIsCroppingImage(false)} className="text-text-sub hover:text-text-main">
                                <CloseOutlined />
                            </button>
                        </div>
                        
                        <div className="relative w-full h-80 bg-dark">
                            <Cropper
                                image={rawImageUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // ép về tỷ lệ 1:1
                                cropShape="round" //  giao diện bo tròn
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        
                        <div className="p-4 bg-panel flex flex-col gap-4">
                            <div className="flex items-center gap-4 text-text-main">
                                <span className="text-sm font-semibold text-text-sub">Zoom</span>
                                <input 
                                    type="range" 
                                    min={1} max={3} step={0.1} 
                                    value={zoom} 
                                    onChange={(e) => setZoom(Number(e.target.value))} 
                                    className="flex-1 accent-highlight" 
                                />
                            </div>
                            <button 
                                onClick={showCroppedImage} 
                                className="w-full py-3 bg-highlight text-text-dark font-bold rounded-full hover:scale-105 transition-transform"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArtistProfilePage;