
import { createTeamType } from "../../api/lib/request/teamtypesRequest";
import toast from "react-hot-toast";
import { useState } from "react";
import { Tag } from "lucide-react";

interface AddTeamTypeProps {
    onClose: () => void;
    onSubmit?: () => void;
}

export default function AddTeamTypeForm({
    onClose,
    onSubmit,
}: AddTeamTypeProps) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Team Type Name is required");
            return;
        }

        try {
            setIsSubmitting(true);

            await createTeamType({
                name: name.trim(),
            });

            toast.success(
                "Team Type created successfully"
            );

            onSubmit?.();
            onClose();
        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.message ||
                "Failed to create team type"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5"
        >
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                    Team Type Name
                    <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    <input
                        type="text"
                        placeholder="Development"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    {isSubmitting
                        ? "Creating..."
                        : "Create Type"}
                </button>
            </div>
        </form>
    );
}