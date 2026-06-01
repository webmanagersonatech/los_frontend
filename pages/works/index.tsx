import DashboardLayout from "../../layouts/DashboardLayout";
import { motion } from "framer-motion";
import Head from "next/head";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import AddWorkForm from "../../components/forms/Addworkform";
import { getWorks, deleteWork, Work, updateWorkStatus } from "../../api/lib/request/worksRequests";
import ConfirmModal from "../../components/ConfirmModal";
import { getWorkById } from "../../api/lib/request/worksRequests";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import CommonModal from "../../components/CommonviewModal";
import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Users,
    LayoutGrid,
    Table as TableIcon,
    Plus,
    Pencil,
    Trash2,
    Eye,
    Calendar,
    Briefcase,
    Clock,
    Mail, Phone,
    AlertCircle,
    Loader,
    Flag,
    User,
} from "lucide-react";

// ========== REUSABLE COMPONENTS ==========

// Work Status Badge Component
const WorkStatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
        in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
        completed: { label: "Completed", className: "bg-green-100 text-green-700" },
        on_hold: { label: "On Hold", className: "bg-red-100 text-red-700" },
        cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600" };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: string }) => {
    const priorityConfig: Record<string, string> = {
        low: "bg-green-100 text-green-700",
        medium: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        "very-high": "bg-red-100 text-red-700",
    };

    const displayText: Record<string, string> = {
        low: "Low",
        medium: "Medium",
        high: "High",
        "very-high": "Very High",
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[priority] || "bg-slate-100 text-slate-600"}`}>
            {displayText[priority] || priority.charAt(0).toUpperCase() + priority.slice(1)}
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

// Status Filter Component
const StatusFilter = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const statusOptions = [
        { value: "all", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "on_hold", label: "On Hold" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
            {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

// Priority Filter Component
const PriorityFilter = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const priorityOptions = [
        { value: "all", label: "All Priority" },
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "very-high", label: "Very High" },
    ];

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
            {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

// ========== DATA TYPES ==========
interface FormattedWork {
    _id: string;
    workId: string;
    workTitle: string;
    description: string;
    status: string;
    priority: string;
    assignToTeamIds: string[];
    teamNames?: string[];
    teams?: any[]; // Add teams array
    deadline: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

// ========== MAIN COMPONENT ==========

export default function WorksPage() {

    const router = useRouter();
    const { meetingId } = router.query;
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [view, setView] = useState<"grid" | "table">("table");
    const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
    const [works, setWorks] = useState<FormattedWork[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState<FormattedWork | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedWorkView, setSelectedWorkView] = useState<FormattedWork | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [workToEdit, setWorkToEdit] = useState<FormattedWork | null>(null);
    const [statusUpdateModal, setStatusUpdateModal] = useState(false);
    const [selectedStatusWork, setSelectedStatusWork] = useState<FormattedWork | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [statusLoading, setStatusLoading] = useState(false);

    // Fetch works from API
    const fetchWorks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getWorks(
                currentPage,
                10,
                searchQuery,
                statusFilter,
                priorityFilter,
                meetingId as string
            );

            if (response?.works?.docs) {
                const formattedWorks: FormattedWork[] = response.works.docs.map((work: any) => ({
                    _id: work._id,
                    workId: work.workId,
                    workTitle: work.workTitle,
                    description: work.description || "",
                    status: work.status || "pending",
                    priority: work.priority || "medium",
                    assignToTeamIds: work.assignToTeamIds || [],
                    teamNames: work.teamNames || [], // You can fetch team names separately if needed
                    deadline: work.deadline,
                    createdBy: work.createdBy,
                    createdAt: work.createdAt,
                    updatedAt: work.updatedAt,
                }));

                setWorks(formattedWorks);
                setTotalPages(response.works.totalPages || 1);
                setTotalDocs(response.works.totalDocs || 0);
            } else {
                setWorks([]);
                setTotalPages(1);
                setTotalDocs(0);
            }
        } catch (err: any) {
            console.error("Error fetching works:", err);
            setError(err.message || "Failed to fetch work items");
            setWorks([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, statusFilter, priorityFilter,meetingId]);

    // Delete work
    const confirmDelete = async () => {
        if (!selectedWork) return;

        try {
            setLoading(true);
            await deleteWork(selectedWork._id);
            toast.success("Work deleted successfully");
            setDeleteModalOpen(false);
            setSelectedWork(null);
            await fetchWorks();
        } catch (err: any) {
            console.error("Delete Error:", err);
            toast.error(err?.message || "Failed to delete work");
        } finally {
            setLoading(false);
        }
    };
    const confirmStatusUpdate = async () => {
        if (!selectedStatusWork || !newStatus) return;

        try {
            setStatusLoading(true);

            await updateWorkStatus(
                selectedStatusWork._id,
                newStatus
            );

            toast.success("Work status updated");

            setWorks((prev) =>
                prev.map((item) =>
                    item._id === selectedStatusWork._id
                        ? { ...item, status: newStatus }
                        : item
                )
            );

            setStatusUpdateModal(false);
            setSelectedStatusWork(null);
            setNewStatus("");
        } catch (error: any) {
            toast.error(
                error?.message || "Failed to update status"
            );
        } finally {
            setStatusLoading(false);
        }
    };


    const handleViewWork = async (workId: string) => {
        try {
            setLoading(true);

            const response: any = await getWorkById(workId);


            const singleWork = response?.data || response;

            // Extract team details properly
            const teamsData = singleWork.teams || [];

            setSelectedWorkView({
                _id: singleWork._id,
                workId: singleWork.workId,
                workTitle: singleWork.workTitle,
                description: singleWork.description || "",
                status: singleWork.status || "pending",
                priority: singleWork.priority || "medium",
                assignToTeamIds: singleWork.assignToTeamIds || [],
                teamNames: singleWork.teamNames || [],
                teams: teamsData, // Add teams array with full details
                deadline: singleWork.deadline,
                createdBy: singleWork.createdBy,
                createdAt: singleWork.createdAt,
                updatedAt: singleWork.updatedAt,
            });

            setViewModalOpen(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to fetch work details");
        } finally {
            setLoading(false);
        }
    };
    const handleRefresh = () => {
        fetchWorks();
    };
    const handleStatusChange = (
        work: FormattedWork,
        status: string
    ) => {
        setSelectedStatusWork(work);
        setNewStatus(status);
        setStatusUpdateModal(true);
    };
    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, priorityFilter]);

    // Fetch works when dependencies change
    useEffect(() => {
        if (!router.isReady) return;

        fetchWorks();
    }, [router.isReady, fetchWorks]);

    // Helper function to get days remaining
    const getDaysRemaining = (deadline: string) => {
        const today = new Date();
        const due = new Date(deadline);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "Overdue";
        if (diffDays === 0) return "Due today";
        return `${diffDays} days left`;
    };

    // Helper function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Table Columns Configuration
    const columns = [
        {
            header: "Work Item",
            key: "workTitle",
            render: (work: FormattedWork) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <Briefcase size={18} className="text-indigo-600" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {work.workTitle}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                            {work.workId}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px] mt-0.5">
                            {work.description}
                        </p>
                    </div>
                </div>
            ),
        },

        {
            header: "Priority",
            key: "priority",
            render: (work: FormattedWork) => <PriorityBadge priority={work.priority} />,
        },
        {
            header: "Teams",
            key: "assignToTeamIds",
            render: (work: FormattedWork) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-600">
                            {work.assignToTeamIds.length} team(s) assigned
                        </span>
                    </div>
                    {work.teamNames && work.teamNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {work.teamNames.slice(0, 2).map((team, idx) => (
                                <span key={idx} className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {team}
                                </span>
                            ))}
                            {work.teamNames.length > 2 && (
                                <span className="text-xs text-slate-400">+{work.teamNames.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: "Deadline",
            key: "deadline",
            render: (work: FormattedWork) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">
                            {formatDate(work.deadline)}
                        </span>
                    </div>
                    <span className={`text-xs mt-0.5 ${getDaysRemaining(work.deadline) === "Overdue"
                        ? "text-red-500 font-medium"
                        : getDaysRemaining(work.deadline) === "Due today"
                            ? "text-orange-500 font-medium"
                            : "text-slate-400"
                        }`}>
                        {getDaysRemaining(work.deadline)}
                    </span>
                </div>
            ),
        },
        {
            header: "Status",
            key: "status",
            render: (work: FormattedWork) => (
                <select
                    value={work.status}
                    onChange={(e) =>
                        handleStatusChange(work, e.target.value)
                    }
                    className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        border outline-none cursor-pointer
        ${work.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : work.status === "in_progress"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : work.status === "completed"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : work.status === "on_hold"
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                        }
      `}
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            ),
        },
        {
            header: "Actions",
            key: "actions",
            render: (work: FormattedWork) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleViewWork(work._id)}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                        title="View Details"
                    >
                        <Eye size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setWorkToEdit(work);
                            setEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                        title="Edit Work"
                    >
                        <Pencil size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedWork(work);
                            setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Delete Work"
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
                <title>Works | Command Center</title>
                <meta
                    name="description"
                    content="Manage and organize your work items"
                />
            </Head>

            <DashboardLayout>
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Works
                            </h1>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage and organize your work items
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
                                onClick={() => setIsAddWorkOpen(true)}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                                <Plus size={14} />
                                Create Work
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search works by title, ID, or description..."
                            />
                        </div>

                        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
                        <PriorityFilter value={priorityFilter} onChange={setPriorityFilter} />
                        <ViewToggle view={view} setView={setView} />
                    </div>



                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="text-center">
                                <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Loading work items...</p>
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
                                    {works.map((work) => (
                                        <motion.div
                                            key={work._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                                        <Briefcase size={20} className="text-indigo-600" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-900">
                                                            {work.workTitle}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                            {work.workId}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <WorkStatusBadge status={work.status} />
                                                            <PriorityBadge priority={work.priority} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                                                {work.description || "No description provided"}
                                            </p>

                                            <div className="mt-3 space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={12} className="text-slate-400" />
                                                    <span className="text-xs text-slate-600">
                                                        {work.assignToTeamIds.length} team(s) assigned
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span className={`text-xs ${getDaysRemaining(work.deadline) === "Overdue"
                                                        ? "text-red-500 font-medium"
                                                        : "text-slate-600"
                                                        }`}>
                                                        {getDaysRemaining(work.deadline)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    onClick={() => handleViewWork(work._id)}
                                                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                                                >
                                                    View Details
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setWorkToEdit(work);
                                                        setEditModalOpen(true);
                                                    }}
                                                    className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* TABLE VIEW */}
                            {view === "table" && works.length > 0 && (
                                <DataTable
                                    columns={columns}
                                    data={works}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={works.length}
                                    onPageChange={handlePageChange}
                                />
                            )}

                            {/* Empty State */}
                            {works.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Briefcase size={28} className="text-slate-400" />
                                    </div>

                                    <p className="text-sm text-slate-500 mb-2">
                                        {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                                            ? "No work items found matching your filters"
                                            : "No work items created yet"}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                        {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                                            ? "Try adjusting your search or filter criteria"
                                            : "Get started by creating your first work item"}
                                    </p>

                                    <button
                                        onClick={() => setIsAddWorkOpen(true)}
                                        className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700 inline-flex items-center gap-1"
                                    >
                                        <Plus size={14} />
                                        {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                                            ? "Create a new work item"
                                            : "Create your first work item"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Add Work Modal */}
                <Modal
                    isOpen={isAddWorkOpen}
                    onClose={() => {
                        setIsAddWorkOpen(false);
                        fetchWorks();
                    }}
                    title="Create New Work"
                >
                    <AddWorkForm
                        onClose={() => {
                            setIsAddWorkOpen(false);
                            fetchWorks();
                        }}
                    />
                </Modal>

                {/* Edit Work Modal - You'll need to create an EditWorkForm component */}
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setWorkToEdit(null);
                    }}
                    title="Edit Work"
                >
                    <AddWorkForm
                        workId={workToEdit?._id}
                        onClose={() => {
                            setEditModalOpen(false);
                            fetchWorks();
                        }}
                    />
                </Modal>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Work"
                    message={`Are you sure you want to delete "${selectedWork?.workTitle}"?`}
                    type="delete"
                />

                <ConfirmModal
                    isOpen={statusUpdateModal}
                    onClose={() => {
                        setStatusUpdateModal(false);
                        setSelectedStatusWork(null);
                        setNewStatus("");
                    }}
                    onConfirm={confirmStatusUpdate}
                    title="Update Work Status"
                    message={`Change status to "${newStatus.replace("_", " ")}"?`}
                    loading={statusLoading}
                    type="status"
                    confirmText="Update Status"
                />

                {/* View Work Details Modal */}
                <CommonModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    title="Work Details"
                >
                    {selectedWorkView && (
                        <div className="space-y-6">
                            {/* Header Section */}
                            <div className="flex items-start gap-5 border-b border-slate-200 pb-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                                    <Briefcase size={30} className="text-white" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {selectedWorkView.workTitle}
                                        </h2>
                                        <WorkStatusBadge status={selectedWorkView.status} />
                                        <PriorityBadge priority={selectedWorkView.priority} />
                                    </div>

                                    <p className="text-xs text-slate-400 font-mono mt-1">
                                        {selectedWorkView.workId}
                                    </p>

                                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                        {selectedWorkView.description || "No description available"}
                                    </p>
                                </div>
                            </div>

                            {/* Teams Section with Full Details */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Users size={16} className="text-indigo-500" />
                                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                        Assigned Teams ({selectedWorkView.teams?.length || 0})
                                    </h3>
                                </div>

                                {selectedWorkView.teams && selectedWorkView.teams.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {selectedWorkView.teams.map((team: any, idx: number) => (
                                            <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                                                {/* Team Header */}
                                                <div className="flex items-start justify-between mb-3 pb-2 border-b border-slate-200">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800 text-base">
                                                            {team.teamName || team.name || "Unnamed Team"}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                            {team.teamId || team.id}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${team.teamType === 'sales'
                                                        ? 'bg-green-100 text-green-700'
                                                        : team.teamType === 'operations'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {team.teamType || "team"}
                                                    </span>
                                                </div>

                                                {/* Team Lead Details */}
                                                {team.teamLead && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User size={12} className="text-indigo-500" />
                                                            <p className="text-xs font-medium text-slate-500">Team Lead</p>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3 space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                {team.teamLead.photoBase64 ? (
                                                                    <img
                                                                        src={team.teamLead.photoBase64}
                                                                        alt={team.teamLead.fullName}
                                                                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                                                        <User size={16} className="text-indigo-600" />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-700">
                                                                        {team.teamLead.fullName || "N/A"}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 font-mono">
                                                                        ID: {team.teamLead.teamMemberId || team.teamLeadId}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Contact Details */}
                                                {team.teamLead && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Mail size={12} className="text-indigo-500" />
                                                            <p className="text-xs font-medium text-slate-500">Contact Information</p>
                                                        </div>
                                                        <div className="bg-white rounded-lg p-3 space-y-2">
                                                            {team.teamLead.email && (
                                                                <div className="flex items-center gap-2">
                                                                    <Mail size={12} className="text-slate-400" />
                                                                    <span className="text-sm text-slate-600 break-all">
                                                                        {team.teamLead.email}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {team.teamLead.phone && (
                                                                <div className="flex items-center gap-2">
                                                                    <Phone size={12} className="text-slate-400" />
                                                                    <span className="text-sm text-slate-600">
                                                                        {team.teamLead.phone}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {team.teamLead.role && (
                                                                <div className="flex items-center gap-2">
                                                                    <Briefcase size={12} className="text-slate-400" />
                                                                    <span className="text-sm text-slate-600">
                                                                        {team.teamLead.role}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-lg p-6 text-center">
                                        <Users size={32} className="text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No teams assigned to this work</p>
                                    </div>
                                )}
                            </div>

                            {/* Details Grid - Deadline & Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar size={14} className="text-indigo-500" />
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Deadline
                                            </h3>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {new Date(selectedWorkView.deadline).toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className={`text-xs mt-1 ${getDaysRemaining(selectedWorkView.deadline) === "Overdue"
                                                ? "text-red-500 font-medium"
                                                : "text-slate-500"
                                                }`}>
                                                {getDaysRemaining(selectedWorkView.deadline)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Time: {new Date(selectedWorkView.deadline).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock size={14} className="text-indigo-500" />
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Timeline
                                            </h3>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                            <div>
                                                <p className="text-xs text-slate-400">Created</p>
                                                <p className="text-sm text-slate-700">
                                                    {new Date(selectedWorkView.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Last Updated</p>
                                                <p className="text-sm text-slate-700">
                                                    {new Date(selectedWorkView.updatedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CommonModal>
            </DashboardLayout>
        </>
    );
}