import axios from "axios";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type":
            "application/json",
    },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        if (
            typeof window !==
            "undefined"
        ) {
            const token =
                localStorage.getItem(
                    "token"
                );

            if (token) {
                config.headers =
                    config.headers || {};

                config.headers.Authorization =
                    `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) =>
        Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof window !==
            "undefined"
        ) {
            const status =
                error?.response?.status;

            const message =
                error?.response?.data
                    ?.message;

            if (
                status === 401 ||
                message ===
                "SESSION_EXPIRED" ||
                message ===
                "Token invalid" ||
                message ===
                "Not authorized"
            ) {
                localStorage.removeItem(
                    "token"
                );

                window.location.href =
                    "/";
            }
        }

        return Promise.reject(error);
    }
);

//
// INTERFACES
//

export interface ReMeetingPoint {
    description: string;
    completed: boolean;
}

export interface ReMeeting {
    _id?: string;  // Add this
    dateTime: string;
    description: string;
    completed: boolean;
    notes?: string;  // Add this
    points?: string[];  // Add this for simple points array
    createdAt?: string;
    updatedAt?: string;
}

export interface Meeting {
    _id?: string;
    meetingId?: string;
    meetingTitle: string;
    description?: string;
    assignToTeamIds: string[];
    dateTime: string;
    reMeetings?: ReMeeting[];
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
    teams?: any[];
}

//
// PAGINATION RESPONSE
//

export interface PaginatedMeetingResponse {
    success: boolean;
    meetings: {
        docs: Meeting[];
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

//
// CREATE MEETING
//

export async function createMeeting(
    data: Meeting
) {
    try {
        const response =
            await api.post(
                "/meeting",
                data
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to create meeting."
        );
    }
}

//
// GET MEETINGS
//

export async function getMeetings(
    page = 1,
    limit = 10,
    search = ""
): Promise<PaginatedMeetingResponse> {
    try {
        const response =
            await api.get<PaginatedMeetingResponse>(
                `/meeting?page=${page}&limit=${limit}&search=${search}`
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to fetch meetings."
        );
    }
}

//
// GET ALL MEETINGS
//

export async function getAllMeetings(): Promise<{
    success: boolean;
    data: Meeting[];
}> {
    try {
        const response:any =
            await api.get(
                "/meeting/all"
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to fetch meetings."
        );
    }
}

//
// GET SINGLE MEETING
//

export async function getMeetingById(
    id: string
) {
    try {
        const response =
            await api.get(
                `/meeting/${id}`
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to fetch meeting."
        );
    }
}

//
// GET MEETING RE-MEETINGS (ONLY RE-MEETINGS ARRAY)
//

// Add this to your meetingRequest.ts

export async function getReMeetingById(
    meetingId: string,
    reMeetingId: string
): Promise<{
    success: boolean;
    data: {
        meetingId: string;
        meetingTitle: string;
        reMeeting: ReMeeting;
    };
}> {
    try {
        const response :any = await api.get(
            `/meeting/${meetingId}/re-meetings/${reMeetingId}`
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to fetch re-meeting details."
        );
    }
}

//
// UPDATE MEETING
//

export async function updateMeeting(
    id: string,
    data: Partial<Meeting>
) {
    try {
        const response =
            await api.put(
                `/meeting/${id}`,
                data
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to update meeting."
        );
    }
}

//
// DELETE MEETING
//

export async function deleteMeeting(
    id: string
) {
    try {
        const response =
            await api.delete(
                `/meeting/${id}`
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to delete meeting."
        );
    }
}

//
// ADD RE-MEETING
//

export async function addReMeeting(
    meetingId: string,
    data: {
        dateTime: string;
        description: string;
        completed: boolean;
        notes?: string;
    }
) {
    try {
        const response =
            await api.post(
                `/meeting/${meetingId}/re-meeting`,
                data
            );

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data
                ?.message ||
            "Failed to add re-meeting."
        );
    }
}

export async function updateReMeeting(
    meetingId: string,
    reMeetingId: string,
    data: {
        dateTime?: string;
        description?: string;
        completed?: boolean;
        notes?: string;
    }
) {
    try {
        const response = await api.put(
            `/meeting/${meetingId}/re-meetings/${reMeetingId}`,
            data
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to update re-meeting."
        );
    }
}

export async function deleteReMeeting(
    meetingId: string,
    reMeetingId: string
) {
    try {
        const response = await api.delete(
            `/meeting/${meetingId}/re-meetings/${reMeetingId}`
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to delete re-meeting."
        );
    }
}


//
// UPDATE RE-MEETING NOTES
//

export async function updateReMeetingNotes(
    meetingId: string,
    reMeetingId: string,
    notes: string
) {
    try {
        const response = await api.put(
            `/meeting/${meetingId}/re-meetings/${reMeetingId}/notes`,
            { notes }
        );
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message ||
            "Failed to update re-meeting notes."
        );
    }
}





