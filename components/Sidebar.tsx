import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Briefcase,
  Shield,
  UserPlus,
  X,
  LogOut,
  HelpCircle,
  TrendingUp,
  ClipboardList,
  Users2,


} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Team Members", href: "/team-members", icon: UserPlus },
  { name: "Teams", href: "/teams", icon: Briefcase },
  { name: "Meetings", href: "/meetings", icon: Users2, },
  { name: "Works", href: "/works", icon: ClipboardList },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Profile Settings", href: "/profile", icon: Settings },
];

const secondaryNav = [
  { name: "Help Center", href: "/help", icon: HelpCircle },
  { name: "Feedback", href: "/feedback", icon: TrendingUp },
];

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
  onToggleMobile?: () => void;
  profileData: {
    fullName: string;
    email: string;
    phone: string;
    profileImage: string;
  };
}

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggle,
  onCloseMobile,
  onToggleMobile,
  profileData
}: SidebarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarWidth = isCollapsed ? "w-20" : "w-72";

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onCloseMobile}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          ${sidebarWidth}
          bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
          dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800
          border-r border-gray-200/50 dark:border-gray-700/50
          shadow-xl
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Top Bar Accent - Enhanced Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Subtle Pattern Overlay for Light Mode */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent)] dark:opacity-0" />

        {/* Logo Area */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
          <div className={`flex items-center gap-3 ${isCollapsed && "justify-center w-full"}`}>
            <div className="relative">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Shield size={18} className="text-white" />
              </div>
              {/* Animated pulse ring */}
              <div className="absolute inset-0 rounded-lg bg-blue-600 animate-ping opacity-20" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
                  LeadershipOS
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 tracking-wide">
                  OPERATIONS
                </span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 group flex-shrink-0 shadow-sm"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={14} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors" />
            ) : (
              <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                    ${isActive
                      ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 backdrop-blur-sm text-blue-700 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
                    }
                  `}
                >
                  {/* Active Indicator - Glowing */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full shadow-sm" />
                  )}

                  <item.icon
                    size={20}
                    className={`
                      transition-all duration-200
                      ${isActive ? "text-blue-600 drop-shadow-sm" : "text-gray-500 dark:text-gray-500 group-hover:text-blue-600"}
                    `}
                  />

                  {!isCollapsed && (
                    <span className={`text-sm font-medium ${isActive ? "text-blue-700 dark:text-blue-400" : ""}`}>
                      {item.name}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          {!isCollapsed && (
            <div className="pt-2">
              <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
            </div>
          )}

          {/* Secondary Navigation */}
          {!isCollapsed && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
                Support
              </p>
              {secondaryNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-200 group"
                >
                  <item.icon size={18} className="text-gray-500 dark:text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-900/50 dark:to-transparent backdrop-blur-sm">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200 cursor-pointer group shadow-sm">
              <div className="relative">
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt={profileData.fullName}
                    className="w-10 h-10 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                    {profileData.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-white/80 dark:ring-gray-900/80 shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {profileData.fullName || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {profileData.email || "No Email"}
                </p>
              </div>
              <LogOut size={16} className="text-gray-400 group-hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative group cursor-pointer">
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt={profileData.fullName}
                    className="w-10 h-10 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                    {profileData.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white/80 dark:ring-gray-900/80" />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 px-2.5 py-1.5 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  {profileData.fullName || "User"}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}