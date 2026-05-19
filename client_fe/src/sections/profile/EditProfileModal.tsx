import React, { useRef, useState } from 'react';
import { CloseOutlined, DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth/authStore';
import { useUpdateProfile } from '../../hooks/user/useUsers';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { DEFAULT_USER_AVATAR } from '../../constants/constants';

interface EditProfileModalProps {
    onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
    const { user, setUser } = useAuthStore(state => state);

    // Quản lý form data
    const [formData, setFormData] = useState({
        username: user?.username || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        country: user?.country || '',
    });
    // Quản lý ảnh
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Quản lý thay đổi data
    const displayImage = imagePreview !== null 
        ? (imagePreview === '' ? DEFAULT_USER_AVATAR : imagePreview) 
        : (user?.profile_picture || DEFAULT_USER_AVATAR);
    
    // Chỉ hiện nút Xóa nếu đang có ảnh thật (khác ảnh mặc định)
    const hasImageToRemove = displayImage !== DEFAULT_USER_AVATAR;
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if(file){
            if(!file.type.startsWith('image/'))
                return CustomToast.error('Please upload an image file!')
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }
    const handleImageRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        setImageFile(null);
        setImagePreview(''); 
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Quản lý update profile
    const { mutateAsync: updateProfileMutation, isPending } = useUpdateProfile()
    const { showConfirm, closeModal, setLoading} = useConfirmModalStore()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        showConfirm('save', async () => {
            try{
                const data = new FormData()
                data.append('first_name', formData.first_name)
                data.append('last_name', formData.last_name)
                data.append('phone', formData.phone)
                data.append('country', formData.country)
                data.append('gender', formData.gender)
                data.append('username', formData.username)
                // nếu có ảnh thì up
                if (imageFile) {
                    // User úp ảnh mới
                    data.append('profile_picture', imageFile)
                } else if (imagePreview === '' && user?.profile_picture) {
                    //  User bấm nút thùng rác để xóa ảnh cũ đang có
                    data.append('profile_picture', '')
                }
                setLoading(true)
                await updateProfileMutation(data, {
                    onSuccess: (updatedUser) => {
                        setUser(updatedUser as any)
                        onClose()
                        CustomToast.success(`Successfully update profile!`)
                    },
                    onError: () => {
                        CustomToast.error(`Failed to update profile!`)
                    },
                    onSettled: () => {
                        closeModal()
                    },
                })
                
            } catch(error){
                CustomToast.error(`Failed to update profile!`)
                console.error(`Error: ${error}`);
                closeModal()
            }
        },{
            message: `Do you want to save change?`
        })
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-base/70 backdrop-blur-sm">
            <div className="bg-panel w-full max-w-2xl p-6 rounded-xl border border-border shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-text-main">Edit profile</h2>
                    <button onClick={onClose} className="text-text-sub hover:text-text-main">
                        <CloseOutlined />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 items-center'>
                        {/* ảnh */}
                        <div className='sm:row-span-2 flex justify-center items-center gap-4 shrink-0 shadow-lg group'>
                            <div className='relative w-44 h-44 rounded-full overflow-hidden flex items-center justify-center'>    
                                <img 
                                    src={displayImage} 
                                    alt="Avatar" 
                                    className={`w-full h-full rounded-full object-cover shadow-2xl transition-transform border-4 border-panel group-hover:brightness-50`}
                                />                
                                <div 
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <EditOutlined className="text-text-main text-4xl drop-shadow-md" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {hasImageToRemove && (
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
                        </div>
                        {/*usernmae */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub">Display Name (Username)</label>
                            <input 
                                type="text" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleInputChange}
                                className="bg-search text-text-main p-3 rounded-md outline-none focus:border-green border border-transparent transition-colors"
                                placeholder="Display name..." 
                                required
                            />
                        </div>
                        {/* phone */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub">Phone Number</label>
                            <input 
                                type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                                className="bg-search text-text-main p-3 rounded-md outline-none focus:border-green border border-transparent transition-colors"
                                placeholder="Phone..."
                            />
                        </div>
                        {/* tên */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub">First Name</label>
                            <input 
                                type="text" name="first_name" value={formData.first_name} onChange={handleInputChange}
                                className="bg-search text-text-main p-3 rounded-md outline-none focus:border-green border border-transparent transition-colors"
                                placeholder="First name..."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub">Last Name</label>
                            <input 
                                type="text" name="last_name" value={formData.last_name} onChange={handleInputChange}
                                className="bg-search text-text-main p-3 rounded-md outline-none focus:border-green border border-transparent transition-colors"
                                placeholder="Last name..."
                            />
                        </div>
                        {/* gitinh va quốc gia */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub">Gender</label>
                            <select 
                                name="gender" value={formData.gender} onChange={handleInputChange}
                                className="bg-search text-text-main p-3 rounded-md outline-none focus:border-green border border-transparent transition-colors"
                            >
                                <option value="">Choose gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-text-sub">Country Code</label>
                            <input 
                                type="text" name="country" value={formData.country} onChange={handleInputChange}
                                className="bg-search text-text-main p-3 rounded-md outline-none focus:border-green border border-transparent transition-colors"
                                placeholder="Example: VN, US, UK..." maxLength={2}
                            />
                        </div>
                    </div>
                    {/* nút save */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-2 font-bold rounded-full hover:scale-105 transition-transform text-text-sub">
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending} className="bg-highlight text-text-dark px-8 py-2 font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50">
                            {isPending ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;