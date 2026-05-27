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

// TEAM MEMBER INTERFACE
export interface TeamMember {
    _id?: string;
    teamMemberId?: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    photoBase64?: string;
    status?: "active" | "inactive";
    createdAt?: string;
    updatedAt?: string;
}

// PAGINATION RESPONSE
export interface PaginatedResponse<T> {
    success: boolean;

    message?: string;

    teamMembers: {
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

// CREATE TEAM MEMBER
export async function createTeamMember(
    data: TeamMember
) {
    try {
        const response = await api.post(
            "/team-member",
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to create team member."
        );
    }
}

// GET TEAM MEMBERS
export async function getTeamMembers(
    page = 1,
    limit = 10,
    search = "",
    status = "all"
): Promise<PaginatedResponse<TeamMember>> {
    try {
        const response = await api.get<PaginatedResponse<TeamMember>>(
            `/team-member?page=${page}&limit=${limit}&search=${search}&status=${status}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch team members."
        );
    }
}
// GET ALL TEAM MEMBERS (ONLY REQUIRED FIELDS)
// GET ALL TEAM MEMBERS
export async function getAllTeamMembers(): Promise<{
    success: boolean;
    data: Pick<
        TeamMember,
        "_id" | "fullName" | "phone" | "teamMemberId"
    >[];
}> {
    try {
        const response = await api.get<{
            success: boolean;
            data: Pick<
                TeamMember,
                "_id" | "fullName" | "phone" | "teamMemberId"
            >[];
        }>("/team-member/all");

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch all team members."
        );
    }
}
// GET SINGLE TEAM MEMBER
export async function getTeamMemberById(
    id: string
) {
    try {
        const response = await api.get(
            `/team-member/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch team member."
        );
    }
}

// UPDATE TEAM MEMBER
export async function updateTeamMember(
    id: string,
    data: Partial<TeamMember>
) {
    try {
        const response = await api.put(
            `/team-member/${id}`,
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to update team member."
        );
    }
}

// DELETE TEAM MEMBER
export async function deleteTeamMember(
    id: string
) {
    try {
        const response = await api.delete(
            `/team-member/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to delete team member."
        );
    }
}