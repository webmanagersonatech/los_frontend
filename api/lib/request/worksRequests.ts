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

// WORK INTERFACE
export interface Work {
    _id?: string;

    workId?: string;

    workTitle: string;

    assignToTeamIds: string[];

    deadline: string;

    priority?: "low" | "medium" | "high";

    description?: string;

    status?:
    | "pending"
    | "in_progress"
    | "completed"
    | "on_hold"
    | "cancelled";

    createdBy?: string;

    createdAt?: string;

    updatedAt?: string;
}

// PAGINATION RESPONSE
export interface PaginatedResponse<T> {
    success: boolean;

    message?: string;

    works: {
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

// CREATE WORK
export async function createWork(
    data: Work
) {
    try {
        const response = await api.post(
            "/work",
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to create work."
        );
    }
}

// GET WORKS
export async function getWorks(
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    priority = "all"
): Promise<PaginatedResponse<Work>> {
    try {
        const response = await api.get<PaginatedResponse<Work>>(
            `/work?page=${page}&limit=${limit}&search=${search}&status=${status}&priority=${priority}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch works."
        );
    }
}

export const updateWorkStatus = async (
    workId: string,
    status: string
) => {
    const response = await api.put(`/work/${workId}/status`, {
        status,
    });

    return response.data;
};

// GET ALL WORKS
export async function getAllWorks(): Promise<{
    success: boolean;
    data: Pick<
        Work,
        "_id" |
        "workId" |
        "workTitle" |
        "status"
    >[];
}> {
    try {
        const response = await api.get<{
            success: boolean;
            data: Pick<
                Work,
                "_id" |
                "workId" |
                "workTitle" |
                "status"
            >[];
        }>("/work/all");

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch all works."
        );
    }
}

// GET SINGLE WORK
export async function getWorkById(
    id: string
) {
    try {
        const response = await api.get(
            `/work/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch work."
        );
    }
}

// UPDATE WORK
export async function updateWork(
    id: string,
    data: Partial<Work>
) {
    try {
        const response = await api.put(
            `/work/${id}`,
            data
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to update work."
        );
    }
}

// DELETE WORK
export async function deleteWork(
    id: string
) {
    try {
        const response = await api.delete(
            `/work/${id}`
        );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to delete work."
        );
    }
}