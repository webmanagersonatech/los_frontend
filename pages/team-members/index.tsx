import DashboardLayout from "../../layouts/DashboardLayout";
import { motion } from "framer-motion";
import Head from "next/head";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import AddTeamMember from "../../components/forms/Addteammembersform";
import { getTeamMembers, deleteTeamMember } from "../../api/lib/request/teammemberRequest";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import { useMemo, useState, useEffect } from "react";
import CommonModal from "../../components/CommonviewModal";
import {
    Search,
    Mail,
    Phone,
    X,
    Users,
    LayoutGrid,
    Table as TableIcon,
    UserPlus,
    Pencil,
    Trash2,
    Eye,
    Loader,
} from "lucide-react";

// ========== REUSABLE COMPONENTS ==========

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700",
        inactive: "bg-slate-100 text-slate-600",
        pending: "bg-amber-100 text-amber-700",
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusConfig[status?.toLowerCase()] || statusConfig.inactive
                }`}
        >
            {status || "Inactive"}
        </span>
    );
};
const RoleBadge = ({ role }: { role: string }) => {
    const roleConfig: Record<string, string> = {
        admin: "bg-purple-100 text-purple-700",
        manager: "bg-blue-100 text-blue-700",
        developer: "bg-indigo-100 text-indigo-700",
        designer: "bg-pink-100 text-pink-700",
        viewer: "bg-slate-100 text-slate-600",
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleConfig[role?.toLowerCase()] || roleConfig.viewer
                }`}
        >
            {role || "Viewer"}
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

// ========== DATA TYPES (Updated to match API) ==========
interface TeamMember {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    photoBase64: string;
    status: string;
    teamMemberId: string;
    createdAt: string;
    updatedAt: string;
}


// ========== MAIN COMPONENT ==========
export default function TeamMembersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"grid" | "table">("table");
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Fetch team members
    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getTeamMembers(
                currentPage,
                10,
                searchQuery
            );

            console.log(response, "response");

            if (response?.success) {
                setMembers(
                    (response?.teamMembers?.docs || []) as TeamMember[]
                );
                setTotalPages(response.teamMembers?.totalPages || 1);
            } else {
                setMembers([]);
            }
        } catch (err: any) {
            console.error("Error fetching team members:", err);
            setError(err.message || "Failed to fetch team members");
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedMember) return;

        try {
            setLoading(true);

            const response = await deleteTeamMember(
                selectedMember._id
            );

            toast.success("Team member deleted successfully");

            setDeleteModalOpen(false);
            setSelectedMember(null);

            await fetchTeamMembers();
        } catch (err: any) {
            console.error("Delete Error:", err);

            toast.error(
                err?.message || "Failed to delete team member"
            );
        } finally {
            setLoading(false);
        }
    };



    // Debounced search to avoid too many API calls
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (currentPage === 1) {
                fetchTeamMembers();
            } else {
                setCurrentPage(1);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchTeamMembers();
    };



    const columns = [
        {
            header: "Member",
            key: "name",
            render: (member: TeamMember) => (
                <div className="flex items-center gap-3">
                    {member.photoBase64 ? (
                        <img
                            src={member.photoBase64}
                            alt={member.fullName}
                            className="w-9 h-9 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                                {member.fullName?.charAt(0) || "U"}
                            </span>
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {member.fullName}
                        </p>

                        <p className="text-xs text-slate-500">
                            {member.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Team  Member ID",
            key: "teamMemberId",
            render: (member: TeamMember) => (
                <span className="text-xs font-mono text-slate-500">
                    {member.teamMemberId}
                </span>
            ),
        },
        {
            header: "Role",
            key: "role",
            render: (member: TeamMember) => (
                <span className="text-xs font-medium text-slate-600 capitalize">
                    {member.role}
                </span>
            ),
        },
        {
            header: "Phone",
            key: "phone",
            render: (member: TeamMember) => (
                <span className="text-xs text-slate-500">
                    {member.phone}
                </span>
            ),
        },
        {
            header: "Status",
            key: "status",
            render: (member: TeamMember) => (
                <StatusBadge status={member.status} />
            ),
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (member: TeamMember) => (
                <span className="text-xs text-slate-500">
                    {new Date(member.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: "Actions",
            key: "actions",
            render: (member: TeamMember) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedMember(member);
                            setViewModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                    >
                        <Eye size={15} />
                    </button>

                    <button onClick={() => {
                        setSelectedMember(member);
                        setEditModalOpen(true);
                    }} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
                        <Pencil size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedMember(member);
                            setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
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
                <title>Team Members | Command Center</title>
                <meta
                    name="description"
                    content="Manage and monitor your team members"
                />
            </Head>

            <DashboardLayout>
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Team Members
                            </h1>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage and monitor your team
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
                                onClick={() => setIsAddMemberOpen(true)}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                                <UserPlus size={14} />
                                Add Member
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 items-center">
                        <div className="flex-1">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                                placeholder="Search members..."
                            />
                        </div>

                        <ViewToggle view={view} setView={setView} />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="text-center">
                                <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Loading team members...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
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
                                    {members.map((member) => (
                                        <motion.div
                                            key={member._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    {member.photoBase64 ? (
                                                        <img
                                                            src={member.photoBase64}
                                                            alt={member.fullName}
                                                            className="w-14 h-14 rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-indigo-600 font-medium text-lg">
                                                                {member.fullName?.charAt(0) || "U"}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-900">
                                                            {member.fullName}
                                                        </h3>

                                                        <p className="text-xs text-slate-500 mt-0.5 capitalize">
                                                            {member.role}
                                                        </p>
                                                    </div>
                                                </div>

                                                <StatusBadge status={member.status} />
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Mail size={14} />
                                                    {member.email}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Phone size={14} />
                                                    {member.phone}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <button onClick={() => {
                                                    setSelectedMember(member);
                                                    setViewModalOpen(true);
                                                }} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition">
                                                    View Profile
                                                </button>

                                                <button onClick={() => {
                                                    setSelectedMember(member);
                                                    setEditModalOpen(true);
                                                }} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition">
                                                    Edit
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* TABLE VIEW */}
                            {view === "table" && members.length > 0 && (
                                <DataTable
                                    columns={columns}
                                    data={members}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={members.length}
                                    onPageChange={handlePageChange}
                                />
                            )}


                            {/* Empty State */}
                            {members.length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <Users
                                            size={20}
                                            className="text-slate-400"
                                        />
                                    </div>

                                    <p className="text-sm text-slate-500">
                                        No team members found
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Add Member Modal */}
                <Modal
                    isOpen={isAddMemberOpen}
                    onClose={() => setIsAddMemberOpen(false)}
                    title="Add Team Member"
                >
                    <AddTeamMember
                        onClose={() => {
                            setIsAddMemberOpen(false);
                            fetchTeamMembers(); // Refresh the list after adding
                        }}
                    />
                </Modal>
                <ConfirmModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    message={`Are you sure you want to delete ${selectedMember?.fullName}?`}
                />
                <Modal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedMember(null);
                    }}
                    title="Edit Team Member"
                >
                    <AddTeamMember
                        memberId={selectedMember?._id}
                        onClose={() => {
                            setEditModalOpen(false);
                            fetchTeamMembers();
                        }}
                    />
                </Modal>


                {/* View Member Details Modal */}
                <CommonModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    title="Member Details"
                >
                    {selectedMember && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                {selectedMember.photoBase64 ? (
                                    <img
                                        src={selectedMember.photoBase64}
                                        alt={selectedMember.fullName}
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-indigo-600">
                                            {selectedMember.fullName?.charAt(0)}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {selectedMember.fullName}
                                    </h2>

                                    <div className="flex items-center gap-2 mt-1">
                                        <RoleBadge role={selectedMember.role} />
                                        <StatusBadge status={selectedMember.status} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="font-medium">Email:</span>{" "}
                                    {selectedMember.email}
                                </p>

                                <p>
                                    <span className="font-medium">Phone:</span>{" "}
                                    {selectedMember.phone}
                                </p>

                                <p>
                                    <span className="font-medium">Member ID:</span>{" "}
                                    <span className="font-mono text-slate-500">
                                        {selectedMember.teamMemberId}
                                    </span>
                                </p>

                                <p>
                                    <span className="font-medium">Joined:</span>{" "}
                                    {new Date(selectedMember.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    )}
                </CommonModal>
            </DashboardLayout>
        </>
    );
}