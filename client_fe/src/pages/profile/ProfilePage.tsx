import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/auth/authStore';
import { EditOutlined, DiamondOutlined, VpnKeyOutlined, SaveOutlined, CloseOutlined, DeleteOutlined } from '@mui/icons-material';
import ChangePasswordModal from '../../sections/profile/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { DEFAULT_USER_AVATAR } from '../../constants/constants';
import { useUpdateProfile } from '../../hooks/user/useUsers';

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
            <div className="font-semibold text-lg h-10 flex items-center">
                <span className="truncate block w-full" title={value}>
                    {displayValue || value || '-'}
                </span>
            </div>
        )}
    </div>
)

const ProfilePage: React.FC = () => {
    const { user, setUser } = useAuthStore(state => state);
    const navigate = useNavigate();
    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // State quản lý Form và Ảnh
    const [formData, setFormData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone: user?.phone || "",
        country: user?.country || "",
        gender: user?.gender || "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // Quản lý thay đổi data
    const displayImage = imagePreview !== null 
        ? (imagePreview === '' ? DEFAULT_USER_AVATAR : imagePreview) 
        : (user?.profile_picture || DEFAULT_USER_AVATAR);
    const hasImageToRemove = displayImage !== DEFAULT_USER_AVATAR;

    if (!user) return <div className="text-center text-text-main mt-10">Please log in...</div>;

    // ktra thay đổi data hay ko
    const hasChanges = 
        formData.first_name !== (user?.first_name || "") ||
        formData.last_name !== (user?.last_name || "") ||
        formData.phone !== (user?.phone || "") ||
        formData.country !== (user?.country || "") ||
        formData.gender !== (user?.gender || "") ||
        imageFile !== null;

    // reset form
    const resetForm = () => {
        setFormData({
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            phone: user?.phone || "",
            country: user?.country || "",
            gender: user?.gender || "",
        });
        setImageFile(null);
        setImagePreview(null);
    };

    // quản lý chức năng
    // Quản lý update profile
    const { mutateAsync: updateProfileMutation, isPending } = useUpdateProfile()

    // quản lý thay đổi data
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            e.target.value = '';
            return CustomToast.error('Accepted types: JPG, PNG, WEBP!');
        }
        if (file.size > 7 * 1024 * 1024) {
            e.target.value = '';
            return CustomToast.error('Maximum size is 7MB!');
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        e.target.value = '';
    };
    const handleImageRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        setImageFile(null);
        setImagePreview(''); 
    };

    const handleEditClick = () => {
        resetForm();
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (hasChanges) {
            showConfirm('warning',
                () => {
                    setIsEditing(false);
                    resetForm();
                    closeModal();
                },
                { title: "Discard changes?", message: "You have unsaved changes. Are you sure you want to discard them?" }
            );
        } else {
            setIsEditing(false);
            resetForm();
        }
    };

    const handleSave = () => {
        showConfirm('save', async () => {
            setLoading(true);
            try {
                const data = new FormData();
                data.append('first_name', formData.first_name);
                data.append('last_name', formData.last_name);
                data.append('phone', formData.phone);
                data.append('country', formData.country);
                data.append('gender', formData.gender);
                if (imageFile) {
                    data.append('profile_picture', imageFile);
                }

                await updateProfileMutation(data, {
                    onSuccess: (updatedUser) => {
                        setUser(updatedUser as any)
                    },
                })

                CustomToast.success("Successfully updated profile!");
                setIsEditing(false);
                resetForm();
                closeModal();
            } catch (error) {
                console.error("Lỗi update:", error);
                CustomToast.error("Failed to update profile!");
                closeModal();
            } finally {
                setLoading(false);
            }
        }, { title: "Save Profile", message: "Are you sure you want to save these changes?" });
    };

    return (
        <div className="p-8 text-text-main max-w-4xl mx-auto animate-fadeIn">
            <h1 className="text-4xl font-bold mb-8">Personal Profile</h1>
            
            {/* Header / Avatar Info */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-card p-8 rounded-xl border border-hover shadow-xl">
                <div 
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => isEditing && fileInputRef.current?.click()}
                >
                    <img 
                        src={displayImage} 
                        alt="Avatar" 
                        className={`w-48 h-48 rounded-full object-cover shadow-2xl transition-transform border-4 border-panel
                            ${isEditing ? 'group-hover:brightness-50 group-hover:scale-105' : ''}`}
                    />
                    {isEditing && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-base/40 pointer-events-none">
                            <EditOutlined className="text-white text-4xl drop-shadow-md" />
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={handleImageChange} 
                        onClick={(e) => e.stopPropagation()}
                    />
                    {isEditing && hasImageToRemove && (
                        <button
                            onClick={handleImageRemove}
                            type='button'
                            className="absolute top-2 right-8 bg-base/60 hover:bg-base hover:scale-110 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md"
                            title="Remove photo"
                        >
                            <DeleteOutlined fontSize="small" />
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2">
                        <span className="text-sm font-semibold uppercase tracking-widest text-text-sub">
                            Profile
                        </span>
                        {user.is_premium && user?.rejected !== 4 && user?.rejected !== 5 && (
                            <>
                                <span className="bg-linear-to-r from-yellow-500 to-yellow-300 text-text-dark text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                                    <DiamondOutlined fontSize="small" /> Premium
                                </span>
                                {(
                                    <button 
                                        onClick={() => navigate('/apply-artist')} 
                                        className="bg-highlight text-text-dark font-bold py-1.5 px-4 rounded-full hover:scale-105 transition-all shadow-lg ml-2"
                                    >
                                        Become an Artist
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <h2 className="text-2xl md:text-5xl font-bold break-all">{user?.username}</h2>
                    <p className="text-text-sub text-lg mt-2 truncate">{user.email}</p>
                </div>
            </div>

            {/* thông tin cá nhân */}
            <div className="bg-card p-8 rounded-xl border border-hover transition-all duration-300">
                <h3 className="text-2xl font-bold mb-6 border-b border-border pb-4 truncate">Detail Information</h3>
                
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
                        label="Email (Cannot change)"
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
                        options={[
                            {value: 'male', label: 'Male'}, 
                            {value: 'female', label: 'Female'}, 
                            {value: 'other', label: 'Other'}
                        ]} 
                        isEditing={isEditing}
                        onChange={handleChange}
                    />
                </div>
                
                {/* Khu vực Nút bấm */}
                <div className="mt-10 flex items-center gap-4">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={handleCancel} 
                                className="flex items-center gap-1 bg-transparent border border-error/50 text-error/95 font-bold py-2 px-6 rounded-full hover:bg-error/10 hover:border-error transition-all"
                            >
                                <CloseOutlined fontSize="small"/> Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={isPending || !hasChanges}
                                className={`flex items-center gap-1 font-bold py-2 px-6 rounded-full transition-all shadow-md
                                    ${isPending || !hasChanges 
                                        ? 'cursor-not-allowed opacity-40 bg-highlight/30 text-text-main' 
                                        : 'hover:scale-105 hover:bg-highlight/90 bg-highlight text-text-dark'
                                    }`}
                            >
                                <SaveOutlined fontSize="small"/> {isPending ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={handleEditClick} 
                                className="bg-transparent border border-text-sub text-text-main font-bold py-2 px-6 rounded-full hover:border-white hover:bg-hover hover:scale-105 transition-all"
                            >
                                <EditOutlined fontSize="small" className="mr-1"/> Edit Profile
                            </button>

                            <button 
                                onClick={() => setIsChangingPassword(true)} 
                                className="flex items-center gap-2 bg-transparent border border-text-sub text-text-main font-bold py-2 px-6 rounded-full hover:border-white hover:bg-hover hover:scale-105 transition-all"
                            >
                                <VpnKeyOutlined fontSize="small" /> Change Password
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Modal đổi pass */}
            {isChangingPassword && 
                <ChangePasswordModal 
                    onClose={() => setIsChangingPassword(false)} 
                />
            }
        </div>
    );
};

export default ProfilePage;