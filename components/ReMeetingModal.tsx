// components/ReMeetingModal.tsx
import { useState, useEffect } from "react";
import Modal from "./Modal";
import { 
    Calendar, 
    Clock, 
    CheckCircle, 
    Circle, 
    Loader, 
    Edit3, 
    Save, 
    X,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { getReMeetingById, updateReMeeting } from "../api/lib/request/meetingRequest";
import toast from "react-hot-toast";

interface ReMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    meetingId: string;
    reMeetingId: string;
    onUpdate?: () => void;
}

export default function ReMeetingModal({ 
    isOpen, 
    onClose, 
    meetingId, 
    reMeetingId,
    onUpdate 
}: ReMeetingModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [meeting, setMeeting] = useState<any>(null);
    const [reMeeting, setReMeeting] = useState<any>(null);
    const [formData, setFormData] = useState({
        dateTime: "",
        description: "",
        notes: "",
        completed: false
    });

    useEffect(() => {
        if (isOpen && meetingId && reMeetingId) {
            fetchReMeeting();
        }
    }, [isOpen, meetingId, reMeetingId]);

    const fetchReMeeting = async () => {
        try {
            setLoading(true);
            const response = await getReMeetingById(meetingId, reMeetingId);
            if (response.success) {
                setMeeting(response.data);
                const rm = response.data.reMeeting;
                setReMeeting(rm);
                
                setFormData({
                    dateTime: rm.dateTime?.slice(0, 16) || "",
                    description: rm.description || "",
                    notes: rm.notes || "",
                    completed: rm.completed || false
                });
            }
        } catch (error: any) {
            console.error("Error fetching re-meeting:", error);
            toast.error(error?.message || "Failed to load session");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.dateTime) {
            toast.error("Please select date and time");
            return;
        }

        setSaving(true);
        try {
            await updateReMeeting(meetingId, reMeetingId, {
                dateTime: formData.dateTime,
                description: formData.description,
                completed: formData.completed,
                notes: formData.notes
            });

            toast.success("Session updated successfully");
            setIsEditing(false);
            await fetchReMeeting();
            onUpdate?.();
        } catch (error: any) {
            console.error("Error updating session:", error);
            toast.error(error?.message || "Failed to update session");
        } finally {
            setSaving(false);
        }
    };

    const toggleCompleted = () => {
        setFormData({ ...formData, completed: !formData.completed });
    };

    const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) return "";
        return new Date(dateTimeString).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Session Details">
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader size={32} className="animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Meeting Title */}
                    <div className="pb-3 border-b border-gray-200">
                        <p className="text-xs text-gray-500">Meeting</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {meeting?.meetingTitle || "Loading..."}
                        </p>
                    </div>

                    {/* Session Header with Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-700">Session Details</h3>
                            {!isEditing && (
                                formData.completed ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                        <CheckCircle size={10} /> Completed
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                        <Circle size={10} /> Pending
                                    </span>
                                )
                            )}
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition"
                            >
                                <Edit3 size={12} />
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            {/* Date & Time */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.dateTime}
                                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Completed Toggle */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <button
                                    type="button"
                                    onClick={toggleCompleted}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                                        formData.completed 
                                            ? "bg-green-50 text-green-700 border border-green-200" 
                                            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                    }`}
                                >
                                    {formData.completed ? (
                                        <>
                                            <ToggleRight size={18} className="text-green-600" />
                                            <span>Mark as Pending</span>
                                        </>
                                    ) : (
                                        <>
                                            <ToggleLeft size={18} className="text-yellow-600" />
                                            <span>Mark as Completed</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formData.completed 
                                        ? "This session is marked as completed" 
                                        : "This session is pending completion"}
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter session description..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Enter meeting notes..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader size={14} className="animate-spin inline mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} className="inline mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchReMeeting();
                                    }}
                                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                                >
                                    <X size={14} className="inline mr-2" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Date & Time */}
                            <div className="flex items-start gap-3">
                                <Calendar size={16} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Date & Time</p>
                                    <p className="text-sm text-gray-800">
                                        {formatDateTime(reMeeting?.dateTime)}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-start gap-3">
                                {formData.completed ? (
                                    <CheckCircle size={16} className="text-green-500 mt-0.5" />
                                ) : (
                                    <Circle size={16} className="text-yellow-500 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className={`text-sm font-medium ${formData.completed ? "text-green-700" : "text-yellow-700"}`}>
                                        {formData.completed ? "Completed" : "Pending"}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {reMeeting?.description && (
                                <div className="flex items-start gap-3">
                                    <Clock size={16} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Description</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {reMeeting.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {reMeeting?.notes && (
                                <div className="flex items-start gap-3">
                                    <div className="w-4"></div>
                                    <div>
                                        <p className="text-xs text-gray-500">Notes</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {reMeeting.notes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* No Data */}
                            {!reMeeting?.description && !reMeeting?.notes && (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    No additional details available
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}