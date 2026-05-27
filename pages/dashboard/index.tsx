import DashboardLayout from "../../layouts/DashboardLayout";
import { useState, useEffect } from "react";
import KpiCard from "../../components/KpiCard";
import PerformanceChart from "../../components/PerformanceChart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardData, getDashboardData } from "../../api/lib/request/dashboard";

export default function Home() {
    // API States
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // UI States
    const [filter, setFilter] = useState("all");
    const [teamFilter, setTeamFilter] = useState("all");

    // Fetch Dashboard Data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const filters: { startDate?: string; endDate?: string } = {};
                if (startDate) filters.startDate = startDate;
                if (endDate) filters.endDate = endDate;

                const data = await getDashboardData(filters);
                setDashboardData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data');
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [startDate, endDate]);

    // Get unique teams from API data for filter
    const availableTeams = dashboardData?.teamPerformance?.map(team => team.teamName) || [];

    // Filter works based on status and team
    const getFilteredWorks = () => {
        if (!dashboardData?.recentWorks?.data) return [];

        return dashboardData.recentWorks.data.filter((work: any) => {
            if (filter !== "all" && work.status !== filter) return false;
            if (teamFilter !== "all") {
                const hasTeam = work.teams?.some((team: any) => team.teamName === teamFilter);
                if (!hasTeam) return false;
            }
            return true;
        });
    };

    const filteredWorks = getFilteredWorks();

    // Prepare chart data from API
    const taskDistributionData = dashboardData ? [
        { name: "Completed", value: dashboardData.workStatus.completed, color: "#22c55e" },
        { name: "In Progress", value: dashboardData.workStatus.inProgress, color: "#3b82f6" },
        { name: "Pending", value: dashboardData.workStatus.pending, color: "#eab308" },
        { name: "On Hold", value: dashboardData.workStatus.onHold, color: "#a855f7" },
        { name: "Cancelled", value: dashboardData.workStatus.cancelled, color: "#ef4444" }
    ] : [];

    const priorityData = dashboardData ? [
        { name: "High", count: dashboardData.workPriority.high, color: "#ef4444" },
        { name: "Medium", count: dashboardData.workPriority.medium, color: "#f97316" },
        { name: "Low", count: dashboardData.workPriority.low, color: "#eab308" }
    ] : [];

    // Team workload data for bar chart
    const teamWorkloadData = dashboardData?.teamPerformance?.map(team => ({
        name: team.teamName?.split(' ')[0] || team.teamId,
        totalWorks: team.totalWorks,
        completedWorks: team.completedWorks,
        completionRate: team.completionRate
    })) || [];

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            "completed": "bg-emerald-100 text-emerald-800",
            "in_progress": "bg-sky-100 text-sky-800",
            "pending": "bg-amber-100 text-amber-800",
            "on_hold": "bg-purple-100 text-purple-800",
            "cancelled": "bg-rose-100 text-rose-800"
        };
        return statusMap[status] || "bg-gray-100 text-gray-800";
    };

    const getPriorityColor = (priority: string) => {
        const priorityMap: Record<string, string> = {
            "high": "bg-rose-100 text-rose-800",
            "medium": "bg-amber-100 text-amber-800",
            "low": "bg-emerald-100 text-emerald-800"
        };
        return priorityMap[priority] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Animation variants
    const fadeInUp = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.3 }
    };

    const staggerContainer = {
        animate: { transition: { staggerChildren: 0.05 } }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center">
                        <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
            >
                {/* Header with Date Filters */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Real-time ops & team performance
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Real-time KPIs from API */}
                {dashboardData && (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="grid md:grid-cols-6 gap-3"
                    >
                        <motion.div variants={fadeInUp}>
                            <KpiCard title="Total Teams" value={dashboardData.summary.totalTeams} />
                        </motion.div>
                        <motion.div variants={fadeInUp}>
                            <KpiCard title="Total Works" value={dashboardData.summary.totalWorks} />
                        </motion.div>
                        <motion.div variants={fadeInUp}>
                            <KpiCard title="Completed" value={dashboardData.workStatus.completed} />
                        </motion.div>
                        <motion.div variants={fadeInUp}>
                            <KpiCard title="In Progress" value={dashboardData.workStatus.inProgress} />
                        </motion.div>
                        <motion.div variants={fadeInUp}>
                            <KpiCard title="Completion Rate" value={dashboardData.summary.completionRate} />
                        </motion.div>
                        <motion.div variants={fadeInUp}>
                            <KpiCard title="Overdue" value={dashboardData.deadlineStatus.overdue} />
                        </motion.div>
                    </motion.div>
                )}

                {/* Charts Section */}
                <div className="grid lg:grid-cols-3 gap-5">
                    {/* Pie Chart - Task Distribution */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                    >
                        <h3 className="font-semibold text-sm mb-2">Task Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={taskDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                    animationDuration={800}
                                    animationBegin={200}
                                >
                                    {taskDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Bar Chart - Priority Distribution */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                    >
                        <h3 className="font-semibold text-sm mb-2">Priority Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8">
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Team Workload Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                    >
                        <h3 className="font-semibold text-sm mb-2">Team Workload</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={teamWorkloadData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="totalWorks" fill="#3b82f6" name="Total Works" />
                                <Bar dataKey="completedWorks" fill="#22c55e" name="Completed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-5">
                    {/* Tasks Section - 2 cols */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex gap-1 flex-wrap">
                                {["all", "pending", "in_progress", "completed", "on_hold", "cancelled"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 capitalize ${filter === status
                                                ? "bg-indigo-600 text-white shadow-md scale-95"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {status === "all" ? "All" : status.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Teams</option>
                                {availableTeams.map(teamName => (
                                    <option key={teamName} value={teamName}>{teamName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Task Cards from API Data */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${filter}-${teamFilter}`}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={staggerContainer}
                                className="space-y-3 max-h-[600px] overflow-y-auto pr-2"
                            >
                                {filteredWorks.length > 0 ? (
                                    filteredWorks.map((work: any) => (
                                        <motion.div
                                            key={work.workId || work._id}
                                            variants={fadeInUp}
                                            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                                            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start flex-wrap gap-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-base">{work.workTitle}</h3>
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                                                        {work.teams && work.teams.length > 0 && (
                                                            <>
                                                                <span>{work.teams.map((t: any) => t.teamName).join(", ")}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <span>Due {formatDate(work.deadline)}</span>
                                                        <span>•</span>
                                                        <span>Created {formatDate(work.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(work.priority)}`}>
                                                        {work.priority}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(work.status)}`}>
                                                        {work.status.replace("_", " ")}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div variants={fadeInUp} className="text-center py-8 text-gray-500">
                                        No works found for the selected filters
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Pagination */}
                        {dashboardData?.recentWorks?.pagination && dashboardData.recentWorks.pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button
                                    onClick={() => {
                                        // Implement pagination if needed
                                    }}
                                    disabled={!dashboardData.recentWorks.pagination.hasPrevPage}
                                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {dashboardData.recentWorks.pagination.page} of {dashboardData.recentWorks.pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => {
                                        // Implement pagination if needed
                                    }}
                                    disabled={!dashboardData.recentWorks.pagination.hasNextPage}
                                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-5">
                        {/* Deadline Status from API */}
                        {dashboardData && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                            >
                                <h3 className="font-semibold text-sm mb-3">Deadline Status</h3>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-red-50">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-red-600">Overdue</span>
                                            <span className="text-red-600 font-bold">{dashboardData.deadlineStatus.overdue}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-orange-50">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-orange-600">Due Today</span>
                                            <span className="text-orange-600 font-bold">{dashboardData.deadlineStatus.today}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-blue-50">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-blue-600">Upcoming</span>
                                            <span className="text-blue-600 font-bold">{dashboardData.deadlineStatus.upcoming}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Team Performance from API */}
                        {dashboardData && dashboardData.teamPerformance && dashboardData.teamPerformance.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                            >
                                <h3 className="font-semibold text-sm mb-3">Team Performance</h3>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {dashboardData.teamPerformance.map((team, idx) => (
                                        <div key={team.teamId} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-medium text-sm">{team.teamName || team.teamId}</span>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {team.memberCount || 0} members • {team.teamType || 'N/A'}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {team.status || 'active'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                                                <div>
                                                    <p className="text-xs text-gray-500">Total</p>
                                                    <p className="font-semibold text-sm">{team.totalWorks}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Completed</p>
                                                    <p className="font-semibold text-sm text-green-600">{team.completedWorks}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Progress</p>
                                                    <p className="font-semibold text-sm text-blue-600">{team.completionRate?.toFixed(1) || 0}%</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${team.completionRate || 0}%` }}
                                                    transition={{ duration: 0.6, delay: 0.3 }}
                                                    className="bg-emerald-500 h-1.5 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Today's Activity from API */}
                        {dashboardData && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                            >
                                <h3 className="font-semibold text-sm mb-3">Today's Activity</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{dashboardData.todayActivity.teamsCreated}</p>
                                        <p className="text-xs text-gray-600">Teams Created</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{dashboardData.todayActivity.worksCreated}</p>
                                        <p className="text-xs text-gray-600">Works Created</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}