import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// REQUEST INTERCEPTOR
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

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== "undefined") {
            const status = error?.response?.status;
            const message = error?.response?.data?.message;

            if (
                status === 401 ||
                message === "SESSION_EXPIRED" ||
                message === "Token invalid" ||
                message === "Not authorized"
            ) {
                localStorage.removeItem("token");

                window.location.href = "/";
            }
        }

        return Promise.reject(error);
    }
);

// TEAM INTERFACE
export interface Team {
    _id?: string;

    teamId?: string;

    teamName: string;

    teamType: string;

    description?: string;

    teamLeadId: string | null;

    memberIds: string[];

    status?: "active" | "inactive";

    createdAt?: string;

    updatedAt?: string;
}

// TEAM MEMBER INTERFACE
export interface TeamMember {
    _id?: string;

    fullName: string;

    email: string;

    role: string;
}

// PAGINATION RESPONSE
export interface PaginatedResponse<T> {
    success: boolean;

    message?: string;

    teams: {
        docs: T[];

        totalDocs: number;

        limit: number;

        totalPages: number;

        page: number;

        pagingCounter: number;

        hasPrevPage: boolean;

        hasNextPage: boolean;

        prevPage: number | null;

        nextPage: number | null;
    };
}

// CREATE TEAM
export async function createTeam(data: Team) {
    try {
        const response = await api.post(
            "/teams",
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to create team."
        );
    }
}

// GET TEAMS
export async function getTeams(
    page = 1,
    limit = 10,
    search = "",
    status = "all"
): Promise<PaginatedResponse<Team>> {
    try {
        const response = await api.get<PaginatedResponse<Team>>(
            `/teams?page=${page}&limit=${limit}&search=${search}&status=${status}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch teams."
        );
    }
}

// GET ALL TEAMS
export async function getAllTeams(): Promise<{
    success: boolean;
    data: Team[];
}> {
    try {
        const response = await api.get<{
            success: boolean;
            data: Team[];
        }>("/teams/all");

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch all teams."
        );
    }
}
// GET SINGLE TEAM
export async function getTeamById(
    id: string
) {
    try {
        const response = await api.get(
            `/teams/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch team."
        );
    }
}

// UPDATE TEAM
export async function updateTeam(
    id: string,
    data: Partial<Team>
) {
    try {
        const response = await api.put(
            `/teams/${id}`,
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to update team."
        );
    }
}

// DELETE TEAM
export async function deleteTeam(
    id: string
) {
    try {
        const response = await api.delete(
            `/teams/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to delete team."
        );
    }
}