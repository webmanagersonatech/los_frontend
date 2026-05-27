// components/forms/AddWorkForm.tsx
import toast, { Toaster } from 'react-hot-toast';
import Modal from "../../components/Modal";
import { useState, useRef, useEffect } from "react";
import { getAllTeams } from '../../api/lib/request/teamsRequest';
import { createWork, Work, getWorkById, updateWork } from '../../api/lib/request/worksRequests';
import AddTeamForm from './Addteams';

import {
    Briefcase,
    Calendar,
    Clock,
    Flag,
    FileText,
    Users,
    ChevronDown,
    Check,
    AlertCircle,
    X,
    User,
    Plus,
    Loader,
} from "lucide-react";

interface AddWorkFormProps {
    workId?: string;
    onClose: () => void;
    defaultDeadline?: Date;
    onSubmit?: (data: AddWorkFormData) => void;
}

export interface AddWorkFormData {
    workTitle: string;
    assignToTeamIds: string[];
    deadlineDateTime: string; // Changed to single datetime string
    priority: 'low' | 'medium' | 'high' | 'very-high';
    description: string;
}

interface TeamLead {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    photoBase64?: string;
    teamMemberId: string;
}

interface TeamOption {
    id: string;
    name: string;
    teamType: string;
    teamLead: TeamLead | null;
    memberCount?: number;
}

// Priority options with colors and icons
const priorityOptions = [
    { value: 'low', label: 'Low', color: 'green', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'blue', icon: '🔵' },
    { value: 'high', label: 'High', color: 'orange', icon: '🟠' },
    { value: 'very-high', label: 'Very High', color: 'red', icon: '🔴' }
];

const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
        'low': 'bg-green-50 text-green-700 border-green-200',
        'medium': 'bg-blue-50 text-blue-700 border-blue-200',
        'high': 'bg-orange-50 text-orange-700 border-orange-200',
        'very-high': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[priority] || 'bg-slate-50 text-slate-700 border-slate-200';
};

export default function AddWorkForm({ workId, defaultDeadline, onClose, onSubmit }: AddWorkFormProps) {
    const [formData, setFormData] = useState<AddWorkFormData>({
        workTitle: "",
        assignToTeamIds: [],
        deadlineDateTime: "", // Changed to single field
        priority: "medium",
        description: "",
    });

    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const teamDropdownRef = useRef<HTMLDivElement>(null);
    const priorityDropdownRef = useRef<HTMLDivElement>(null);
    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [loadingWork, setLoadingWork] =
        useState(false);
    // Set mounted state to avoid hydration issues
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Helper function to get photo URL
    const getPhotoUrl = (photoBase64?: string) => {
        if (photoBase64 && photoBase64.startsWith('data:image')) {
            return photoBase64;
        }
        return null;
    };


    useEffect(() => {

        if (!workId) return;

        const fetchWork = async () => {

            try {

                setLoadingWork(true);

                const res: any =
                    await getWorkById(
                        workId
                    );

                const work =
                    res.data;

                setFormData({
                    workTitle:
                        work.workTitle || "",

                    assignToTeamIds:
                        work.assignToTeamIds || [],

                    deadlineDateTime:
                        work.deadline
                            ? new Date(
                                work.deadline
                            )
                                .toISOString()
                                .slice(0, 16)
                            : "",

                    priority:
                        work.priority ||
                        "medium",

                    description:
                        work.description ||
                        "",
                });

            } catch (error: any) {

                console.error(error);

                toast.error(
                    error?.message ||
                    "Failed to load work"
                );

            } finally {

                setLoadingWork(false);
            }
        };

        fetchWork();

    }, [workId]);


    // Fetch teams from backend
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoadingTeams(true);
                const res = await getAllTeams();
                console.log(res, "kkk");

                const formattedTeams: TeamOption[] = res.data.map((team: any) => ({
                    id: String(team.teamId),
                    name: team.teamName,
                    teamType: team.teamType,
                    teamLead: team.teamLead || null,
                    memberCount: team.memberIds?.length || 0,
                }));

                setTeams(formattedTeams);
            } catch (err: any) {
                console.error("Failed to fetch teams:", err);
                toast.error(err?.message || "Failed to load teams");
                setTeams([]);
            } finally {
                setLoadingTeams(false);
            }
        };

        fetchTeams();
    }, []);

    // Set default selected date from calendar
    useEffect(() => {
        if (defaultDeadline && !workId) {
            const localDate = new Date(defaultDeadline);

            // convert for datetime-local input
            localDate.setMinutes(
                localDate.getMinutes() - localDate.getTimezoneOffset()
            );

            setFormData((prev) => ({
                ...prev,
                deadlineDateTime: localDate.toISOString().slice(0, 16),
            }));
        }
    }, [defaultDeadline, workId]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
                setIsTeamDropdownOpen(false);
            }
            if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
                setIsPriorityDropdownOpen(false);
            }
        };

        if (isMounted) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isMounted]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData({ ...formData, description: e.target.value });
    };

    const handleTeamToggle = (teamId: string) => {
        const selectedTeam = teams.find(t => t.id === teamId);
        if (formData.assignToTeamIds.includes(teamId)) {
            setFormData({
                ...formData,
                assignToTeamIds: formData.assignToTeamIds.filter(id => id !== teamId)
            });
            toast.error(`Removed ${selectedTeam?.name}`);
        } else {
            setFormData({
                ...formData,
                assignToTeamIds: [...formData.assignToTeamIds, teamId]
            });
            toast.success(`Added ${selectedTeam?.name}`);
        }
    };

    const removeTeam = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        setFormData({
            ...formData,
            assignToTeamIds: formData.assignToTeamIds.filter(id => id !== teamId)
        });
        toast.error(`Removed ${team?.name}`);
    };

    const handlePrioritySelect = (priority: AddWorkFormData['priority']) => {
        setFormData({ ...formData, priority });
        setIsPriorityDropdownOpen(false);
        const priorityOption = priorityOptions.find(p => p.value === priority);
        toast.success(`Priority set to ${priorityOption?.label}`);
    };

    const getSelectedTeams = () => {
        return teams.filter(t => formData.assignToTeamIds.includes(t.id));
    };


    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.teamType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.teamLead?.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const validateForm = () => {
        if (!formData.workTitle.trim()) {
            toast.error('Please enter a work title');
            return false;
        }

        if (formData.assignToTeamIds.length === 0) {
            toast.error('Please select at least one team to assign this work');
            return false;
        }

        if (!formData.deadlineDateTime) {
            toast.error('Please select a deadline date and time');
            return false;
        }

        // Validate that deadline is not in the past
        const deadlineDateTime = new Date(formData.deadlineDateTime);
        if (deadlineDateTime < new Date()) {
            toast.error('Deadline cannot be in the past');
            return false;
        }

        if (!formData.description.trim()) {
            toast.error('Please enter a description');
            return false;
        }

        return true;
    };

    // In your handleSubmit function, update the payload creation:

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {

            setSubmitting(true);

            const payload: Work = {
                workTitle: formData.workTitle,

                assignToTeamIds:
                    formData.assignToTeamIds,

                deadline: new Date(
                    formData.deadlineDateTime
                ).toISOString(),

                priority:
                    formData.priority === "very-high"
                        ? "high"
                        : formData.priority,

                description:
                    formData.description,

                status: "pending",
            };

            let response;

            // UPDATE WORK
            if (workId) {

                response =
                    await updateWork(
                        workId,
                        payload
                    );

                toast.success(
                    "Work updated successfully!"
                );

            }

            // CREATE WORK
            else {

                response =
                    await createWork(
                        payload
                    );

                toast.success(
                    `Work "${formData.workTitle}" created successfully!`
                );
            }

            // OPTIONAL CALLBACK
            if (onSubmit) {
                onSubmit(formData);
            }

            // RESET FORM
            setFormData({
                workTitle: "",
                assignToTeamIds: [],
                deadlineDateTime: "",
                priority: "medium",
                description: "",
            });

            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.message ||
                (workId
                    ? "Failed to update work"
                    : "Failed to create work")
            );

        } finally {

            setSubmitting(false);
        }
    };

    if (loadingTeams) {
        return (
            <div className="space-y-5">
                <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500">Loading teams...</p>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (loadingWork) {
        return <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
                <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />

                <p className="text-sm text-slate-500">
                    Loading team details...
                </p>
            </div>
        </div>
    }

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Work Title */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Work Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            name="workTitle"
                            placeholder="e.g., Develop Dashboard, Design Homepage, Fix Bug #123"
                            value={formData.workTitle}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Assign to Multiple Teams */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Assign to Teams <span className="text-red-500">*</span>
                    </label>

                    {/* Selected Teams Tags */}
                    {getSelectedTeams().length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {getSelectedTeams().map((team) => (
                                <div
                                    key={team.id}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-sm"
                                >
                                    <span className="text-indigo-700 text-xs font-medium">{team.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeTeam(team.id)}
                                        className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={12} className="text-indigo-600" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative" ref={teamDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                            className={`w-full rounded-lg border bg-white py-2 px-3 text-sm outline-none transition-all duration-200 flex items-center justify-between hover:border-slate-300 ${formData.assignToTeamIds.length > 0
                                ? 'border-indigo-300 ring-1 ring-indigo-200'
                                : 'border-slate-200'
                                } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
                        >
                            <div className="flex items-center gap-2">
                                <Users size={14} className={formData.assignToTeamIds.length > 0 ? 'text-indigo-500' : 'text-slate-400'} />
                                {formData.assignToTeamIds.length > 0 ? (
                                    <span className="text-slate-700">
                                        {formData.assignToTeamIds.length} team(s) selected
                                    </span>
                                ) : (
                                    <span className="text-slate-500">Select teams</span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isTeamDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isTeamDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {/* Search Input */}
                                <div className="p-2 border-b border-slate-100">
                                    <input
                                        type="text"
                                        placeholder="Search teams..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                    {filteredTeams.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-sm text-slate-500">
                                            No teams found
                                        </div>
                                    ) : (
                                        filteredTeams.map((team) => (
                                            <button
                                                key={team.id}
                                                type="button"
                                                onClick={() => handleTeamToggle(team.id)}
                                                className={`w-full px-3 py-3 text-left hover:bg-slate-50 transition-colors ${formData.assignToTeamIds.includes(team.id) ? 'bg-indigo-50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Team Lead Photo */}
                                                    <div className="flex-shrink-0">
                                                        {team.teamLead?.photoBase64 ? (
                                                            <img
                                                                src={getPhotoUrl(team.teamLead.photoBase64) ?? undefined}
                                                                alt={team.teamLead.fullName}
                                                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                                                <User size={18} className="text-indigo-600" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Team and Lead Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {team.name}
                                                            </p>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                                                {team.teamType}
                                                            </span>
                                                        </div>

                                                        {team.teamLead && (
                                                            <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                                                Lead: {team.teamLead.fullName}
                                                            </p>
                                                        )}

                                                        {team.teamLead?.phone && (
                                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                                <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                                                                {team.teamLead.phone}
                                                            </p>
                                                        )}

                                                        {team.memberCount && team.memberCount > 0 && (
                                                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                <Users size={10} />
                                                                {team.memberCount} members
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Selection Checkbox Indicator */}
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-4 h-4 rounded border transition-colors ${formData.assignToTeamIds.includes(team.id)
                                                            ? 'bg-indigo-600 border-indigo-600'
                                                            : 'border-slate-300'
                                                            }`}>
                                                            {formData.assignToTeamIds.includes(team.id) && (
                                                                <Check size={12} className="text-white mt-0.5 ml-0.5" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Add New Team Button */}
                    <button
                        type="button"
                        onClick={() => setIsAddTeamOpen(true)}
                        className="mt-3 flex items-END
                         gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        <Plus size={16} />
                        Add New Team
                    </button>
                </div>



                {/* Deadline DateTime - Single field with datetime-local */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Deadline <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="datetime-local"
                            name="deadlineDateTime"
                            value={formData.deadlineDateTime}
                            onChange={handleChange}
                            // min={getMinDateTime()}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Select date and time for the work deadline
                    </p>
                </div>

                {/* Priority Dropdown */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={priorityDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                            className={`w-full rounded-lg border bg-white py-2 px-3 text-sm outline-none transition-all duration-200 flex items-center justify-between hover:border-slate-300 ${formData.priority
                                ? 'border-indigo-300 ring-1 ring-indigo-200'
                                : 'border-slate-200'
                                } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
                        >
                            <div className="flex items-center gap-2">
                                <Flag size={14} className={formData.priority ? 'text-indigo-500' : 'text-slate-400'} />
                                {formData.priority ? (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                                        {priorityOptions.find(p => p.value === formData.priority)?.label}
                                    </span>
                                ) : (
                                    <span className="text-slate-500">Select priority</span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isPriorityDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isPriorityDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="py-1">
                                    {priorityOptions.map((priority) => (
                                        <button
                                            key={priority.value}
                                            type="button"
                                            onClick={() => handlePrioritySelect(priority.value as AddWorkFormData['priority'])}
                                            className={`w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${formData.priority === priority.value ? 'bg-indigo-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{priority.icon}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(priority.value)}`}>
                                                    {priority.label}
                                                </span>
                                            </div>
                                            {formData.priority === priority.value && (
                                                <Check size={14} className="text-indigo-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description with Normal Textarea */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <textarea
                            name="description"
                            rows={6}
                            placeholder="Describe the work details, requirements, acceptance criteria..."
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 resize-y"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Provide detailed information about the work to be done
                    </p>
                </div>

                {/* Deadline Warning */}
                {formData.deadlineDateTime && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-amber-600" />
                            <span className="text-xs text-amber-700">
                                Deadline: {new Date(formData.deadlineDateTime).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader size={16} className="animate-spin" />
                                {workId ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            workId ? "Update Work" : "Create Work"
                        )}
                    </button>
                </div>

            </form>

            {/* Add Team Modal */}
            <Modal
                isOpen={isAddTeamOpen}
                onClose={() => setIsAddTeamOpen(false)}
                title="Create New Team"
            >
                <AddTeamForm
                    onClose={() => {
                        setIsAddTeamOpen(false);

                        // OPTIONAL: refresh teams after creating
                        const fetchTeams = async () => {
                            try {
                                const res = await getAllTeams();

                                const formattedTeams: TeamOption[] = res.data.map((team: any) => ({
                                    id: String(team.teamId),
                                    name: team.teamName,
                                    teamType: team.teamType,
                                    teamLead: team.teamLead || null,
                                    memberCount: team.memberIds?.length || 0,
                                }));

                                setTeams(formattedTeams);
                            } catch (err) {
                                console.error(err);
                            }
                        };

                        fetchTeams();
                    }}
                />
            </Modal>
        </>
    );
}