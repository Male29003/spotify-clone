import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmailOutlined, LockOutlined } from "@mui/icons-material";
import { useAuthStore } from "../../stores/auth/authStore";
import authApi from "../../api/auth/api";
import { userApi } from "../../api/user/api";
import { CustomToast } from "../../components/shared/feedback/CustomToast";
import PasswordValidator from "../../components/shared/feedback/PasswordValidator";
import PasswordInput from "../../components/shared/ui/PasswordInput";
import { isPasswordValid, isvalidEmail } from "../../utils/validators";

const LoginRegis: React.FC = () => {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);
    const [isPassFocused, setIsPassFocused] = useState(false);
    // quản lý dky tk mới
    const [isSignup, setIsSignup] = useState<boolean>(false);
    const [regStep, setRegStep] = useState<number>(1);
    
    // data fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState(""); // State mới lưu OTP
    
    // quản lý chức năng
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState<boolean>(false);
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsPending(true);

        try {
            // dky
            if (isSignup) {
                if (regStep === 1) {
                    if (!isvalidEmail(email)) {
                        return CustomToast.error("Invalid email! (For example: name@gmail.com)");
                    }
                    if (password !== confirmPassword) {
                        setError("Confirm password does not match!");
                        setIsPending(false);
                        return;
                    }
                    const username = email.split('@')[0];
                    // Truyền passwordCP
                    await authApi.register({ 
                        email, 
                        password, 
                        passwordCP: confirmPassword, 
                        username 
                    });
                    // qua bước 2
                    CustomToast.success("OTP has been sent to your email!");
                    setRegStep(2);
                    
                } else if (regStep === 2) {
                    // xác thực otp
                    if (!otp) {
                        setError("Please enter the OTP!");
                        setIsPending(false);
                        return;
                    }
                    await authApi.verifyRegister({ email, otp });
                    CustomToast.success("Registration successful! You can now login.");
                    
                    // Reset form data
                    setIsSignup(false);
                    setRegStep(1);
                    setPassword("");
                    setConfirmPassword("");
                    setOtp("");
                }
            } 
            // đăng nhập
            else {
                await authApi.login({ email, password });
                try {
                    const userData: any = await userApi.getMe();
                    // Nếu là Admin
                    if (userData.is_staff) {
                        CustomToast.info('You are admin! Please access to your admin site!');
                        navigate('/admin'); 
                        return;
                    }

                    setUser(userData);
                    navigate('/');
                } catch (e) {
                    console.error("Not found user !!!", e);
                    setError("Fail to fetch user data~");
                }
            }
        } catch (error: any) {
            console.error("Error trong loginregis", error);
            if (error.response?.data?.error) {
                setError(error.response.data.error); // Lỗi từ VerifyOTP
            } else if (error.response?.data?.detail) {
                setError(error.response.data.detail); // Lỗi từ Login
            } else {
                setError(error.response?.data?.email?.[0] || "An error occurred! Please try again.");
            }
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-hover relative overflow-hidden">
            <div className="text-center mb-8">
                <h1 className="text-3xl text-text-main font-bold mb-2 transition-all">
                    {!isSignup ? "Sign in" : (regStep === 1 ? "Sign up" : "Verify Email")}
                </h1>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                
                {/* login */}
                {(!isSignup || (isSignup && regStep === 1)) && (
                    <>
                        <div className="relative">
                            <EmailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                            <input
                                type="email" placeholder="Email" required
                                className="w-full bg-hover text-text-main pl-10 pr-4 py-3 rounded-lg outline-none border border-transparent focus:border-green transition-all"
                                value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending}
                            />
                        </div>

                        <PasswordInput 
                            children={
                                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                            }
                            className="bg-hover pl-10 pr-12 py-3 rounded-lg border-transparent"
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isPending}
                            autoComplete="on"
                            onFocus={() => (isSignup && regStep === 1) && setIsPassFocused(true)}
                            onBlur={() => (isSignup && regStep === 1) && setIsPassFocused(false)}
                        />
                    </>
                )}

                {/* nếu là dky thì phải có khung điều kiện passw */}
                {isSignup && regStep === 1 && (
                    <>
                        <PasswordValidator 
                            key={"register-validator"}
                            password={password}
                            isFocused={isPassFocused}
                        />
                        
                        <PasswordInput 
                            children={
                                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-xl!" />
                            }
                            className="bg-hover pl-10 pr-4 py-3 rounded-lg border-transparent"
                            placeholder="Repeat Password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isPending}
                        />
                    </>
                )}

                {/* nhập otp để dky tk */}
                {isSignup && regStep === 2 && (
                    <div className="animate-fadeIn">
                        <p className="text-center text-text-sub text-sm mb-4">
                            We've sent an OTP to <span className="text-text-main font-bold">{email}</span>
                        </p>
                        <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            maxLength={6} 
                            required
                            className="w-full bg-hover text-text-main px-4 py-3 rounded-lg outline-none border border-transparent focus:border-green transition-all text-center tracking-[0.5em] text-xl font-bold"
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} disabled={isPending}
                        />
                    </div>
                )}

                {/* Quên mật khẩu - Login*/}
                {!isSignup && (
                    <div className="flex justify-start ml-2">
                        <Link to="/forgot-password" className="text-sm text-text-sub underline hover:text-highlight cursor-pointer">
                            Forgot password?
                        </Link>
                    </div>
                )}

                {/* báo lỗi */}
                {error && <p className="text-error text-xs mt-1 italic font-semibold">* {error}</p>}

                <button
                    type="submit"
                    disabled={isPending || (isSignup && regStep === 1 && !isPasswordValid(password))}
                    className={`w-full bg-highlight text-text-main font-bold py-3 rounded-full mt-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center 
                        ${(isPending || (isSignup && regStep === 1 && !isPasswordValid(password))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isPending ? "Processing..." : (!isSignup ? "Sign in" : (regStep === 1 ? "Sign up" : "Verify & Create Account"))}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-hover text-center">
                <p className="text-text-sub text-sm">
                    {isSignup ? "Already have an account?" : "Don't have an account?"}
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignup(!isSignup);
                            setRegStep(1);
                            setError(null);
                        }}
                        className="text-text-main font-bold ml-2 hover:underline"
                    >
                        {isSignup ? "Login now" : "Sign up now"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginRegis;