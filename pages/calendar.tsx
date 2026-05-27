import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "framer-motion";
import Head from "next/head";
import { useEffect, useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import { getWorks, Work } from "../api/lib/request/worksRequests";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  AlertCircle,
  Loader,
  Filter,
  X,
  Users,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Sun,
  List,
  Grid3x3,
  LayoutGrid,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import CommonModal from "../components/CommonviewModal";
import { getWorkById } from "../api/lib/request/worksRequests";
import AddWorkForm from "../components/forms/Addworkform";

// ========== TYPES ==========
interface CalendarWork {
  _id: string;
  workId: string;
  workTitle: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  assignToTeamIds: string[];
  teamNames?: string[];
}

interface Team {
  teamName?: string;
  name?: string;
  teamLead?: {
    fullName: string;
  };
}

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

// Priority Badge Component - SAFE VERSION with undefined handling
const PriorityBadge = ({ priority }: { priority?: string }) => {
  const safePriority = priority || "medium";

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
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[safePriority] || "bg-slate-100 text-slate-600"
        }`}
    >
      {displayText[safePriority] ||
        safePriority.charAt(0).toUpperCase() + safePriority.slice(1)}
    </span>
  );
};

// Days Remaining Component
const DaysRemainingBadge = ({ deadline }: { deadline: string }) => {
  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", className: "bg-red-100 text-red-700" };
    if (diffDays === 0) return { text: "Due today", className: "bg-orange-100 text-orange-700" };
    if (diffDays <= 3) return { text: `${diffDays} days left`, className: "bg-yellow-100 text-yellow-700" };
    return { text: `${diffDays} days left`, className: "bg-green-100 text-green-700" };
  };

  const { text, className } = getDaysRemaining(deadline);

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {text}
    </span>
  );
};

// Custom Event Renderer for FullCalendar
const renderEventContent = (eventInfo: any) => {
  const priority = eventInfo.event.extendedProps.priority;
  const status = eventInfo.event.extendedProps.status;
  const workId = eventInfo.event.extendedProps.workId;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "very-high": return "border-l-4 border-l-red-500";
      case "high": return "border-l-4 border-l-orange-500";
      case "medium": return "border-l-4 border-l-blue-500";
      case "low": return "border-l-4 border-l-green-500";
      default: return "border-l-4 border-l-indigo-500";
    }
  };

  return (
    <div className={`h-full p-2 rounded-md bg-white shadow-sm ${getPriorityColor(priority)} hover:shadow-md transition cursor-pointer`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">
            {eventInfo.event.title}
          </p>
          {workId && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              ID: {workId}
            </p>
          )}
        </div>
        <PriorityBadge priority={priority} />
      </div>
      {eventInfo.event.extendedProps.deadline && (
        <div className="mt-1">
          <DaysRemainingBadge deadline={eventInfo.event.extendedProps.deadline} />
        </div>
      )}
    </div>
  );
};

// Filter Panel Component
const FilterPanel = ({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  onClear,
}: {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  onClear: () => void;
}) => {
  const statusOptions = [
    { value: "all", label: "All Status", color: "slate" },
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "in_progress", label: "In Progress", color: "blue" },
    { value: "completed", label: "Completed", color: "green" },
    { value: "on_hold", label: "On Hold", color: "red" },
    { value: "cancelled", label: "Cancelled", color: "gray" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priority", color: "slate" },
    { value: "low", label: "Low", color: "green" },
    { value: "medium", label: "Medium", color: "blue" },
    { value: "high", label: "High", color: "orange" },
    { value: "very-high", label: "Very High", color: "red" },
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) return "bg-white border-slate-200 text-slate-700";
    const colors: Record<string, string> = {
      slate: "bg-slate-500 border-slate-500 text-white",
      yellow: "bg-yellow-500 border-yellow-500 text-white",
      blue: "bg-blue-500 border-blue-500 text-white",
      green: "bg-green-500 border-green-500 text-white",
      red: "bg-red-500 border-red-500 text-white",
      orange: "bg-orange-500 border-orange-500 text-white",
      gray: "bg-gray-500 border-gray-500 text-white",
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700">Filter Works</h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition"
        >
          <X size={12} />
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === option.value
                  ? getColorClasses(option.color, true)
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPriorityFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${priorityFilter === option.value
                  ? getColorClasses(option.color, true)
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Statistics Cards Component
const StatisticsCards = ({ works }: { works: CalendarWork[] }) => {
  const stats = [
    {
      label: "Pending",
      value: works.filter(w => w.status === "pending").length,
      color: "yellow",
      icon: Clock,
    },
    {
      label: "In Progress",
      value: works.filter(w => w.status === "in_progress").length,
      color: "blue",
      icon: CalendarDays,
    },
    {
      label: "Completed",
      value: works.filter(w => w.status === "completed").length,
      color: "green",
      icon: CheckCircle,
    },
    {
      label: "High Priority",
      value: works.filter(w => w.priority === "high" || w.priority === "very-high").length,
      color: "red",
      icon: AlertTriangle,
    },
    {
      label: "Total Works",
      value: works.length,
      color: "indigo",
      icon: BarChart3,
    },
  ];

  const colorClasses: Record<string, string> = {
    yellow: "from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    green: "from-green-50 to-green-100 border-green-200 text-green-700",
    red: "from-red-50 to-red-100 border-red-200 text-red-700",
    indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${colorClasses[stat.color]} rounded-xl p-4 border shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <IconComponent size={20} />
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
        <Loader size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
      </div>
      <p className="text-sm text-slate-500 mt-4">Loading calendar data...</p>
    </div>
  </div>
);

// Error State Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-8 text-center">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertCircle size={32} className="text-red-500" />
    </div>
    <p className="text-red-600 font-medium mb-2">{error}</p>
    <button
      onClick={onRetry}
      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
    >
      Try Again
    </button>
  </div>
);

// Work Details Modal Content Component
const WorkDetailsContent = ({ work, onClose }: { work: any; onClose: () => void }) => {
  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    return `${diffDays} days left`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-5 border-b border-slate-200 pb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
          <Briefcase size={30} className="text-white" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h2 className="text-xl font-bold text-slate-800">
              {work.workTitle}
            </h2>
            <WorkStatusBadge status={work.status} />
            <PriorityBadge priority={work.priority} />
          </div>

          <p className="text-xs text-slate-400 font-mono">
            {work.workId}
          </p>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {work.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Teams Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Assigned Teams ({work.teams?.length || 0})
          </h3>
        </div>

        {work.teams && work.teams.length > 0 ? (
          <div className="grid gap-3">
            {work.teams.map((team: Team, idx: number) => (
              <div key={idx} className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800">
                  {team.teamName || team.name || "Unnamed Team"}
                </h4>
                {team.teamLead?.fullName && (
                  <p className="text-sm text-slate-600 mt-1">
                    Lead: {team.teamLead.fullName}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <Users size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No teams assigned</p>
          </div>
        )}
      </div>

      {/* Deadline Section */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon size={14} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700">Deadline</h3>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">
            {new Date(work.deadline).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className={`text-xs mt-2 font-medium ${getDaysRemaining(work.deadline) === "Overdue" ? "text-red-600" : "text-indigo-600"
            }`}>
            {getDaysRemaining(work.deadline)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Time: {new Date(work.deadline).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export default function CalendarPage() {
  const [works, setWorks] = useState<CalendarWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addWorkModalOpen, setAddWorkModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const calendarRef = useRef<any>(null);

  // Fetch works from API
  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWorks(1, 100, "", statusFilter, priorityFilter);

      if (response?.works?.docs) {
        const formattedWorks: CalendarWork[] = response.works.docs.map((work: any) => ({
          _id: work._id,
          workId: work.workId,
          workTitle: work.workTitle,
          description: work.description || "",
          status: work.status || "pending",
          priority: work.priority || "medium",
          deadline: work.deadline,
          assignToTeamIds: work.assignToTeamIds || [],
          teamNames: work.teamNames || [],
        }));
        setWorks(formattedWorks);
      } else {
        setWorks([]);
      }
    } catch (err: any) {
      console.error("Error fetching works:", err);
      setError(err.message || "Failed to fetch work items");
      toast.error("Failed to load calendar data");
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  // Handle view work click
  const handleViewWork = async (workId: string) => {
    try {
      setLoading(true);
      const response:any = await getWorkById(workId);
      const singleWork = response?.data || response;

      setSelectedWork({
        _id: singleWork._id,
        workId: singleWork.workId,
        workTitle: singleWork.workTitle,
        description: singleWork.description || "",
        status: singleWork.status || "pending",
        priority: singleWork.priority || "medium",
        assignToTeamIds: singleWork.assignToTeamIds || [],
        teamNames: singleWork.teamNames || [],
        teams: singleWork.teams || [],
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

  // Handle date click - opens add work form for future dates
  const handleDateClick = (dateInfo: any) => {
    const clickedDate = new Date(dateInfo.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only allow adding work for future dates (not past dates)
    if (clickedDate >= today) {
      setSelectedDate(clickedDate);
      setAddWorkModalOpen(true);
    } else {
      toast.error("Cannot add work to past dates");
    }
  };



  // Convert works to FullCalendar events with safe priority handling
  const calendarEvents = works.map((work) => ({
    id: work._id,
    title: work.workTitle,
    start: new Date(work.deadline),
    end: new Date(work.deadline),
    allDay: true,
    extendedProps: {
      workId: work.workId,
      status: work.status,
      priority: work.priority || "medium",
      deadline: work.deadline,
      description: work.description,
      work: work,
    },
  }));

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    handleViewWork(clickInfo.event.id);
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // Custom button component for view toggle
  const CustomViewButtons = () => {
    const views = [
      { id: "dayGridMonth", label: "Month", icon: Grid3x3 },
      { id: "timeGridWeek", label: "Week", icon: CalendarDays },
      { id: "timeGridDay", label: "Day", icon: Sun },
      { id: "listWeek", label: "List", icon: List },
      { id: "multiMonthYear", label: "Year", icon: LayoutGrid },
    ];

    const currentView = calendarRef.current?.getApi().view.type;

    return (
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {views.map((view) => {
          const IconComponent = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => calendarRef.current?.getApi().changeView(view.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${currentView === view.id
                ? "bg-white shadow-sm text-indigo-600"
                : "text-slate-600 hover:bg-white/50"
                }`}
            >
              <IconComponent size={16} />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return (
    <>
      <Head>
        <title>Calendar | Command Center</title>
        <meta name="description" content="View and manage your work schedule" />
      </Head>

      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Calendar
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View and manage your work schedule
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showFilters
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                <Filter size={16} />
                Filters
                {(statusFilter !== "all" || priorityFilter !== "all") && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white text-indigo-600 rounded-full text-[10px] font-bold">
                    {(statusFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>

              <button
                onClick={fetchWorks}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                disabled={loading}
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FilterPanel
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                onClear={clearFilters}
              />
            </motion.div>
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Error State */}
          {error && !loading && <ErrorState error={error} onRetry={fetchWorks} />}

          {/* Calendar with FullCalendar */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="mb-4 flex justify-end">
                  <CustomViewButtons />
                </div>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    listPlugin,
                    interactionPlugin,
                    multiMonthPlugin,
                  ]}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "",
                  }}
                  initialView="dayGridMonth"
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  eventContent={renderEventContent}
                  height="calc(100vh - 380px)"
                  stickyHeaderDates={true}
                  nowIndicator={true}
                  editable={false}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={3}
                  weekends={true}
                  views={{
                    dayGridMonth: {
                      titleFormat: { year: "numeric", month: "long" },
                    },
                    timeGridWeek: {
                      titleFormat: { year: "numeric", month: "short", day: "numeric" },
                    },
                    timeGridDay: {
                      titleFormat: { year: "numeric", month: "short", day: "numeric" },
                    },
                    listWeek: {
                      titleFormat: { year: "numeric", month: "long", day: "numeric" },
                    },
                    multiMonthYear: {
                      titleFormat: { year: "numeric" },
                    },
                  }}
                  buttonText={{
                    today: "Today",
                    month: "Month",
                    week: "Week",
                    day: "Day",
                    list: "List",
                  }}
                  locale="en"
                  firstDay={0}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Work Details Modal */}
        <CommonModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedWork(null);
          }}
          title="Work Details"
        >
          {selectedWork && (
            <WorkDetailsContent work={selectedWork} onClose={() => setViewModalOpen(false)} />
          )}
        </CommonModal>

        {/* Add Work Modal */}
        <CommonModal
          isOpen={addWorkModalOpen}
          onClose={() => {
            setAddWorkModalOpen(false);
            setSelectedDate(null);
          }}
          title="Add New Work"
        >
          {selectedDate && (
            <AddWorkForm
              defaultDeadline={selectedDate}
              onClose={() => {
                setAddWorkModalOpen(false);
                fetchWorks();
                setSelectedDate(null);
              }}
            />
          )}
        </CommonModal>
      </DashboardLayout>
    </>
  );
}