import DashboardLayout from "../../layouts/DashboardLayout";
import { motion } from "framer-motion";
import Head from "next/head";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import AddTeamForm from "../../components/forms/Addteams";
import { getTeams, deleteTeam } from "../../api/lib/request/teamsRequest";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import CommonModal from "../../components/CommonviewModal";
import { useMemo, useState, useEffect } from "react";
import {
    Search,
    Users,
    LayoutGrid,
    Table as TableIcon,
    Plus,
    Pencil,
    Trash2,
    Eye,
    Phone,
    Calendar,
    Building2,
    Crown,
    Loader,
} from "lucide-react";

// ========== REUSABLE COMPONENTS ==========

// Team Type Badge Component
const TeamTypeBadge = ({ type }: { type: string }) => {
    const typeConfig: Record<string, string> = {
        Development: "bg-blue-100 text-blue-700",
        Design: "bg-purple-100 text-purple-700",
        Marketing: "bg-pink-100 text-pink-700",
        Sales: "bg-green-100 text-green-700",
        HR: "bg-amber-100 text-amber-700",
        Product: "bg-indigo-100 text-indigo-700",
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig[type] || "bg-slate-100 text-slate-600"
                }`}
        >
            {type}
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
interface TeamMember {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string;
    photoBase64?: string;
}

interface FormattedTeam {
    _id: string;

    name: string;

    description: string;

    type: string;

    teamLead: {
        email?: string;
        phone?: string;
        fullName: string;
        photoBase64?: string;
    };

    memberCount: number;

    createdAt: string;

    members: TeamMember[];
    status: string;
}

// ========== MAIN COMPONENT ==========
export default function TeamsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"grid" | "table">("table");
    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [teams, setTeams] = useState<FormattedTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<FormattedTeam | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTeamView, setSelectedTeamView] =
        useState<FormattedTeam | null>(null);

    // Fetch teams
    const fetchTeams = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getTeams(
                currentPage,
                10,
                searchQuery,
                "all"
            );


            if (response?.teams?.docs) {
                const formattedTeams: FormattedTeam[] = response.teams.docs.map((team: any) => ({
                    _id: team._id,

                    name: team.teamName,

                    description: team.description,

                    type: team.teamType,

                    teamLead: {
                        fullName:
                            team.teamLead?.fullName ||
                            team.teamLeadData?.fullName ||
                            "No Lead",

                        email:
                            team.teamLead?.email ||
                            team.teamLeadData?.email ||
                            "",

                        phone:
                            team.teamLead?.phone ||
                            team.teamLeadData?.phone ||
                            "",

                        photoBase64:
                            team.teamLead?.photoBase64 ||
                            team.teamLeadData?.photoBase64 ||
                            "",
                    },

                    members:
                        team.members?.map((member: any) => ({
                            _id: member._id,
                            fullName: member.fullName,
                            email: member.email,
                            phone: member.phone,
                            role: member.role,
                            photoBase64: member.photoBase64,
                        })) || [],

                    memberCount:
                        team.memberData?.length ||
                        team.memberIds?.length ||
                        0,

                    createdAt: team.createdAt,

                    status: team.status,


                }));

                setTeams(formattedTeams);
                setTotalPages(response.teams.totalPages || 1);
            } else {
                setTeams([]);
                setTotalPages(1);
            }
        } catch (err: any) {
            console.error("Error fetching teams:", err);
            setError(err.message || "Failed to fetch teams");
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    // Delete team
    const confirmDelete = async () => {
        if (!selectedTeam) return;

        try {
            setLoading(true);

            const response = await deleteTeam(selectedTeam._id);

            toast.success("Team deleted successfully");

            setDeleteModalOpen(false);
            setSelectedTeam(null);

            await fetchTeams();
        } catch (err: any) {
            console.error("Delete Error:", err);
            toast.error(err?.message || "Failed to delete team");
        } finally {
            setLoading(false);
        }
    };


    const handleRefresh = () => {
        fetchTeams();
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [currentPage, searchQuery]);

    // Table Columns Configuration
    const columns = [
        {
            header: "Team",
            key: "name",
            render: (team: FormattedTeam) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <Building2 size={18} className="text-indigo-600" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {team.name}
                        </p>

                        <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">
                            {team.description}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Type",
            key: "type",
            render: (team: FormattedTeam) => <TeamTypeBadge type={team.type} />,
        },
        {
            header: "Team Lead",
            key: "teamLead",
            render: (team: FormattedTeam) => (
                <div className="flex items-center gap-2">
                    <Crown size={12} className="text-amber-500" />
                    <span className="text-xs font-medium text-slate-700">
                        {team.teamLead?.fullName}
                    </span>
                </div>
            ),
        },
        {
            header: "Members",
            key: "memberCount",
            render: (team: FormattedTeam) => (
                <div className="flex items-center gap-1">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                        {team.memberCount} members
                    </span>
                </div>
            ),
        },
        {
            header: "Created",
            key: "createdAt",
            render: (team: FormattedTeam) => (
                <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                        {new Date(team.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                </div>
            ),
        },
        {
            header: "Actions",
            key: "actions",
            render: (team: FormattedTeam) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedTeamView(team);
                            setViewModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                    >
                        <Eye size={15} />
                    </button>

                    <button onClick={() => {
                        setSelectedTeam(team);
                        setEditModalOpen(true);
                    }} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
                        <Pencil size={15} />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedTeam(team);
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
                <title>Teams | Command Center</title>
                <meta
                    name="description"
                    content="Manage and organize your teams"
                />
            </Head>

            <DashboardLayout>
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Teams
                            </h1>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage and organize your teams
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
                                onClick={() => setIsAddTeamOpen(true)}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                                <Plus size={14} />
                                Create Team
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 items-center">
                        <div className="flex-1">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search teams by name, type, or team lead..."
                            />
                        </div>

                        <ViewToggle view={view} setView={setView} />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="text-center">
                                <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">Loading teams...</p>
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
                                    {teams.map((team) => (
                                        <motion.div
                                            key={team._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                                        <Building2 size={20} className="text-indigo-600" />
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-900">
                                                            {team.name}
                                                        </h3>

                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <TeamTypeBadge type={team.type} />
                                                            <div className="flex items-center gap-1">
                                                                <Users size={10} className="text-slate-400" />
                                                                <span className="text-xs text-slate-500">
                                                                    {team.memberCount}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                                                {team.description}
                                            </p>

                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Crown size={12} className="text-amber-500" />
                                                    <span className="text-xs text-slate-600">
                                                        Lead: {team.teamLead?.fullName}
                                                    </span>
                                                </div>

                                                <span className="text-xs text-slate-400">
                                                    {new Date(team.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <button onClick={() => {
                                                    setSelectedTeamView(team);
                                                    setViewModalOpen(true);
                                                }} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition">
                                                    View Team
                                                </button>

                                                <button className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition">
                                                    Manage
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* TABLE VIEW */}
                            {view === "table" && teams.length > 0 && (
                                <DataTable
                                    columns={columns}
                                    data={teams}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalCount={teams.length}
                                    onPageChange={handlePageChange}
                                />
                            )}

                            {/* Empty State */}
                            {teams.length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <Users size={20} className="text-slate-400" />
                                    </div>

                                    <p className="text-sm text-slate-500">
                                        {searchQuery
                                            ? "No teams found matching your search"
                                            : "No teams created yet"}
                                    </p>

                                    <button
                                        onClick={() => setIsAddTeamOpen(true)}
                                        className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-700"
                                    >
                                        {searchQuery ? "Create a new team →" : "Create your first team →"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Add Team Modal */}
                <Modal
                    isOpen={isAddTeamOpen}
                    onClose={() => setIsAddTeamOpen(false)}
                    title="Create New Team"
                >
                    <AddTeamForm
                        onClose={() => {
                            setIsAddTeamOpen(false);
                            fetchTeams();
                        }}
                    />
                </Modal>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    message={`Are you sure you want to delete ${selectedTeam?.name}?`}
                />

                <Modal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedTeam(null);
                    }}
                    title="Edit Team"
                >
                    <AddTeamForm
                        teamId={selectedTeam?._id}
                        onClose={() => {
                            setEditModalOpen(false);
                            fetchTeams();
                        }}
                    />
                </Modal>

                {/* View Team Details Modal */}
                <CommonModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    title="Team Details"
                >
                    {selectedTeamView && (
                        <div className="space-y-6">
                            {/* Top Section */}
                            <div className="flex items-start gap-5 border-b border-slate-200 pb-5">
                                {/* Logo / Icon */}
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                                    <Building2 size={34} className="text-white" />
                                </div>

                                {/* Team Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            {selectedTeamView.name}
                                        </h2>

                                        <TeamTypeBadge type={selectedTeamView.type} />
                                    </div>

                                    <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-2xl">
                                        {selectedTeamView.description || "No description available"}
                                    </p>

                                    {/* Quick Stats */}
                                    <div className="flex flex-wrap gap-6 mt-5 text-sm">
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wide">
                                                Members
                                            </p>

                                            <p className="font-semibold text-slate-800 mt-1">
                                                {selectedTeamView.memberCount}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wide">
                                                Status
                                            </p>

                                            <p
                                                className={`font-semibold mt-1 capitalize ${selectedTeamView.status === "active"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                    }`}
                                            >
                                                {selectedTeamView.status}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-wide">
                                                Created
                                            </p>

                                            <p className="font-semibold text-slate-800 mt-1">
                                                {new Date(
                                                    selectedTeamView.createdAt
                                                ).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Lead */}
                            {/* Team Lead */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Crown size={16} className="text-amber-500" />

                                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                        Team Lead
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        {selectedTeamView.teamLead?.photoBase64 ? (
                                            <img
                                                src={selectedTeamView.teamLead.photoBase64}
                                                alt={selectedTeamView.teamLead.fullName}
                                                className="w-14 h-14 rounded-2xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                                                <span className="text-lg font-bold text-amber-600">
                                                    {selectedTeamView.teamLead?.fullName?.charAt(0)}
                                                </span>
                                            </div>
                                        )}

                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {selectedTeamView.teamLead?.fullName}
                                            </p>

                                            <p className="text-sm text-slate-500">
                                                {selectedTeamView.teamLead?.email}
                                            </p>

                                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                <Phone size={12} />
                                                <span>
                                                    {selectedTeamView.teamLead?.phone || "No phone"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                        Team Members
                                    </h3>

                                    <span className="text-xs text-slate-400">
                                        {selectedTeamView.members.length} Members
                                    </span>
                                </div>

                                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                                    {selectedTeamView.members.length > 0 ? (
                                        selectedTeamView.members.map((member) => (
                                            <div
                                                key={member._id}
                                                className="flex items-center justify-between py-4"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {member.photoBase64 ? (
                                                        <img
                                                            src={member.photoBase64}
                                                            alt={member.fullName}
                                                            className="w-12 h-12 rounded-2xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-indigo-600">
                                                                {member.fullName?.charAt(0)}
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

                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                            <Phone size={11} />
                                                            <span>{member.phone || "No phone"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                    {member.role}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-sm text-slate-400">
                                            No members found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CommonModal>
            </DashboardLayout>
        </>
    );
}