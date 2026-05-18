import { SearchOutlined, AccountCircle, Close } from '@mui/icons-material';
import SpotifyIcon from '../../components/shared/SpotifyIcon';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth/authStore';
import SearchDropdown from '../../sections/home/SearchModal';
import NotificationDropdown from '../../components/shared/ui/NotificationDropdown';
import { handleLogout } from '../../api/axiosConfig';

const CustomHeader = () => {
    // Gọi các hook cần thiết
    const navigate = useNavigate();
    // Quản lý search
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Quản lý dropdown profile
    const [openDropdownProfile, setOpenDropdownProfile] = useState(false)  
    const { isAuthenticated, user, clearUser } = useAuthStore((state) => state)

    //
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        // Có chữ thì mở dropdown, xóa hết chữ thì tự đóng
        if (val.trim().length > 0) setIsDropdownOpen(true);
        else setIsDropdownOpen(false);
    };
    return (
        <header className="flex items-center justify-between h-16 px-4 shrink-0 gap-4">
            {/* 1. Icon Spotify */}
            <div
                className="md:w-12 md:h-12 w-8 h-8 flex items-center justify-center cursor-pointer"
                onClick={() => navigate('/')}
                >
                <div className="w-full h-full flex items-center justify-center hover:scale-105 transition-transform">
                    <SpotifyIcon className="text-highlight text-[32px]" />
                </div>
            </div>

            {/* Thanh tìm kiếm */}
            <div className="relative flex-1 max-w-lg">
                <div className="flex items-center bg-search text-text-main rounded-full px-4 py-2 w-full border border-transparent focus-within:border-gray-500 transition-colors">
                    <SearchOutlined className="text-xl text-text-sub mr-2 shrink-0" />
                    <input 
                        type="text" 
                        placeholder="What do you want to listen to?"
                        className="bg-transparent border-none outline-none w-full text-sm text-text-main placeholder-gray-500 truncate"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => {
                            if (searchTerm.trim().length > 0) 
                                setIsDropdownOpen(true);
                        }}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setIsDropdownOpen(false);
                            }} 
                            className="text-text-sub hover:text-text-main ml-2 shrink-0"
                        >
                            <Close fontSize="small" />
                        </button>
                    )}
                </div>
                <SearchDropdown
                    query={searchTerm}
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                />
            </div>

            <div className="flex items-center justify-end shrink-0 gap-2 md:gap-4">
                {/* khi đã danhg8 nhập r */}
                {isAuthenticated ? (
                    <>
                        {/* nút premium bên ngoài khi màn hình lớn -> khi thu nhỏ thì nằm trong dropdown profile */}
                        {!user?.is_premium && 
                            <button 
                                className="hidden md:block group relative px-6 py-2 rounded-full overflow-hidden text-black text-sm font-bold tracking-wide
                                        bg-highlight shadow-lg hover:shadow-[0_0_20px_var(--theme-highlight)] 
                                        hover:scale-105 transition-all duration-300"
                                onClick={() => navigate('/subscription')}    
                            >
                                <span className="relative z-10">Explore Premium</span>
                                <div className="absolute top-0 -left-[150%] h-full w-full skew-x-[-20deg] 
                                                bg-gradient-to-r from-transparent via-text-main/60 to-transparent 
                                                transition-all duration-700 ease-in-out group-hover:left-[150%]" />
                            </button>
                        }

                        <NotificationDropdown />

                        {/* Dropdown Profile */}
                        <div className="relative group">
                            <div 
                                className="flex items-center gap-2 cursor-pointer bg-transparent hover:bg-hover p-1 rounded-full md:pl-2 transition-colors"
                                onClick={() => setOpenDropdownProfile(!openDropdownProfile)}    
                            >
                                {/* Tên User: Ẩn trên màn hình nhỏ (sm), chỉ hiện trên màn hình to */}
                                <span className="hidden sm:block text-sm font-semibold pl-1 text-text-main truncate max-w-[100px]">
                                    {user?.username || 'User'}
                                </span>
                                
                                {user?.profile_picture ? (
                                    <img src={user.profile_picture} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-md" />
                                ) : (
                                    <AccountCircle className="text-text-sub text-[32px]!" />
                                )}
                            </div>

                            {/* Menu Thả xuống */}
                            {openDropdownProfile &&
                                <div className="absolute top-full right-0 mt-2 min-w-[200px] bg-panel border border-border rounded-md shadow-xl z-70 p-1 animate-fadeIn">
                                    <div className="px-4 py-3 border-b border-hover mb-1">
                                        <p className="text-sm text-text-main font-bold truncate">{user?.username || 'User'}</p>
                                        <p className="text-xs text-text-sub truncate">{user?.email}</p>
                                    </div>

                                    {/* nút dky premium nếu user chưa dky */}
                                    {!user?.is_premium && (
                                        <button 
                                            onClick={() => {
                                                setOpenDropdownProfile(false);
                                                navigate('/subscription');
                                            }}
                                            className="md:hidden w-full text-left px-4 py-2 mb-1 rounded-md text-base text-sm font-bold bg-highlight shadow-lg hover:shadow-[0_0_10px_var(--theme-highlight)] 
                                                transition-all duration-300 tracking-wide"
                                        >
                                            <span className="relative z-10">Explore Premium</span>
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => {
                                            setOpenDropdownProfile(false); 
                                            navigate('/profile'); 
                                        }}
                                        className="text-sm text-text-main hover:bg-hover w-full text-left px-4 py-2 rounded-md whitespace-nowrap font-medium"
                                    >
                                        Profile
                                    </button>

                                    {user?.type === 'artist' && (
                                        <button 
                                            onClick={() => { 
                                                setOpenDropdownProfile(false); 
                                                navigate('/studio'); 
                                            }}
                                            className="text-sm text-highlight hover:bg-hover w-full text-left px-4 py-2 rounded-md whitespace-nowrap font-bold"
                                        >
                                            For Artists
                                        </button>
                                    )}

                                    {user?.is_staff && (
                                        <button 
                                            onClick={() => { 
                                                setOpenDropdownProfile(false); 
                                                navigate('/admin'); 
                                            }}
                                            className="text-sm text-info hover:bg-hover w-full text-left px-4 py-2 rounded-md whitespace-nowrap font-bold"
                                        >
                                            Admin Panel
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => {
                                            setOpenDropdownProfile(false);                                   
                                            handleLogout()
                                        }}
                                        className="text-sm text-error hover:bg-hover hover:text-error/80 w-full text-left px-4 py-2 rounded-md whitespace-nowrap font-medium mt-1 border-t border-hover pt-2"
                                    >
                                        Log out
                                    </button>
                                </div>
                            }
                        </div>
                    </>
                ): (
                    /* khi chưa đăng nhập */
                    <div className='flex items-center gap-2 md:gap-5 pr-2'>
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-sm text-text-main font-bold hover:scale-105 transition-all whitespace-nowrap px-4 py-2.5 border border-hover shadow-xl rounded-full"
                        >
                            Sign up
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-sm md:text-base bg-text-main text-base font-bold px-4 py-2.5 rounded-full hover:scale-105 hover:bg-text-main/90 shadow-md transition-all whitespace-nowrap"
                        >
                            Log in
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default CustomHeader;