import React, { useState } from 'react';
import { CloseOutlined, LockOutlined } from '@mui/icons-material';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { userApi } from '../../api/user/api';
import PasswordInput from '../../components/shared/ui/PasswordInput';
import { isPasswordValid } from '../../utils/validators';
import PasswordValidator from '../../components/shared/feedback/PasswordValidator';

interface ChangePasswordModalProps {
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
    const [isPassFocused, setIsPassFocused] = useState(false);
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_new_password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_new_password) {
            CustomToast.error("Repeat password is not correct!");
            return;
        }

        if (formData.new_password.length < 8) {
            CustomToast.error("New password is not correct!");
            return;
        }

        setIsLoading(true);
        try {
            await userApi.changePassword({
                old_password: formData.old_password,
                new_password: formData.new_password,
                confirm_new_password: formData.confirm_new_password
            });

            CustomToast.success("Successfully change password.");
            onClose(); // Đóng modal luôn khi đổi thành công
            
        } catch (error: any) {
            const errorMsg = error.response?.data?.old_password?.[0] 
                || error.response?.data?.non_field_errors?.[0]
                || "Wrong old pass word or system error!";
            CustomToast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 backdrop-blur-sm px-4">
            {/* Modal Container */}
            <div className="bg-card p-6 md:p-8 rounded-xl max-w-md w-full shadow-2xl border border-border relative animate-fadeIn">
                
                {/* Nút Đóng */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-sub hover:text-text-main transition-colors bg-base/50 p-1 rounded-full hover:bg-base"
                >
                    <CloseOutlined />
                </button>

                <h2 className="text-2xl font-bold text-text-main mb-6">Change Password</h2>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/*mk cũ */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-text-sub">Current Password</label>
                        <PasswordInput 
                            children={
                                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                            }
                            className="bg-hover pl-10 pr-12 py-3 rounded-lg border-transparent"
                            name="old_password"
                            value={formData.old_password}
                            onChange={handleChange}
                            required
                            placeholder="Enter current password"
                        />
                    </div>
                    {/*mk mới */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-text-sub">New Password</label>
                        <PasswordInput 
                            children={
                                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                            }
                            className="bg-hover pl-10 pr-12 py-3 rounded-lg border-transparent"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                            placeholder="Enter new password again"
                            onFocus={() => setIsPassFocused(true)}
                            onBlur={() => setIsPassFocused(false)}
                        />
                    </div>
                    <PasswordValidator
                        key={'change-password-validator'}
                        password={formData.new_password}
                        isFocused={isPassFocused}
                    />
                    {/*Xác nhận */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-text-sub">Confirm New Password</label>
                        <PasswordInput 
                            children={
                                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                            }
                            className="bg-hover pl-10 pr-12 py-3 rounded-lg border-transparent"
                            name="confirm_new_password"
                            value={formData.confirm_new_password}
                            onChange={handleChange}
                            required
                            placeholder="Enter new password again"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-full font-bold text-text-main hover:bg-hover transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={
                                isLoading || 
                                !isPasswordValid(formData.new_password)
                            }
                            className={`px-6 py-2 rounded-full font-bold transition-all
                                ${(isLoading || !isPasswordValid(formData.new_password)) ? 'bg-highlight/50 cursor-not-allowed text-text-main' : 'bg-highlight text-text-dark hover:scale-105'}`}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;