import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        const message = error.response?.data?.message;

        if (
          message === "Session expired. Please login again." ||
          message === "Token invalid" ||
          message === "Not authorized"
        ) {
          localStorage.removeItem("token");

          alert("Session expired. Please login again.");

          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

// types/dashboard.ts

export interface DashboardSummary {
  totalTeams: number;
  activeTeams: number;
  inactiveTeams: number;
  totalWorks: number;
  completionRate: string;
}

export interface WorkStatus {
  pending: number;
  inProgress: number;
  completed: number;
  onHold: number;
  cancelled: number;
}

export interface WorkPriority {
  low: number;
  medium: number;
  high: number;
}

export interface DeadlineStatus {
  today: number;
  upcoming: number;
  overdue: number;
}

export interface TodayActivity {
  teamsCreated: number;
  worksCreated: number;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  teamType: string;
  teamLeadId: string;
  memberCount: number;
  status: string;
  totalWorks: number;
  completedWorks: number;
  pendingWorks: number;
  inProgressWorks: number;
  onHoldWorks: number;
  completionRate: number;
}

export interface Team {
  teamId: string;
  teamName: string;
  teamType: string;
  teamLeadId?: string;
  memberIds?: string[];
  status?: string;
}

export interface RecentWork {
  workId: string;
  workTitle: string;
  assignToTeamIds: string[];
  deadline: string;
  priority: "low" | "medium" | "high";
  description?: string;
  status: "pending" | "in_progress" | "completed" | "on_hold" | "cancelled";
  createdAt: string;
  updatedAt: string;
  teams: Team[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RecentWorksData {
  data: RecentWork[];
  pagination: PaginationInfo;
}

export interface DashboardData {
  summary: DashboardSummary;
  workStatus: WorkStatus;
  workPriority: WorkPriority;
  deadlineStatus: DeadlineStatus;
  todayActivity: TodayActivity;
  teamPerformance: TeamPerformance[];
  recentWorks: RecentWorksData;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

// ---------------- API Calls ----------------

/**
 * Fetch Dashboard Data
 * Automatically applies role-based filters on the backend
 */
export async function getDashboardData({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
} = {}): Promise<DashboardData> {
  try {
    const params = new URLSearchParams();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);


    const response = await api.get<DashboardResponse>(
      `/dashboard?${params.toString()}`
    );

    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch dashboard data."
    );
  }
}