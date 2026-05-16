import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    EmailOutlined, 
    LockOutlined, 
    VisibilityOff, 
    Visibility,
    ErrorOutline
} from "@mui/icons-material";
import authApi from "../../api/auth/api";
import { userApi } from "../../api/user/api";
import SpotifyIcon from "../../components/shared/SpotifyIcon";
import { artistProfileApi } from "../../api/artist/api";
import { formatUserProfile } from "../../utils/formatters";
import { useAuthStore } from "../../stores/auth/authStore";

const LoginRegis: React.FC = () => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [isPending, setIsPending] = useState<boolean>(false);
    const navigate = useNavigate();

    const { setUser } = useAuthStore((state) => state)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsPending(true)
        try {
            await authApi.login({email, password})
            try {
                const userData: any = await userApi.getMe();
                let artistData:any = undefined
                if(userData.type === 'artist'){
                    artistData = await artistProfileApi.get();
                }
                // format định dạng data cho user
                const profileData = formatUserProfile(userData, artistData)
                setUser(profileData)
                
                if (userData.is_staff) {
                    navigate('/admin');
                } else if (userData.type === "artist") {
                    navigate('/studio');
                }
            } catch (e) {
                console.error("Not found user !!!", e);
                setError("Fail to fetch user data~");
            }
        } catch (error: any) {
            console.error("Error trong loginregis", error);
            if (error.response?.data?.detail) {
                setError(error.response.data.detail);
            } else {
                setError("Incorrect information! Please try again!!!");
            }
        } finally {
            setIsPending(false)
        }
    };

    return (
        <div className="w-full max-w-md bg-card/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-hover/50">
            {/* Logo & Header Section */}
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-highlight/10 text-highlight rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <SpotifyIcon />
                </div>
                <h1 className="text-3xl font-black text-text-main tracking-tight mb-2">
                    Welcome Back
                </h1>
                <p className="text-text-sub text-sm">
                    Sign in to the Studio & Admin Panel
                </p>
            </div>

            {/* Error Alert Box */}
            {error && (
                <div className="mb-6 p-3 bg-error/10 border border-error/50 rounded-lg flex items-start gap-3 animate-fadeIn">
                    <ErrorOutline className="text-error text-sm mt-0.5" fontSize="small" />
                    <p className="text-error text-sm font-medium leading-tight">{error}</p>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
                {/* Email Input */}
                <div className="relative group">
                    <EmailOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub text-xl group-focus-within:text-highlight transition-colors" />
                    <input
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-base text-text-main placeholder-text-sub pl-12 pr-4 py-3.5 rounded-xl outline-none border border-hover focus:border-highlight focus:ring-2 focus:ring-highlight/20 transition-all font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Password Input */}
                <div className="relative group">
                    <LockOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub text-xl group-focus-within:text-highlight transition-colors" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full bg-base text-text-main placeholder-text-sub pl-12 pr-12 py-3.5 rounded-xl outline-none border border-hover focus:border-highlight focus:ring-2 focus:ring-highlight/20 transition-all font-medium"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isPending}
                    className={`relative w-full bg-highlight text-text-dark font-bold text-lg py-3.5 rounded-full mt-6 shadow-[0_0_15px_rgba(29,185,84,0.3)] hover:shadow-[0_0_25px_rgba(29,185,84,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 overflow-hidden ${isPending ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <span>Sign In</span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default LoginRegis;