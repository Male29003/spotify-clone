import React, { useState } from 'react';
import { ADMIN_PERMISSION_LIST } from '../../configs/menu/adminMenuConfig';
import { CloseOutlined, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { isPasswordValid } from '../../utils/validators';
import PasswordValidator from '../../components/shared/feedback/PasswordValidator';

const StaffFormModal = ({ staff, onClose, onSave, isLoading }: any) => {
    const [isPassFocused, setIsPassFocused] = useState(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        username: staff?.username || '',
        email: staff?.email || '',
        password: '',
        new_password: '',
        role_permissions: staff?.role_permissions || [],
        is_active: staff !== undefined ? staff.is_active : true
    });

    const handleTogglePerm = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            role_permissions: prev.role_permissions.includes(id)
                ? prev.role_permissions.filter((p: any) => p !== id)
                : [...prev.role_permissions, id]
        }));
    };

    const currentPassValue = staff ? formData.new_password : formData.password;
    const isPassValid = isPasswordValid(currentPassValue);
    const canSubmitPass = staff ? (!currentPassValue || isPassValid) : isPassValid;

    const isAdmin = staff?.is_superuser
    const disabledSaveBtn = isAdmin || isLoading || !canSubmitPass
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-panel border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                    <h2 className="text-xl font-bold">{staff ? `Edit: ${staff.username}` : 'Create New Staff'}</h2>
                    <button 
                        onClick={onClose} 
                        className="group text-text-sub flex items-center rounded-full p-1 -translate-y-2 border border-hover hover:text-text-main text-2xl hover:scale-105"
                    >
                        <CloseOutlined 
                            fontSize='small'
                            className='group-hover:rotate-180 transition-all duration-200'
                        />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* giả để browser ko điền mặc định vào input thật */}
                    <div className="w-0 h-0 overflow-hidden absolute opacity-0 -z-50 pointer-events-none">
                        <input type="text" name="fakeusernameremembered" autoComplete="username" tabIndex={-1} />
                        <input type="password" name="fakepasswordremembered" autoComplete="current-password" tabIndex={-1} />
                    </div>
                    {/* Username & Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-sub uppercase">Username</label>
                            <input 
                                className="w-full bg-search border border-border p-3 rounded-xl outline-none"
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                disabled={isAdmin}
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-sub uppercase">Email</label>
                            <input 
                                className="w-full bg-search border border-border p-3 rounded-xl outline-none"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                disabled={isAdmin}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* role + status */}
                    <div className="grid grid-cols-2 gap-4">
                        {staff && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-sub uppercase">Account Status</label>
                                <select 
                                    className={`w-full p-3 rounded-xl outline-none font-bold ${formData.is_active ? 'bg-highlight/20 text-highlight' : 'bg-error/20 text-error'}`}
                                    value={formData.is_active ? 'true' : 'false'}
                                    onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                                    autoComplete="off"
                                    disabled={isAdmin}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Deactive</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-sub uppercase">
                            {staff ? 'Reset Password (Leave blank to keep)' : 'Password'}
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password ..."
                                className="w-full bg-base text-text-main placeholder-text-sub pl-4 py-3.5 rounded-xl outline-none border border-hover focus:border-highlight focus:ring-2 focus:ring-highlight/20 transition-all font-medium"
                                onChange={e => setFormData({...formData, [staff ? 'new_password' : 'password']: e.target.value})}
                                required
                                autoComplete="on"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </button>
                        </div>
                        <PasswordValidator
                            key={staff ? 'new-pass' : 'pass'} 
                            password={currentPassValue} 
                            isFocused={isPassFocused}
                        />
                    </div>

                    {/* danh sách các trang để gán permission cho staff */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-text-sub uppercase">Page Access Permissions</label>
                        <div className="grid grid-cols-2 gap-3">
                            {ADMIN_PERMISSION_LIST.map(item => {
                                const isSelected = isAdmin || formData.role_permissions.includes(item.id)
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => {
                                            if (!isAdmin) handleTogglePerm(item.id);
                                        }}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                                            ${isAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} 
                                            ${isSelected 
                                                ? 'border-highlight bg-highlight/10 text-highlight' 
                                                : 'border-border bg-search hover:border-text-sub'
                                            }`}
                                    >
                                        <span className="text-sm font-semibold">{item.label}</span>
                                        {isSelected && <div className="w-2 h-2 bg-highlight rounded-full" />}
                                    </div>
                            )})}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-card border-t border-border flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 font-bold text-text-sub"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={disabledSaveBtn}
                        onClick={() => onSave(formData)}
                        className={`flex-1 py-3 font-bold rounded-xl transition-all 
                            ${(disabledSaveBtn) 
                                ? 'bg-highlight/50 text-text-main cursor-not-allowed' 
                                : 'bg-highlight text-text-dark hover:scale-105'
                            }`}
                    >
                        {isLoading ? 'Processing...' : (staff ? 'Update Staff' : 'Create Staff')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffFormModal;