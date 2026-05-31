// pages/meetings/[id].tsx
import DashboardLayout from "../../layouts/DashboardLayout";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    Calendar,
    Clock,
    Users,
    MessageSquare,
    CheckCircle,
    Circle,
    RefreshCw,
    ArrowLeft,
    Loader,
    AlertCircle,
    Mail,
    Phone,
    User,
    Info,
    ListChecks,
    FileText,
    Edit3
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getMeetingById, updateReMeeting } from "../../api/lib/request/meetingRequest";
import toast from "react-hot-toast";
import ReMeetingModal from "../../components/ReMeetingModal";

// Helper functions
const formatDate = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getMeetingStatus = (dateTime: string) => {
    const meetingDate = new Date(dateTime);
    const now = new Date();

    if (meetingDate > now) {
        return { label: "Upcoming", color: "text-blue-600 bg-blue-50" };
    } else if (meetingDate < now) {
        return { label: "Past", color: "text-gray-600 bg-gray-50" };
    } else {
        return { label: "Ongoing", color: "text-green-600 bg-green-50" };
    }
};

export default function MeetingDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mainTab, setMainTab] = useState<"general" | "sessions">("general");
    const [activeSessionTab, setActiveSessionTab] = useState(0);
    const [activeTeamTab, setActiveTeamTab] = useState(0);
    
    // Session Edit Modal States
    const [sessionEditModalOpen, setSessionEditModalOpen] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [selectedReMeetingId, setSelectedReMeetingId] = useState<string | null>(null);

    const fetchMeetingDetails = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const response: any = await getMeetingById(id as string);
            const meetingData = response?.data || response;
            setMeeting(meetingData);
        } catch (err: any) {
            console.error("Error fetching meeting:", err);
            setError(err.message || "Failed to fetch meeting details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchMeetingDetails();
        }
    }, [id, fetchMeetingDetails]);

    const handleBack = () => {
        router.back();
    };

    const handleEditSession = (meetingId: string, reMeetingId: string) => {
        setSelectedMeetingId(meetingId);
        setSelectedReMeetingId(reMeetingId);
        setSessionEditModalOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 flex justify-center py-20">
                    <Loader size={32} className="animate-spin text-indigo-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !meeting) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
                        <p className="text-red-600 text-sm">{error || "Meeting not found"}</p>
                        <button onClick={handleBack} className="mt-3 text-indigo-600 text-sm">
                            ← Go Back
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const status = getMeetingStatus(meeting.dateTime);
    const reMeetings = meeting.reMeetings || [];
    const teams = meeting.teams || [];
    const hasFollowups = reMeetings.length > 0;

    return (
        <>
            <Head>
                <title>{meeting.meetingTitle} | Meeting Details</title>
            </Head>

            <DashboardLayout>
                <div className="p-6  mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="mb-4 flex items-center gap-1 text-gray-600 hover:text-indigo-600 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    {/* Meeting Header */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <MessageSquare size={22} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        {meeting.meetingTitle}
                                    </h1>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono mb-2">
                                    ID: {meeting.meetingId}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {meeting.description || "No description"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Tabs */}
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="border-b border-gray-200 px-4">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setMainTab("general")}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                                        mainTab === "general"
                                            ? "border-indigo-500 text-indigo-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <Info size={14} />
                                    General Details
                                </button>
                                
                                {hasFollowups && (
                                    <button
                                        onClick={() => setMainTab("sessions")}
                                        className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                                            mainTab === "sessions"
                                                ? "border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        <ListChecks size={14} />
                                        Session Details
                                        <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">
                                            {reMeetings.length}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* General Details Tab */}
                        {mainTab === "general" && (
                            <div className="p-4 space-y-5">
                                {/* Meeting Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">Date & Time</span>
                                        </div>
                                        <p className="text-sm text-gray-800">
                                            {formatDate(meeting.dateTime)} at {formatTime(meeting.dateTime)}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                                            <Users size={14} />
                                            <span className="text-xs font-medium">Teams</span>
                                        </div>
                                        <p className="text-sm text-gray-800">
                                            {teams.length} team(s) assigned
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                                            <RefreshCw size={14} />
                                            <span className="text-xs font-medium">Follow-ups</span>
                                        </div>
                                        <p className="text-sm text-gray-800">
                                            {reMeetings.length} session(s)
                                        </p>
                                    </div>
                                </div>

                                {/* Teams Section */}
                                {teams.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                            <Users size={14} />
                                            Assigned Teams
                                        </h3>
                                        
                                        <div className="bg-gray-50 rounded-lg">
                                            <div className="border-b border-gray-200 px-4">
                                                <div className="flex gap-1 overflow-x-auto">
                                                    {teams.map((team: any, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setActiveTeamTab(idx)}
                                                            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                                                activeTeamTab === idx
                                                                    ? "border-indigo-500 text-indigo-600"
                                                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                                            }`}
                                                        >
                                                            {team.teamName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                {teams.map((team: any, idx: number) => (
                                                    <div key={idx} className={activeTeamTab === idx ? "block" : "hidden"}>
                                                        <div className="flex items-start gap-4">
                                                            {team.teamLead?.photoBase64 ? (
                                                                <img
                                                                    src={team.teamLead.photoBase64}
                                                                    alt={team.teamLead.fullName}
                                                                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <User size={28} className="text-gray-400" />
                                                                </div>
                                                            )}

                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-gray-900">
                                                                    {team.teamLead?.fullName || "N/A"}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 mb-2">
                                                                    Team Lead • {team.teamType || "N/A"}
                                                                </p>
                                                                
                                                                <div className="space-y-1 mt-3">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Mail size={14} className="text-gray-400" />
                                                                        <span className="text-gray-600">
                                                                            {team.teamLead?.email || "No email"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Phone size={14} className="text-gray-400" />
                                                                        <span className="text-gray-600">
                                                                            {team.teamLead?.phone || "No phone"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Users size={14} className="text-gray-400" />
                                                                        <span className="text-gray-600">
                                                                            Role: {team.teamLead?.role || "N/A"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline Info */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <Clock size={14} />
                                        Timeline
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Created</p>
                                            <p className="text-sm text-gray-800 mt-1">
                                                {new Date(meeting.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500">Last Updated</p>
                                            <p className="text-sm text-gray-800 mt-1">
                                                {new Date(meeting.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Session Details Tab */}
                        {mainTab === "sessions" && hasFollowups && (
                            <div>
                                {/* Session Sub-tabs */}
                                <div className="border-b border-gray-200 px-4">
                                    <div className="flex gap-1 overflow-x-auto">
                                        {reMeetings.map((session: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveSessionTab(idx)}
                                                className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                                                    activeSessionTab === idx
                                                        ? "border-indigo-500 text-indigo-600"
                                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                            >
                                                <span>Session {idx + 1}</span>
                                                {session.completed ? (
                                                    <CheckCircle size={12} className="text-green-500" />
                                                ) : (
                                                    <Circle size={12} className="text-yellow-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Session Content */}
                                <div className="p-4">
                                    {reMeetings.map((session: any, idx: number) => (
                                        <div key={idx} className={activeSessionTab === idx ? "block" : "hidden"}>
                                            {/* Header with Edit Button */}
                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {session.completed ? (
                                                            <CheckCircle size={18} className="text-green-500" />
                                                        ) : (
                                                            <Circle size={18} className="text-yellow-500" />
                                                        )}
                                                        <span className={`text-sm font-medium ${session.completed ? "text-green-700" : "text-yellow-700"}`}>
                                                            {session.completed ? "Completed" : "Pending"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleEditSession(meeting._id, session._id)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition"
                                                >
                                                    <Edit3 size={12} />
                                                    Edit Session
                                                </button>
                                            </div>

                                            {/* Date & Time */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                    <Calendar size={14} />
                                                    <span className="text-xs font-medium">Date & Time</span>
                                                </div>
                                                <p className="text-sm text-gray-800">
                                                    {formatDateTime(session.dateTime)}
                                                </p>
                                            </div>

                                            {/* Description */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                    <FileText size={14} />
                                                    <span className="text-xs font-medium">Description</span>
                                                </div>
                                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                                    {session.description || "No description provided"}
                                                </p>
                                            </div>

                                            {/* Notes */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                    <MessageSquare size={14} />
                                                    <span className="text-xs font-medium">Notes</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    {session.notes ? (
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                            {session.notes}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">
                                                            No notes added yet
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Metadata */}
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                                <div>
                                                    <p className="text-xs text-gray-400">Created</p>
                                                    <p className="text-xs text-gray-600">
                                                        {new Date(session.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Last Updated</p>
                                                    <p className="text-xs text-gray-600">
                                                        {new Date(session.updatedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session Edit Modal */}
                <ReMeetingModal
                    isOpen={sessionEditModalOpen}
                    onClose={() => {
                        setSessionEditModalOpen(false);
                        setSelectedMeetingId(null);
                        setSelectedReMeetingId(null);
                    }}
                    meetingId={selectedMeetingId || ""}
                    reMeetingId={selectedReMeetingId || ""}
                    onUpdate={fetchMeetingDetails}
                />
            </DashboardLayout>
        </>
    );
}