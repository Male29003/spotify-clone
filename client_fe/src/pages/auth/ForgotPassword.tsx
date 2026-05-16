import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { EmailOutlined, LockOutlined } from "@mui/icons-material";
import { CustomToast } from "../../components/shared/feedback/CustomToast";
import { useForgotPassword, useResetPassword, useVerifyOTP } from "../../hooks/useAuth";
import PasswordInput from "../../components/shared/ui/PasswordInput";
import PasswordValidator from "../../components/shared/feedback/PasswordValidator";
import { isPasswordValid } from "../../utils/validators";

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [ step, setStep ] = useState(1);

    // quản lý data form
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [isPassFocused, setIsPassFocused] = useState(false);

    // quản lý chức năng
    const { mutate: sendOtpMutation, isPending: isSendingOtp } = useForgotPassword();
    const { mutate: verifyOtpMutation, isPending: isVerifying } = useVerifyOTP();
    const { mutate: resetPassMutation, isPending: isResetting } = useResetPassword();
    
    // nhaận otp
    const handleSendOTP = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return setError("Please enter your email!");

        sendOtpMutation(email, {
            onSuccess: () => {
                CustomToast.success("OTP sent to your email!");
                setError(null);
                setStep(2);
            },
            onError: (error: any) => {
                setError(error?.response?.data?.email?.[0] || "Email does not exist.");
            }
        });
    }

    // ktra otp
    const handleVerifyOTP = (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return setError("Please enter the OTP!");

        verifyOtpMutation({ email, otp }, {
            onSuccess: () => {
                setError(null);
                setStep(3); // OTP chuẩn, cho vào đổi pass!
            },
            onError: (error: any) => {
                setError(error?.response?.data?.otp?.[0] || "Invalid OTP code.");
            }
        });
    }

    // reset pass
    const handleResetPass = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newPassword || !confirmPassword) return setError("Please fill all fields!");
        if(newPassword !== confirmPassword) return setError("Passwords do not match!");
        
        resetPassMutation({
            email: email,
            otp: otp,
            new_password: newPassword,
            confirm_new_password: confirmPassword
        }, {
            onSuccess: () => {
                CustomToast.success("Password reset successfully!");
                navigate('/login');
            },
            onError: (error: any) => {
                setError(`Failed to reset password. ${error}`);
            }
        });
    }

    return (
        <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-hover">
            <div className="text-center mb-8">
                <h1 className="text-3xl text-text-main font-bold mb-2">
                    {step === 1 && 'Forgot Password'}
                    {step === 2 && 'Verify OTP'}
                    {step === 3 && 'Create New Password'}
                </h1>
            </div>
            
            {/* gữi otp */}
            {step === 1 && (
                <form onSubmit={handleSendOTP}>
                    <div className="relative">
                        <EmailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                        <input
                            type="email" placeholder="Email"
                            className="w-full bg-hover text-text-main pl-10 pr-4 py-3 rounded-lg outline-none border border-transparent focus:border-green transition-all"
                            value={email} onChange={(e) => setEmail(e.target.value)} required
                        />
                    </div>
                    <button
                        type="submit" disabled={isSendingOtp}
                        className={`w-full bg-highlight text-text-dark font-bold py-3 rounded-full mt-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center ${isSendingOtp ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSendingOtp ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {/* xác thực otp */}
            {step === 2 && (
                <form onSubmit={handleVerifyOTP}>
                    <input 
                        type="text" placeholder="Enter 6-digit OTP" maxLength={6}
                        className="w-full bg-hover text-text-main px-4 py-3 rounded-lg outline-none border border-transparent focus:border-green transition-all text-center tracking-[0.5em] text-xl font-bold"
                        value={otp} onChange={(e) => setOtp(e.target.value)} required
                    />
                    <button
                        type="submit" disabled={isVerifying}
                        className={`w-full bg-highlight text-text-dark font-bold py-3 rounded-full mt-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
            )}

            {/* đổi mk */}
            {step === 3 && (
                <form onSubmit={handleResetPass} className="flex flex-col gap-4">
                    <PasswordInput 
                        children={
                            <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                        }
                        placeholder="New Password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        onFocus={() => setIsPassFocused(true)}
                        onBlur={() => setIsPassFocused(false)}
                        className="bg-hover pl-10 pr-12 py-3 rounded-lg border-transparent"
                    />

                    <PasswordValidator
                        key={"new_pass-validator"}
                        password={newPassword}
                        isFocused={isPassFocused}
                    />

                    <PasswordInput 
                        children={
                            <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                        }
                        placeholder="Confirm Password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required
                        className="bg-hover pl-10 pr-12 py-3 rounded-lg border-transparent"
                    />

                    {/* Khóa nút Save nếu Pass chưa đạt chuẩn */}
                    <button
                        type="submit" 
                        disabled={
                            isResetting || 
                            !isPasswordValid(newPassword)
                        }
                        className={`w-full bg-highlight text-text-dark font-bold py-3 rounded-full mt-2 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center 
                            ${(isResetting || !isPasswordValid(newPassword)) 
                                ? 'opacity-50 cursor-not-allowed' : ''}`
                        }
                    >
                        {isResetting ? 'Saving...' : 'Save New Password'}
                    </button>
                </form>
            )}

            {error && <p className="text-error text-sm mt-3 text-center italic font-semibold">* {error}</p>}
        </div>
    )
}

export default ForgotPasswordPage;