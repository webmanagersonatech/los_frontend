import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getProfileRequest } from "../api/lib/request/authRequest";
import toast from "react-hot-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profileImage: ""
  });
  useEffect(() => {
    setMounted(true);

    // Check initial screen size
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);

        const response:any= await getProfileRequest();

        const user = response?.user;

        if (user) {
          setProfileData({
            fullName: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
            email: user.email || "",
            phone: user.mobileNo || "",
            profileImage: user.profileImage || ""
          });


        }
      } catch (error: any) {
        console.error("Fetch profile error:", error);

        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load profile"
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Determine sidebar collapsed state based on screen size
  const effectiveCollapsed = !isDesktop ? false : sidebarCollapsed;

  // Calculate margin for main content
  const getMainMargin = () => {
    if (!isDesktop) return "";
    return effectiveCollapsed ? "lg:ml-20" : "lg:ml-72";
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Sidebar
        isCollapsed={effectiveCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onToggle={toggleSidebar}
        onCloseMobile={closeMobileMenu}
        profileData={profileData}
        onToggleMobile={toggleMobileMenu}
      />

      {/* Main Content */}
      <div className={`flex flex-col flex-1 ${getMainMargin()}`}>
        <Topbar onMenuClick={toggleMobileMenu} profileData={profileData} />
        <main className="pt-4 px-4 md:px-6 pb-6 flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4 md:px-6 mt-auto">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {currentYear} Your Company Name. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}