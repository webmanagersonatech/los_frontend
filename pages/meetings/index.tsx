import DashboardLayout from "../../layouts/DashboardLayout";
import { motion } from "framer-motion";
import Head from "next/head";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { useRouter } from "next/router";
import AddMeetingForm from "../../components/forms/Addmeetingform";
import ReMeetingModal from "../../components/ReMeetingModal";
import AddWorkForm from "../../components/forms/Addworkform";

import {
    getMeetings, deleteMeeting,
    Meeting,
    addReMeeting,
} from "../../api/lib/request/meetingRequest";
import ConfirmModal from "../../components/ConfirmModal";
import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Users,
    LayoutGrid,
    Table as TableIcon,
    Plus,
    Pencil,
    Trash2,
    Edit3,
    Eye,
    Calendar,
    Clock,
    RefreshCw,
    AlertCircle,
    Loader,
    CheckCircle,
    Circle,
    MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

// ========== REUSABLE COMPONENTS ==========

// Meeting Status Badge Component (based on reMeetings completion)
const MeetingStatusBadge = ({ reMeetings }: { reMeetings?: any[] }) => {
    if (!reMeetings || reMeetings.length === 0) {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                No Sessions
            </span>
        );
    }

    const completedCount = reMeetings.filter(m =>
        m.points?.every((p: any) => p.completed)
    ).length;

    const totalCount = reMeetings.length;

    if (completedCount === totalCount && totalCount > 0) {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                All Completed
            </span>
        );
    }

    if (completedCount > 0) {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                {completedCount}/{totalCount} Completed
            </span>
        );
    }

    return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            In Progress
        </span>
    );
};

// Search Input Component
const SearchInput = ({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}) => (
    <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 flex items-center gap-2 shadow-sm">
        <Search className="text-slate-400" size={16} />
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full outline-none bg-transparent text-sm"
        />
    </div>
);

// View Toggle Component
const ViewToggle = ({
    view,
    setView,
}: {
    view: "grid" | "table";
    setView: (view: "grid" | "table") => void;
}) => (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-all ${view === "grid"
                ? "bg-white shadow-sm text-indigo-600"
                : "text-slate-500"
                }`}
        >
            <LayoutGrid size={16} />
        </button>

        <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded-md transition-all ${view === "table"
                ? "bg-white shadow-sm text-indigo-600"
                : "text-slate-500"
                }`}
        >
            <TableIcon size={16} />
        </button>
    </div>
);

// ========== DATA TYPES ==========
interface FormattedMeeting extends Meeting {
    _id: string;
    meetingId: string;
    meetingTitle: string;
    work: any;
    description: string;
    status: string;
    assignToTeamIds: string[];
    dateTime: string;
    reMeetings?: any[];
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

// ========== MAIN COMPONENT ==========
export default function MeetingsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"grid" | "table">("table");
    const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
    const [meetings, setMeetings] = useState<FormattedMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<FormattedMeeting | null>(null);
    const [selectedMeetingTeamIds, setSelectedMeetingTeamIds] = useState<string[]>([]);
    const [sessionEditModalOpen, setSessionEditModalOpen] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [selectedReMeetingId, setSelectedReMeetingId] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [meetingToEdit, setMeetingToEdit] = useState<FormattedMeeting | null>(null);
    const [reMeetingModalOpen, setReMeetingModalOpen] = useState(false);
    const [isAddingReMeeting, setIsAddingReMeeting] = useState(false);
    // Add these with other state variables (around line 100)
    const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
    const [selectedMeetingForWork, setSelectedMeetingForWork] = useState<FormattedMeeting | null>(null);
    const [selectedReMeetingMeeting, setSelectedReMeetingMeeting] = useState<FormattedMeeting | null>(null);
    const [reMeetingData, setReMeetingData] = useState({
        dateTime: "",
        description: ""  // Changed from points array to single string
    });

    // Fetch meetings from API
    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getMeetings(
                currentPage,
                10,
                searchQuery
            );

            if (response?.meetings?.docs) {
                const formattedMeetings: FormattedMeeting[] = response.meetings.docs.map((meeting: any) => ({
                    _id: meeting._id,
                    meetingId: meeting.meetingId,
                    meetingTitle: meeting.meetingTitle,
                    work: meeting.work,
                    description: meeting.description || "",
                    assignToTeamIds: meeting.assignToTeamIds || [],
                    dateTime: meeting.dateTime,
                    reMeetings: meeting.reMeetings || [],
                    createdBy: meeting.createdBy,
                    status: meeting.status,
                    createdAt: meeting.createdAt,
                    updatedAt: meeting.updatedAt,
                }));

                setMeetings(formattedMeetings);
                setTotalPages(response.meetings.totalPages || 1);
                setTotalDocs(response.meetings.totalDocs || 0);
            } else {
                setMeetings([]);
                setTotalPages(1);
                setTotalDocs(0);
            }
        } catch (err: any) {
            console.error("Error fetching meetings:", err);
            setError(err.message || "Failed to fetch meetings");
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    // Delete meeting
    const confirmDelete = async () => {
        if (!selectedMeeting) return;

        try {
            setLoading(true);
            await deleteMeeting(selectedMeeting._id);
            toast.success("Meeting deleted successfully");
            setDeleteModalOpen(false);
            setSelectedMeeting(null);
            await fetchMeetings();
        } catch (err: any) {
            console.error("Delete Error:", err);
            toast.error(err?.message || "Failed to delete meeting");
        } finally {
            setLoading(false);
        }
    };



    // Add Re-meeting
    const handleAddReMeeting = async () => {
        if (!selectedReMeetingMeeting) return;

        if (!reMeetingData.dateTime || !reMeetingData.description.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setIsAddingReMeeting(true); // Disable button
            await addReMeeting(selectedReMeetingMeeting._id, {
                dateTime: reMeetingData.dateTime,
                description: reMeetingData.description,
                completed: false
            });
            toast.success("Re-meeting added successfully");
            setReMeetingModalOpen(false);
            setSelectedReMeetingMeeting(null);
            setReMeetingData({
                dateTime: "",
                description: ""
            });
            await fetchMeetings();
        } catch (err: any) {
            console.error("Add Re-meeting Error:", err);
            toast.error(err?.message || "Failed to add re-meeting");
        } finally {
            setIsAddingReMeeting(false); // Re-enable button
        }
    };

    // Add this function before the return statement
    const handleGenerateWork = (meeting: FormattedMeeting) => {
        setSelectedMeetingForWork(meeting);
        setSelectedMeetingTeamIds(meeting.assignToTeamIds || []);
        setIsAddWorkOpen(true);
    };

    const handleViewWork = (meeting: FormattedMeeting) => {
        // You can implement view work logic here
        router.push(`/works?meetingId=${meeting.meetingId}`);
    };
    // Handle Edit Session
    const handleEditSession = (meetingId: string, reMeetingId: string) => {
        setSelectedMeetingId(meetingId);
        setSelectedReMeetingId(reMeetingId);
        setSessionEditModalOpen(true);
    };

    const handleRefresh = () => {
        fetchMeetings();
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Fetch meetings when dependencies change
    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    // Helper function to format date and time
    const formatDateTime = (dateTimeString: string) => {
        return new Date(dateTimeString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateTimeString: string) => {
        return new Date(dateTimeString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (dateTimeString: string) => {
        return new Date(dateTimeString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Check if meeting is upcoming or past
    const getMeetingStatus = (dateTime: string) => {
        const meetingDate = new Date(dateTime);
        const now = new Date();

        if (meetingDate > now) {
            return { label: "Upcoming", className: "text-blue-600 bg-blue-50" };
        } else if (meetingDate < now) {
            return { label: "Past", className: "text-gray-600 bg-gray-50" };
        } else {
            return { label: "Ongoing", className: "text-green-600 bg-green-50" };
        }
    };


    const columns = [
        {
            header: "Meeting",
            key: "meetingTitle",
            render: (meeting: FormattedMeeting) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <MessageSquare size={18} className="text-indigo-600" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {meeting.meetingTitle}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                            {meeting.meetingId}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px] mt-0.5">
                            {meeting.description}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Date & Time",
            key: "dateTime",
            render: (meeting: FormattedMeeting) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-600">
                            {formatDate(meeting.dateTime)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">
                            {formatTime(meeting.dateTime)}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            header: "Status",
            key: "status",
            render: (meeting: FormattedMeeting) => {
                const scheduleStatus = getMeetingStatus(meeting.dateTime);
                // Get meeting's own status (pending, in-progress, completed)
                const meetingStatus = meeting.status || "pending";

                const getMeetingStatusBadge = () => {
                    switch (meetingStatus) {
                        case "completed":
                            return { label: "Completed", className: "bg-green-100 text-green-700" };
                        case "in-progress":
                            return { label: "In Progress", className: "bg-blue-100 text-blue-700" };
                        default:
                            return { label: "Pending", className: "bg-yellow-100 text-yellow-700" };
                    }
                };

                const meetingStatusBadge = getMeetingStatusBadge();

                return (
                    <div className="flex flex-col gap-1">
                        {/* Schedule Status (Upcoming/Past/Ongoing) */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scheduleStatus.className}`}>
                            {scheduleStatus.label}
                        </span>
                        {/* Meeting Status (Pending/In Progress/Completed) */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meetingStatusBadge.className}`}>
                            {meetingStatusBadge.label}
                        </span>
                        {/* Re-meetings Status */}
                        <MeetingStatusBadge reMeetings={meeting.reMeetings} />
                    </div>
                );
            },
        },
        {
            header: "Teams",
            key: "assignToTeamIds",
            render: (meeting: FormattedMeeting) => (
                <div className="flex items-center gap-1">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-600">
                        {meeting.assignToTeamIds.length} team(s) assigned
                    </span>
                </div>
            ),
        },
        {
            header: "Sessions",
            key: "reMeetings",
            render: (meeting: FormattedMeeting) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">
                            {meeting.reMeetings?.length || 0} session(s)
                        </span>
                    </div>
                    {meeting.reMeetings && meeting.reMeetings.length > 0 && (
                        <div className="flex flex-col gap-1">
                            {meeting.reMeetings.map((session: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-1">
                                        {/* Status Indicator */}
                                        {session.completed ? (
                                            <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                                        ) : (
                                            <Circle size={12} className="text-slate-400 flex-shrink-0" />
                                        )}
                                        <span className="text-xs text-slate-400 truncate max-w-[100px]">
                                            {new Date(session.dateTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleEditSession(meeting._id, session._id)}
                                        className="p-1 text-amber-600 hover:bg-amber-50 rounded transition"
                                        title="Edit Session"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: "Work",
            key: "work",
            render: (meeting: any) => {


                return meeting.work?.workId ? (
                    <button
                        onClick={() => handleViewWork(meeting)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                    >
                        <Eye size={14} />
                        View Work
                    </button>
                ) : (
                    <button
                        onClick={() => handleGenerateWork(meeting)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                        <Plus size={14} />
                        Generate Work
                    </button>
                );
            },
        },
        {
            header: "Actions",
            key: "actions",
            render: (meeting: FormattedMeeting) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/meetings/${meeting._id}`)}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                        title="View Details"
                    >
                        <Eye size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setMeetingToEdit(meeting);
                            setEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                        title="Edit Meeting"
                    >
                        <Pencil size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedReMeetingMeeting(meeting);
                            setReMeetingModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                        title="Add Re-meeting"
                    >
                        <RefreshCw size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedMeeting(meeting);
                            setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Delete Meeting"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Meetings | Command Center</title>
                <meta
                    name="description"
                    content="Manage and organize your meetings"
                />
            </Head>

            <DashboardLayout>
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Meetings
                            </h1>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage and organize your meetings and follow-ups
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader size={14} className="animate-spin" />
                                ) : (
                                    "Refresh"
                                )}
                            </button>

                            <button
                                onClick={() => setIsAddMeetingOpen(true)}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                                <Plus size={14} />
                                Create Meeting
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search meetings by title, ID, or description..."
                            />
                        </div>

                        <ViewToggle view={view} setView={setView} />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="text-center">
                                <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Loading meetings...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                            <p className="text-red-600 text-sm mb-2">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="text-indigo-600 text-xs font-medium hover:text-indigo-700"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <>
                            {/* GRID VIEW */}
                            {view === "grid" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {meetings.map((meeting) => {
                                        const status = getMeetingStatus(meeting.dateTime);
                                        return (
                                            <motion.div
                                                key={meeting._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                                            <MessageSquare size={20} className="text-indigo-600" />
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-900">
                                                                {meeting.meetingTitle}
                                                            </h3>
                                                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                                {meeting.meetingId}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                                                    {status.label}
                                                                </span>
                                                                <MeetingStatusBadge reMeetings={meeting.reMeetings} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                                                    {meeting.description || "No description provided"}
                                                </p>

                                                <div className="mt-3 space-y-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        <span className="text-xs text-slate-600">
                                                            {formatDateTime(meeting.dateTime)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={12} className="text-slate-400" />
                                                        <span className="text-xs text-slate-600">
                                                            {meeting.assignToTeamIds.length} team(s) assigned
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <RefreshCw size={12} className="text-slate-400" />
                                                        <span className="text-xs text-slate-600">
                                                            {meeting.reMeetings?.length || 0} follow-up session(s)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        onClick={() => router.push(`/meetings/${meeting._id}`)}
                                                        className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                                                    >
                                                        View Details
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setMeetingToEdit(meeting);
                                                            setEditModalOpen(true);
                                                        }}
                                                        className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TABLE VIEW */}
                            {view === "table" && meetings.length > 0 && (
                                <DataTable
                                    columns={columns}
                                    data={meetings}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={meetings.length}
                                    onPageChange={handlePageChange}
                                />
                            )}

                            {/* Empty State */}
                            {meetings.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <MessageSquare size={28} className="text-slate-400" />
                                    </div>

                                    <p className="text-sm text-slate-500 mb-2">
                                        {searchQuery
                                            ? "No meetings found matching your search"
                                            : "No meetings created yet"}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                        {searchQuery
                                            ? "Try adjusting your search criteria"
                                            : "Get started by creating your first meeting"}
                                    </p>

                                    <button
                                        onClick={() => setIsAddMeetingOpen(true)}
                                        className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700 inline-flex items-center gap-1"
                                    >
                                        <Plus size={14} />
                                        {searchQuery
                                            ? "Create a new meeting"
                                            : "Create your first meeting"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Add Meeting Modal */}
                <Modal
                    isOpen={isAddMeetingOpen}
                    onClose={() => {
                        setIsAddMeetingOpen(false);
                        fetchMeetings();
                    }}
                    title="Create New Meeting"
                >
                    <AddMeetingForm
                        onClose={() => {
                            setIsAddMeetingOpen(false);
                            fetchMeetings();
                        }}
                    />

                </Modal>

                {/* Edit Meeting Modal */}
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setMeetingToEdit(null);
                    }}
                    title="Edit Meeting"
                >
                    <AddMeetingForm
                        meetingId={meetingToEdit?._id}
                        onClose={() => {
                            setEditModalOpen(false);
                            fetchMeetings();
                        }}
                    />

                </Modal>
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
                    onUpdate={fetchMeetings}
                />

                {/* Add Work Modal */}
                <Modal
                    isOpen={isAddWorkOpen}
                    onClose={() => {
                        setIsAddWorkOpen(false);
                        setSelectedMeetingForWork(null);
                        setSelectedMeetingTeamIds([]);
                    }}
                    title={`Generate Work for ${selectedMeetingForWork?.meetingTitle || "Meeting"}`}
                >
                    <AddWorkForm
                        meetingId={selectedMeetingForWork?.meetingId}
                        meetingTeamIds={selectedMeetingTeamIds}
                        onClose={() => {
                            setIsAddWorkOpen(false);
                            setSelectedMeetingForWork(null);
                            setSelectedMeetingTeamIds([]);
                            fetchMeetings();
                        }}
                    />
                </Modal>
                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Meeting"
                    message={`Are you sure you want to delete "${selectedMeeting?.meetingTitle}"?`}
                    type="delete"
                />

                {/* Add Re-meeting Modal */}
                <Modal
                    isOpen={reMeetingModalOpen}
                    onClose={() => {
                        setReMeetingModalOpen(false);
                        setSelectedReMeetingMeeting(null);
                        setReMeetingData({
                            dateTime: "",
                            description: ""
                        });
                    }}
                    title={`Add Follow-up Session for ${selectedReMeetingMeeting?.meetingTitle || "Meeting"}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={reMeetingData.dateTime}
                                onChange={(e) => setReMeetingData({ ...reMeetingData, dateTime: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={reMeetingData.description}
                                onChange={(e) => setReMeetingData({ ...reMeetingData, description: e.target.value })}
                                placeholder="Enter session description..."
                                rows={4}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleAddReMeeting}
                                disabled={!reMeetingData.dateTime || !reMeetingData.description.trim() || isAddingReMeeting}
                                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAddingReMeeting ? (
                                    <>
                                        <Loader size={16} className="animate-spin inline mr-2" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Follow-up Session"
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setReMeetingModalOpen(false);
                                    setSelectedReMeetingMeeting(null);
                                    setReMeetingData({
                                        dateTime: "",
                                        description: ""
                                    });
                                }}
                                disabled={isAddingReMeeting}
                                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>


            </DashboardLayout>
        </>
    );
}