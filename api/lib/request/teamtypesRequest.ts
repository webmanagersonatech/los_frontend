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

export interface TeamType {
    _id?: string;
    name: string;
    status?: "active" | "inactive";
    createdAt?: string;
    updatedAt?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message?: string;
    teamTypes: {
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

// CREATE TEAM TYPE
export async function createTeamType(
    data: TeamType
) {
    try {
        const response = await api.post(
            "/team-types",
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to create team type."
        );
    }
}

// GET TEAM TYPES (PAGINATED)
export async function getTeamTypes(
    page = 1,
    limit = 10,
    search = "",
    status = "all"
): Promise<PaginatedResponse<TeamType>> {
    try {
        const response =
            await api.get<
                PaginatedResponse<TeamType>
            >(
                `/team-types?page=${page}&limit=${limit}&search=${search}&status=${status}`
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch team types."
        );
    }
}

// GET ALL TEAM TYPES
export async function getAllTeamTypes(): Promise<{
    success: boolean;
    data: TeamType[];
}> {
    try {
        const response: any = await api.get(
            "/team-types/all"
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch team types."
        );
    }
}

// GET SINGLE TEAM TYPE
export async function getTeamTypeById(
    id: string
) {
    try {
        const response: any = await api.get(
            `/team-types/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch team type."
        );
    }
}

// UPDATE TEAM TYPE
export async function updateTeamType(
    id: string,
    data: Partial<TeamType>
) {
    try {
        const response = await api.put(
            `/team-types/${id}`,
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to update team type."
        );
    }
}

// DELETE TEAM TYPE
export async function deleteTeamType(
    id: string
) {
    try {
        const response = await api.delete(
            `/team-types/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to delete team type."
        );
    }
}