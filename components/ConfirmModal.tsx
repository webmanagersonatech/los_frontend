import Modal from "./Modal";
import {
    Trash2,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    loading?: boolean;

    // NEW
    type?: "delete" | "status" | "warning";
    confirmText?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure?",
    loading = false,
    type = "warning",
    confirmText,
}: ConfirmModalProps) {

    const config = {
        delete: {
            icon: Trash2,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            button: "bg-red-600 hover:bg-red-700",
            text: confirmText || "Delete",
            loadingText: "Deleting...",
        },

        status: {
            icon: CheckCircle2,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700",
            text: confirmText || "Update",
            loadingText: "Updating...",
        },

        warning: {
            icon: AlertTriangle,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700",
            text: confirmText || "Confirm",
            loadingText: "Processing...",
        },
    };

    const current = config[type];

    const Icon = current.icon;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="space-y-5">
                <div className="flex items-center justify-center">
                    <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center ${current.iconBg}`}
                    >
                        <Icon
                            className={current.iconColor}
                            size={26}
                        />
                    </div>
                </div>

                <p className="text-sm text-slate-600 text-center">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition ${current.button}`}
                    >
                        {loading
                            ? current.loadingText
                            : current.text}
                    </button>
                </div>
            </div>
        </Modal>
    );
}