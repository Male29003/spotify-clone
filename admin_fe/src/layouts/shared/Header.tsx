import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../../components/main_ui/ThemeToggleButton';
import { ExitToAppOutlined, FormatIndentDecrease, FormatIndentIncrease, PersonOutlined } from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth/authStore';
import { useNavigate } from 'react-router-dom';
import { useAdminSiderStore } from '../../stores/useSiderStore';
import NotificationDropdown from '../../components/shared/ui/NotificationDropdown';
import { handleLogout } from '../../api/axiosConfig';

const AdminHeader = () => {
  const { user } = useAuthStore((state) => state);
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isExpanded, toggleSider } = useAdminSiderStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-panel border-b border-gray-200 flex items-center justify-between px-6 z-50 shrink-0">
      {/* Nút ẩn/hiện Sidebar*/}
      <div className="flex items-center">
        <button 
          className='cursor-pointer w-10 h-10'
          onClick={toggleSider}
        >
          {isExpanded ? <FormatIndentDecrease /> : <FormatIndentIncrease />}
        </button>
      </div>

      {/* Cụm tính năng bên phải */}
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        <NotificationDropdown />

        <div className="relative" ref={dropdownRef}>
            {/* Nút Avatar */}
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-0.5 border-2 border-transparent hover:border-highlight rounded-full transition-all flex items-center justify-center"
            >
              {user?.image ? (
                  <img 
                    src={user.image} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover" 
                  />
              ) : (
                  <div className="w-8 h-8 bg-highlight/20 rounded-full flex items-center justify-center text-highlight font-bold text-sm uppercase">
                    {user?.username?.charAt(0) || 'N'}
                  </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-panel border border-border rounded-lg shadow-2xl py-2 animate-fadeIn z-50">
                    {/* Header thông tin User */}
                    <div className="px-4 py-3 border-b border-hover mb-2">
                        <p className="text-sm font-bold text-text-main truncate">
                            {user?.username || 'Admin User'}
                        </p>
                        <p className="text-xs text-text-sub truncate mt-0.5">
                            {user?.email || 'admin@spotify.com'}
                        </p>
                    </div>

                    {/* Danh sách nút chức năng */}
                    {user?.type === 'artist' && 
                      <button 
                          onClick={() => {
                              setIsDropdownOpen(false);
                              navigate('/studio/profile'); 
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-hover transition-colors flex items-center gap-3 font-medium"
                      >
                          <PersonOutlined fontSize="small" className="text-text-sub" />
                          <span>Profile</span>
                      </button>
                    }

                    <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-3 mt-1 font-medium"
                    >
                        <ExitToAppOutlined fontSize="small" />
                        <span>Log out</span>
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;