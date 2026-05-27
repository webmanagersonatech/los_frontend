import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "framer-motion";
import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import { changePasswordRequestvialogin, updateProfileRequest, getProfileRequest } from "../api/lib/request/authRequest";
import toast from "react-hot-toast";
import CryptoJS from "crypto-js";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Key,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader,
  Shield,
  Award,
  Building2,
  Clock,
} from "lucide-react";

// ============== HELPER FUNCTIONS ==============

// Password strength checker
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]/)) strength++;
  if (password.match(/[A-Z]/)) strength++;
  if (password.match(/[0-9]/)) strength++;
  if (password.match(/[^a-zA-Z0-9]/)) strength++;
  return strength;
};

const getPasswordStrengthText = (strength: number) => {
  if (strength === 0) return null;
  if (strength <= 2) return { text: "Weak", color: "text-red-500", bgColor: "bg-red-500" };
  if (strength <= 3) return { text: "Fair", color: "text-orange-500", bgColor: "bg-orange-500" };
  if (strength <= 4) return { text: "Good", color: "text-blue-500", bgColor: "bg-blue-500" };
  return { text: "Strong", color: "text-green-500", bgColor: "bg-green-500" };
};

// Base64 image utilities
const getBase64String = (base64Url: string): string => {
  if (!base64Url) return "";
  return base64Url.split(",")[1] || base64Url;
};

const getBase64Metadata = (base64Url: string): { mimeType: string; data: string } => {
  const matches = base64Url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { mimeType: "image/jpeg", data: base64Url };
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
};

const getImageSizeFromBase64 = (base64Url: string): number => {
  if (!base64Url) return 0;
  const base64String = getBase64String(base64Url);
  const padding = (base64String.match(/=+$/) || [""])[0].length;
  const sizeInBytes = (base64String.length * 3) / 4 - padding;
  return sizeInBytes;
};

const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Image compression
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL(file.type, quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// ============== MAIN COMPONENT ==============

export default function ProfileSettingsPage() {
  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 234 567 8900",
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const SECRET_KEY = "sonacassecretkey@2025";
  // UI states
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Image states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    size: number;
    mimeType: string;
    originalName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref for height synchronization
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Form errors
  const [profileErrors, setProfileErrors] = useState({
    fullName: "",
    phone: "",
    profileImage: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Computed values
  const passwordStrength = checkPasswordStrength(passwordData.newPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);
  const isPasswordMatch = passwordData.newPassword === passwordData.confirmPassword;

  // Sync heights between columns
  useEffect(() => {
    const syncHeights = () => {
      if (leftColumnRef.current && rightColumnRef.current && containerRef.current) {
        leftColumnRef.current.style.minHeight = "auto";
        rightColumnRef.current.style.minHeight = "auto";

        const leftHeight = leftColumnRef.current.scrollHeight;
        const rightHeight = rightColumnRef.current.scrollHeight;
        const maxHeight = Math.max(leftHeight, rightHeight);

        leftColumnRef.current.style.minHeight = `${maxHeight}px`;
        rightColumnRef.current.style.minHeight = `${maxHeight}px`;
      }
    };

    const timeoutId = setTimeout(syncHeights, 100);

    const resizeObserver = new ResizeObserver(() => {
      syncHeights();
    });

    if (leftColumnRef.current) resizeObserver.observe(leftColumnRef.current);
    if (rightColumnRef.current) resizeObserver.observe(rightColumnRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [profileData, passwordData, profileImage, loadingProfile, loadingPassword]);
  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);

        const response: any = await getProfileRequest();

        const user = response?.user;

        if (user) {
          setProfileData({
            fullName: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
            email: user.email || "",
            phone: user.mobileNo || "",
          });

          if (user.profileImage) {
            setProfileImage(user.profileImage);
          }
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
  // ============== IMAGE HANDLERS ==============

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      setProfileErrors((prev) => ({ ...prev, profileImage: "Please upload an image file" }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      setProfileErrors((prev) => ({ ...prev, profileImage: "Image size should be less than 5MB" }));
      return;
    }

    try {
      // Compress image before converting to base64
      const compressedBase64 = await compressImage(file, 800, 0.8);
      const compressedSize = getImageSizeFromBase64(compressedBase64);

      setProfileImage(compressedBase64);
      setProfileImageFile(file);
      setImageInfo({
        size: compressedSize,
        mimeType: file.type,
        originalName: file.name,
      });
      setProfileErrors((prev) => ({ ...prev, profileImage: "" }));

      const originalSize = formatBytes(file.size);
      const compressedSizeFormatted = formatBytes(compressedSize);
      toast.success(
        `Image optimized! Size reduced from ${originalSize} to ${compressedSizeFormatted}`
      );
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to process image");
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageFile(null);
    setImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Profile image removed");
  };

  // ============== PROFILE HANDLERS ==============

  const validateProfileForm = () => {
    let isValid = true;
    const newErrors = { fullName: "", phone: "", profileImage: "" };

    if (!profileData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }

    if (profileData.phone) {
      // only digits
      const cleanedPhone = profileData.phone.replace(/\D/g, "");

      // must be exactly 10 digits
      if (cleanedPhone.length !== 10) {
        newErrors.phone = "Phone number must be exactly 10 digits";
        isValid = false;
      }

      // must start with 6,7,8,9
      else if (!/^[6789]/.test(cleanedPhone)) {
        newErrors.phone = "Phone number must start with 6, 7, 8, or 9";
        isValid = false;
      }
    }

    setProfileErrors(newErrors);
    return isValid;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    setLoadingProfile(true);

    try {
      const nameParts = profileData.fullName.trim().split(" ");

      const payload = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: profileData.email,
        mobileNo: profileData.phone,
        profileImage: profileImage || "",
      };

      // API CALL
      const response: any = await updateProfileRequest(payload);

      toast.success(
        response?.message || "Profile updated successfully!"
      );

    } catch (error: any) {
      console.error("Profile update error:", error);

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile"
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // ============== PASSWORD HANDLERS ==============

  const validatePasswordForm = () => {
    let isValid = true;
    const newErrors = { currentPassword: "", newPassword: "", confirmPassword: "" };

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
      isValid = false;
    } else if (passwordStrength < 3) {
      newErrors.newPassword = "Password is too weak. Use uppercase, lowercase, number, and special character.";
      isValid = false;
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (!isPasswordMatch) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setPasswordErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    const currentPassword = passwordData.currentPassword.trim();
    const newPassword = passwordData.newPassword.trim();
    const confirmPassword = passwordData.confirmPassword.trim();

    // Extra validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password cannot be same as current password");
      return;
    }

    try {
      setLoadingPassword(true);

      // Encrypt passwords
      const encryptedOld = CryptoJS.AES.encrypt(
        currentPassword,
        SECRET_KEY
      ).toString();

      const encryptedNew = CryptoJS.AES.encrypt(
        newPassword,
        SECRET_KEY
      ).toString();

      const encryptedConfirm = CryptoJS.AES.encrypt(
        confirmPassword,
        SECRET_KEY
      ).toString();

      // API Call
      const response: any = await changePasswordRequestvialogin({
        oldPassword: encryptedOld,
        newPassword: encryptedNew,
        confirmPassword: encryptedConfirm,
      });

      toast.success(
        response?.message || "Password updated successfully!"
      );

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      toast.error(message);
    } finally {
      setLoadingPassword(false);
    }
  };

  // ============== RENDER ==============
  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="animate-spin text-indigo-600" size={40} />
        </div>
      </DashboardLayout>
    );
  }
  return (
    <>
      <Head>
        <title>Profile Settings | Command Center</title>
        <meta name="description" content="Manage your profile settings and preferences" />
      </Head>

      <DashboardLayout>
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-white min-h-screen">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal information and account security
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left Column - Profile Summary */}
            <div ref={leftColumnRef} className="lg:col-span-1 h-full">
              <div className="space-y-6 h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden h-full flex flex-col"
                >
                  <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
                    <User size={20} className="text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Personal Information
                    </h3>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="p-6 space-y-5 flex-1 flex flex-col">
                    <div className="flex-1 space-y-5">
                      {/* Profile Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Profile Image
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-indigo-100">
                              {profileImage ? (
                                <img
                                  src={profileImage}
                                  alt={profileData.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl font-bold text-white">
                                  {profileData.fullName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handleCameraClick}
                              className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-full text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-105"
                            >
                              <Camera size={12} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={handleCameraClick}
                              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              Upload new photo
                            </button>
                            {profileImage && (
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="text-sm text-red-500 hover:text-red-600"
                              >
                                Remove photo
                              </button>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              JPG, GIF or PNG. Max size 5MB.
                            </p>
                          </div>
                        </div>



                        {profileErrors.profileImage && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {profileErrors.profileImage}
                          </p>
                        )}
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={profileData.fullName}
                            onChange={(e) =>
                              setProfileData({ ...profileData, fullName: e.target.value })
                            }
                            className={`w-full pl-10 pr-3 py-2.5 border ${profileErrors.fullName ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                              } rounded-xl outline-none focus:ring-2 focus:border-transparent transition`}
                            placeholder="Enter your full name"
                          />
                        </div>
                        {profileErrors.fullName && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {profileErrors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Email cannot be changed. Contact admin for assistance.
                        </p>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => {
                              // allow only numbers
                              const value = e.target.value.replace(/\D/g, "");

                              // limit to 10 digits
                              if (value.length <= 10) {
                                setProfileData({
                                  ...profileData,
                                  phone: value,
                                });
                              }
                            }}
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`w-full pl-10 pr-3 py-2.5 border ${profileErrors.phone
                              ? "border-red-300 focus:ring-red-500"
                              : "border-slate-200 focus:ring-indigo-500"
                              } rounded-xl outline-none focus:ring-2 focus:border-transparent transition`}
                            placeholder="Enter 10-digit mobile number"
                          />
                        </div>
                        {profileErrors.phone && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {profileErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100 mt-4">
                      <button
                        type="submit"
                        disabled={loadingProfile}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loadingProfile ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>

            {/* Right Column - Password Form */}
            <div ref={rightColumnRef} className="lg:col-span-2 h-full">
              <div className="space-y-6 h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden h-full flex flex-col"
                >
                  <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
                    <Shield size={20} className="text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Security & Password
                    </h3>
                  </div>

                  <form onSubmit={handleChangePassword} className="p-6 space-y-5 flex-1 flex flex-col">
                    <div className="flex-1 space-y-5">
                      {/* Current Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Current Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, currentPassword: e.target.value })
                            }
                            className={`w-full pl-10 pr-10 py-2.5 border ${passwordErrors.currentPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                              } rounded-xl outline-none focus:ring-2 focus:border-transparent transition`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          >
                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                            className={`w-full pl-10 pr-10 py-2.5 border ${passwordErrors.newPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                              } rounded-xl outline-none focus:ring-2 focus:border-transparent transition`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          >
                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {passwordData.newPassword && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 rounded-full ${strengthInfo?.bgColor || "bg-slate-200"
                                    }`}
                                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                />
                              </div>
                              {strengthInfo && (
                                <span className={`text-xs font-medium ${strengthInfo.color}`}>
                                  {strengthInfo.text}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              Use 8+ characters with uppercase, lowercase, number, and special character
                            </p>
                          </div>
                        )}

                        {passwordErrors.newPassword && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {passwordErrors.newPassword}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                            className={`w-full pl-10 pr-10 py-2.5 border ${passwordErrors.confirmPassword ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500"
                              } rounded-xl outline-none focus:ring-2 focus:border-transparent transition`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                          >
                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Password Match Indicator */}
                        {passwordData.confirmPassword && passwordData.newPassword && (
                          <div className="mt-1">
                            {isPasswordMatch ? (
                              <p className="text-xs text-green-500 flex items-center gap-1">
                                <CheckCircle size={12} /> Passwords match
                              </p>
                            ) : (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <XCircle size={12} /> Passwords do not match
                              </p>
                            )}
                          </div>
                        )}

                        {passwordErrors.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {passwordErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100 mt-4">
                      <button
                        type="submit"
                        disabled={loadingPassword}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loadingPassword ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Key size={18} />
                        )}
                        Update Password
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}