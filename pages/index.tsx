// pages/login.tsx or app/login/page.tsx
import { useState, useCallback, useEffect } from "react";
import {
  Shield, Sparkles, Eye, EyeOff, Mail, Lock, ArrowRight,
  Globe, TrendingUp, Users, Award, CheckCircle,
  AlertCircle, Building2, LineChart
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { loginRequest } from "../api/lib/request/authRequest";
import CryptoJS from "crypto-js";
import toast, { Toaster } from 'react-hot-toast';

// Types
interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

interface StatItem {
  icon: typeof Users;
  value: string;
  label: string;
  description?: string;
}

// Constants
const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY || "sonacassecretkey@2025";
const DEMO_CREDENTIALS = {
  email: "demo@leadershiptech.com",
  password: "demo123"
};

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Stats data
  const stats: StatItem[] = [
    { icon: Users, value: "10,000+", label: "Active Users", description: "Trusted by leaders worldwide" },
    { icon: TrendingUp, value: "99.9%", label: "Uptime", description: "Enterprise-grade reliability" },
    { icon: Award, value: "50+", label: "Enterprise Clients", description: "Including Fortune 500 companies" },
  ];

  // Features data
  const features = [
    { icon: Sparkles, label: "AI Insights", color: "text-blue-500" },
    { icon: LineChart, label: "Predictive Analytics", color: "text-green-500" },
    { icon: Globe, label: "Real-time Sync", color: "text-indigo-500" },
    { icon: Shield, label: "Enterprise Security", color: "text-purple-500" },
    { icon: Building2, label: "Team Collaboration", color: "text-pink-500" },
    { icon: CheckCircle, label: "Automated Workflows", color: "text-emerald-500" },
  ];


  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if (token) {
  //     router.replace("/dashboard");
  //   }
  // }, [router]);

  // Handle input validation
  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "email":
        if (!value) return "Email is required";
        if (!validateEmail(value)) return "Please enter a valid email address";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (!validatePassword(value)) return "Password must be at least 6 characters";
        return "";
      default:
        return "";
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value as string);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Handle field blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { email, password } = formData;

    // Validate all fields
    const newErrors: ValidationErrors = {};
    let hasError = false;

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'rememberMe') {
        const error = validateField(key, value as string);
        if (error) {
          newErrors[key as keyof ValidationErrors] = error;
          hasError = true;
        }
      }
    });

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (hasError) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      // Encrypt password
      const encryptedPassword = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();

      // API request
      const response = await loginRequest(email, encryptedPassword);

      if (response?.token) {

        localStorage.setItem("token", response.token);


        toast.success("Login successful! Redirecting to dashboard...");

        // Add small delay for better UX
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {

      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please check your credentials and try again.";

      toast.error(errorMessage);

      // Clear password on error for security
      setFormData(prev => ({ ...prev, password: "" }));
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, validateField, router]);

  // Fill demo credentials
  const fillDemoCredentials = useCallback(() => {
    setFormData({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
      rememberMe: false,
    });
    setTouched({});
    setErrors({});
    toast.success("Demo credentials filled!");
  }, []);

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Background Gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-slate-800" />

      {/* Animated Gradient Orbs */}
      <div className="fixed top-20 -left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="fixed bottom-20 -right-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />

      {/* Left Section - Branding & Stats */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105">
                <Shield size={24} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-blue-600 animate-ping opacity-20" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                LeadershipOS
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wide font-medium">
                ENTERPRISE OPERATIONS PLATFORM
              </p>
            </div>
          </div>

          {/* Hero Message */}
          <div className="mt-16 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <Sparkles size={14} />
                AI-Powered Leadership
              </span>
            </div>
            <h2 className="text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Lead Smarter,
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">Not Harder</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
              Transform your leadership operations with AI-powered insights, real-time analytics, and collaborative tools that drive results.
            </p>

            {/* Feature list */}
            <div className="flex flex-wrap gap-3 pt-4">
              {features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                  <feature.icon size={12} className={feature.color} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="pt-16 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center group">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:scale-110 transition-transform">
                      <stat.icon size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</p>
                  {stat.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-500 dark:text-gray-500">
          <p>© 2024 LeadershipOS. All rights reserved. | v2.0.0</p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-md">
          {/* Glass Card */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 md:p-10 transition-all duration-300 hover:shadow-3xl">
            {/* Mobile Logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    LeadershipOS
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 tracking-wide">ENTERPRISE</p>
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Sign in to access your leadership dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black z-10"
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border transition-all duration-200 
                      ${errors.email && touched.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200/50 dark:border-gray-700/50 focus:border-blue-500 focus:ring-blue-500/20'
                      } focus:ring-2 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="claire@leadershiptech.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && touched.email && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1">
                    <AlertCircle size={12} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black z-10" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border transition-all duration-200
                      ${errors.password && touched.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200/50 dark:border-gray-700/50 focus:border-blue-500 focus:ring-blue-500/20'
                      } focus:ring-2 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1">
                    <AlertCircle size={12} />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>

            {/* Sign Up Link */}
            {/* <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center gap-1 group">
                  Start free trial
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div> */}

            {/* Features Grid */}
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-3">
                {features.slice(3, 6).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 justify-center px-3 py-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <feature.icon size={14} className={feature.color} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;