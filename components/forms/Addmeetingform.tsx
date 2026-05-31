// components/forms/AddMeetingForm.tsx
import toast, { Toaster } from 'react-hot-toast';
import Modal from "../../components/Modal";
import { useState, useRef, useEffect } from "react";
import { getAllTeams } from '../../api/lib/request/teamsRequest'
import { createMeeting, getMeetingById, updateMeeting } from '../../api/lib/request/meetingRequest';
import AddTeamForm from './Addteams';

import {
    Calendar,
    Clock,
    FileText,
    Users,
    ChevronDown,
    Check,
    X,
    User,
    Plus,
    Loader,
    MessageSquare,
    Circle,
    CheckCircle,
    RefreshCw
} from "lucide-react";

interface AddMeetingFormProps {
    meetingId?: string;
    onClose: () => void;
    defaultDateTime?: Date;
    onSubmit?: (data: AddMeetingFormData) => void;
}

export interface AddMeetingFormData {
    meetingTitle: string;
    assignToTeamIds: string[];
    dateTime: string;
    description: string;
    notes?: string;
    status?: "pending" | "in-progress" | "completed";
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

export default function AddMeetingForm({ meetingId, defaultDateTime, onClose, onSubmit }: AddMeetingFormProps) {
    const [formData, setFormData] = useState<AddMeetingFormData>({
        meetingTitle: "",
        assignToTeamIds: [],
        dateTime: "",
        description: "",
        notes: "",
        status: "pending",
    });

    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const teamDropdownRef = useRef<HTMLDivElement>(null);
    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [loadingMeeting, setLoadingMeeting] = useState(false);
    const [originalDateTime, setOriginalDateTime] = useState<string | null>(null);

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

    // Fetch meeting data for edit mode
    useEffect(() => {
        if (!meetingId) return;

        const fetchMeeting = async () => {
            try {
                setLoadingMeeting(true);
                const res: any = await getMeetingById(meetingId);
                const meeting = res.data || res;

                setFormData({
                    meetingTitle: meeting.meetingTitle || "",
                    assignToTeamIds: meeting.assignToTeamIds || [],
                    dateTime: meeting.dateTime
                        ? new Date(meeting.dateTime).toISOString().slice(0, 16)
                        : "",
                    description: meeting.description || "",
                    notes: meeting.notes || "",
                    status: meeting.status || "pending",
                });

                // Store original date for comparison
                if (meeting.dateTime) {
                    setOriginalDateTime(meeting.dateTime);
                }
            } catch (error: any) {
                console.error(error);
                toast.error(error?.message || "Failed to load meeting");
            } finally {
                setLoadingMeeting(false);
            }
        };

        fetchMeeting();
    }, [meetingId]);

    // Fetch teams from backend
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoadingTeams(true);
                const res = await getAllTeams();

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
        if (defaultDateTime && !meetingId) {
            const localDate = new Date(defaultDateTime);

            // Convert for datetime-local input
            localDate.setMinutes(
                localDate.getMinutes() - localDate.getTimezoneOffset()
            );

            setFormData((prev) => ({
                ...prev,
                dateTime: localDate.toISOString().slice(0, 16),
            }));
        }
    }, [defaultDateTime, meetingId]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
                setIsTeamDropdownOpen(false);
            }
        };

        if (isMounted) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isMounted]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData({ ...formData, description: e.target.value });
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData({ ...formData, notes: e.target.value });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({
            ...formData,
            status: e.target.value as "pending" | "in-progress" | "completed"
        });
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

    const getSelectedTeams = () => {
        return teams.filter(t => formData.assignToTeamIds.includes(t.id));
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.teamType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.teamLead?.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const validateForm = () => {
        if (!formData.meetingTitle.trim()) {
            toast.error('Please enter a meeting title');
            return false;
        }

        if (formData.assignToTeamIds.length === 0) {
            toast.error('Please select at least one team to assign this meeting');
            return false;
        }

        if (!formData.dateTime) {
            toast.error('Please select a meeting date and time');
            return false;
        }

        // Validate date - cannot be in the past for NEW meetings
        const meetingDateTime = new Date(formData.dateTime);
        const now = new Date();

        if (!meetingId) {
            // For new meetings: cannot be in the past
            if (meetingDateTime < now) {
                toast.error('Meeting time cannot be in the past');
                return false;
            }
        } else {
            // For editing: can only change to future dates, or same day
            const originalDate = originalDateTime ? new Date(originalDateTime) : null;
            const isSameDay = originalDate &&
                meetingDateTime.toDateString() === originalDate.toDateString();

            // If trying to set to a past date that's not the original date
            if (meetingDateTime < now && !isSameDay) {
                toast.error('Cannot reschedule to a past date');
                return false;
            }
        }

        if (!formData.description.trim()) {
            toast.error('Please enter a description');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                meetingTitle: formData.meetingTitle,
                assignToTeamIds: formData.assignToTeamIds,
                dateTime: new Date(formData.dateTime).toISOString(),
                description: formData.description,
                notes: formData.notes || "",
                status: formData.status || "pending",
            };

            // UPDATE MEETING
            if (meetingId) {
                await updateMeeting(meetingId, payload);
                toast.success("Meeting updated successfully!");
            }
            // CREATE MEETING
            else {
                await createMeeting(payload);
                toast.success(`Meeting "${formData.meetingTitle}" created successfully!`);
            }

            // OPTIONAL CALLBACK
            if (onSubmit) {
                onSubmit(formData);
            }

            // RESET FORM
            setFormData({
                meetingTitle: "",
                assignToTeamIds: [],
                dateTime: "",
                description: "",
                notes: "",
                status: "pending",
            });

            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.message ||
                (meetingId
                    ? "Failed to update meeting"
                    : "Failed to create meeting")
            );
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = () => {
        switch (formData.status) {
            case "completed":
                return <CheckCircle size={14} className="text-green-500" />;
            case "in-progress":
                return <RefreshCw size={14} className="text-blue-500" />;
            default:
                return <Circle size={14} className="text-yellow-500" />;
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

    if (loadingMeeting) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-3">
                    <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                        Loading meeting details...
                    </p>
                </div>
            </div>
        );
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
                {/* Meeting Title */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Meeting Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            name="meetingTitle"
                            placeholder="e.g., Sprint Planning, Client Review, Team Sync"
                            value={formData.meetingTitle}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Meeting Status - Only show for edit mode */}
                {meetingId && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">
                            Meeting Status
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                {getStatusIcon()}
                            </div>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleStatusChange}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                            >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Track the overall progress of this meeting
                        </p>
                    </div>
                )}

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
                        className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        <Plus size={16} />
                        Add New Team
                    </button>
                </div>

                {/* Meeting Date & Time */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Meeting Date & Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="datetime-local"
                            name="dateTime"
                            value={formData.dateTime}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300"
                        />
                    </div>
                    {meetingId && originalDateTime && (
                        <p className="text-xs text-amber-600 mt-1">
                            Original date: {new Date(originalDateTime).toLocaleString()}
                        </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                        {meetingId
                            ? "You can reschedule to a future date"
                            : "Select the date and time for the meeting (cannot be in the past)"}
                    </p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <textarea
                            name="description"
                            rows={4}
                            placeholder="Describe the meeting agenda, objectives, discussion points..."
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 resize-y"
                        />
                    </div>
                </div>

                {/* Notes - Only show for edit mode */}
                {meetingId && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">
                            Meeting Notes
                        </label>
                        <div className="relative group">
                            <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <textarea
                                name="notes"
                                rows={3}
                                placeholder="Add any additional notes, action items, or important information..."
                                value={formData.notes}
                                onChange={handleNotesChange}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300 resize-y"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Add meeting notes, action items, or key takeaways
                        </p>
                    </div>
                )}

                {/* Meeting Time Warning */}
                {formData.dateTime && (
                    <div className={`rounded-lg p-2.5 animate-in slide-in-from-top-1 duration-200 ${meetingId && originalDateTime && new Date(formData.dateTime).toDateString() !== new Date(originalDateTime).toDateString()
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-blue-50 border border-blue-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className={meetingId && originalDateTime && new Date(formData.dateTime).toDateString() !== new Date(originalDateTime).toDateString() ? "text-amber-600" : "text-blue-600"} />
                            <span className={`text-xs ${meetingId && originalDateTime && new Date(formData.dateTime).toDateString() !== new Date(originalDateTime).toDateString() ? "text-amber-700" : "text-blue-700"}`}>
                                {meetingId && originalDateTime && new Date(formData.dateTime).toDateString() !== new Date(originalDateTime).toDateString()
                                    ? `Meeting rescheduled to: ${new Date(formData.dateTime).toLocaleString()}`
                                    : `Meeting scheduled for: ${new Date(formData.dateTime).toLocaleString()}`
                                }
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
                                {meetingId ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            meetingId ? "Update Meeting" : "Create Meeting"
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

                        // Refresh teams after creating
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