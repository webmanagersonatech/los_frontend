// components/Topbar.tsx
import { Bell, Search, Menu, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";



interface TopbarProps {
  profileData: {
    fullName: string;
    email: string;
    phone: string;
    profileImage: string;
  };
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick, profileData }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Remove specific tokens
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      // Success toast
      toast.success("Logged out successfully");

      // Close menu
      setShowUserMenu(false);

      // Redirect after short delay
      setTimeout(() => {
        router.push("/");
      }, 1000);

    } catch (error) {
      console.error("Logout failed:", error);

      toast.error("Failed to logout");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications) {
        const target = event.target as HTMLElement;
        if (!target.closest(".notifications-dropdown")) {
          setShowNotifications(false);
        }
      }
      if (showUserMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest(".user-menu")) {
          setShowUserMenu(false);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotifications, showUserMenu]);

  const notifications = [
    { id: 1, title: "Q4 Leadership Review", time: "2 min ago", type: "meeting", unread: true },
    { id: 2, title: "Weekly Report Ready", time: "1 hour ago", type: "report", unread: true },
    { id: 3, title: "3 New Team Members", time: "3 hours ago", type: "team", unread: false },
    { id: 4, title: "Budget Approval Needed", time: "Yesterday", type: "action", unread: false },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return "📅";
      case "report":
        return "📊";
      case "team":
        return "👥";
      default:
        return "🔔";
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-30 transition-all duration-300
        ${scrolled
          ? "bg-gradient-to-r from-white/95 via-blue-50/95 to-indigo-50/95 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl shadow-lg"
          : "bg-gradient-to-r from-white via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
        }
        border-b border-gray-200/50 dark:border-gray-700/50
      `}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 shadow-sm"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          <div className="lg:hidden">
            <h1 className="text-base font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
        </div>


        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Button (Mobile) */}
          <button className="md:hidden p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all shadow-sm">
            <Search size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* Notifications */}
          <div className="relative notifications-dropdown">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 shadow-sm"
            >
              <Bell size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-800/50">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`
                        flex items-start gap-3 p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-b border-gray-100/50 dark:border-gray-700/50 last:border-0
                        ${notif.unread ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-500/5 dark:to-indigo-500/5" : ""}
                      `}
                    >
                      <div className="text-xl">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className={`text-sm ${notif.unread ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{notif.time}</p>
                      </div>
                      {notif.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 text-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-800/50">
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative user-menu">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 group shadow-sm"
            >
              <div className="relative">
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt={profileData.fullName}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white font-semibold">
                    {profileData.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 ring-2 ring-white/80 dark:ring-gray-900/80" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profileData.fullName || "User"}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{profileData.phone || "No Phone"}</p>
              </div>
              <ChevronDown size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-fade-in-up">

                {/* User Info */}
                <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profileData.fullName || "User"}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profileData.email || "No Email"}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">

                  {/* Profile */}


                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    Change Password
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50 dark:hover:from-red-500/10 dark:hover:to-red-500/10 transition-all"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}