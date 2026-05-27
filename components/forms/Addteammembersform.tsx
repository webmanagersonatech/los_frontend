// components/forms/AddTeamMember.tsx
import { createTeamMember, updateTeamMember, getTeamMemberById } from "../../api/lib/request/teammemberRequest";
import toast from "react-hot-toast";

import { useState, useRef, useEffect } from "react";
import {
    UserPlus,
    Mail,
    Phone,
    Briefcase,
    Camera,
    X,
    Loader,
    Upload,
} from "lucide-react";


interface AddTeamMemberProps {
    memberId?: string;
    onClose: () => void;
    onSubmit?: (data: AddTeamMemberFormData) => void;
}

export interface AddTeamMemberFormData {
    fullName: string;
    email: string;
    phone: string;
    role: string;
    photoBase64: string;
}

export default function AddTeamMember({
    memberId,
    onClose,
    onSubmit,
}: AddTeamMemberProps) {
    const [formData, setFormData] = useState<AddTeamMemberFormData>({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        photoBase64: "",
    });

    const [photoPreview, setPhotoPreview] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFetching, setIsFetching] =
        useState(false);
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileSelect = async (file: File) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload a valid image file (JPEG, PNG, WEBP)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        try {
            const base64 = await convertToBase64(file);
            setPhotoPreview(base64);
            setFormData({
                ...formData,
                photoBase64: base64,
            });
            toast.success("Photo uploaded successfully");
        } catch (error) {
            console.error("Error converting to base64:", error);
            toast.error("Failed to upload image");
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const fetchMemberDetails = async () => {

        try {

            setIsFetching(true);

            const response:any =
                await getTeamMemberById(memberId!);

            const member =
                response?.data || response;

            setFormData({
                fullName:
                    member.fullName || "",

                email:
                    member.email || "",

                phone:
                    member.phone || "",

                role:
                    member.role || "",

                photoBase64:
                    member.photoBase64 || "",
            });

            setPhotoPreview(
                member.photoBase64 || ""
            );

        } catch (error) {

            console.log(error);

            toast.error(
                "Failed to fetch member details"
            );

        } finally {

            setIsFetching(false);
        }
    };
    useEffect(() => {
        if (!memberId) return;
        fetchMemberDetails();
    }, [memberId]);

    const removePhoto = () => {
        setPhotoPreview("");
        setFormData({
            ...formData,
            photoBase64: "",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.success("Photo removed");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName.trim() || !formData.email.trim() || !formData.role.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                role: formData.role.trim(),
                photoBase64: formData.photoBase64,
            };

            const response = memberId
                ? await updateTeamMember(memberId, payload)
                : await createTeamMember(payload);
            toast.success(
                memberId
                    ? "Team member updated successfully!"
                    : "Team member added successfully!"
            );

            if (onSubmit) {
                onSubmit(formData);
            }

            onClose();


        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.message || error?.response?.data?.message || "Failed to create team member",
                {
                    duration: 4000,
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-16">

                <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />

                <p className="mt-4 text-sm text-slate-500">
                    Fetching member details...
                </p>
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload Section */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                    Profile Photo <span className="text-slate-400">(Optional)</span>
                </label>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={onFileChange}
                    className="hidden"
                />

                {!photoPreview ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={`
                            relative w-full rounded-xl border-2 border-dashed 
                            transition-all duration-200 cursor-pointer
                            ${isDragging
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                            }
                        `}
                    >
                        <div className="flex flex-col items-center justify-center py-4 px-4">
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center mb-2
                                transition-all duration-200
                                ${isDragging
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "bg-slate-100 text-slate-400"
                                }
                            `}>
                                <Upload className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-medium text-slate-700">
                                Click or drag to upload
                            </p>
                            <p className="text-[11px] text-slate-500">
                                PNG, JPG, WEBP (Max 5MB)
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="relative inline-block">
                            <div className="w-20 h-20 rounded-xl overflow-hidden ring-2 ring-indigo-100">
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -top-2 -right-2 flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1 bg-white rounded-full shadow-md hover:bg-slate-50 transition border border-slate-200"
                                >
                                    <Camera size={12} className="text-indigo-600" />
                                </button>
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="p-1 bg-white rounded-full shadow-md hover:bg-red-50 transition border border-red-200"
                                >
                                    <X size={12} className="text-red-500" />
                                </button>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Click camera to change
                        </p>
                    </div>
                )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                    Email <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="email"
                        name="email"
                        placeholder="member@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                    Phone
                </label>
                <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Enter 10 digit number"
                        value={formData.phone}
                        onChange={(e) => {

                            const value =
                                e.target.value
                                    .replace(/\D/g, "") // numbers only
                                    .slice(0, 10); // max 10 digits

                            setFormData({
                                ...formData,
                                phone: value,
                            });
                        }}
                        maxLength={10}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                    Role <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        name="role"
                        placeholder="e.g., Frontend Developer"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting
                        ? memberId
                            ? "Updating..."
                            : "Adding..."
                        : memberId
                            ? "Update Member"
                            : "Add Member"}
                </button>
            </div>
        </form>
    );
}