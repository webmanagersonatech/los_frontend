// components/forms/AddTeamForm.tsx
import toast, { Toaster } from 'react-hot-toast';
import Modal from "../../components/Modal";
import AddTeamMember from "../../components/forms/Addteammembersform";
import { useState, useRef, useEffect } from "react";
import { getAllTeamMembers } from '../../api/lib/request/teammemberRequest';
import { getAllTeamTypes } from '../../api/lib/request/teamtypesRequest';
import AddTeamTypeForm from './Addteamtypeform';
import { createTeam, getTeamById, updateTeam } from '../../api/lib/request/teamsRequest';
import {
    Users,
    Tag,
    Briefcase,
    X,
    UserPlus,
    Check,
    Search,
    Loader,
    ChevronDown,
} from "lucide-react";

interface AddTeamFormProps {
    teamId?: string;
    onClose: () => void;
    onSubmit?: (data: AddTeamFormData) => void;
    existingMembers?: MemberOption[];
}

export interface AddTeamFormData {
    teamName: string;
    teamType: string;
    description: string;
    teamLeadId: string | null;
    memberIds: string[];
}

interface MemberOption {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}



const SelectedMemberChip = ({ member, onRemove }: { member: MemberOption; onRemove: () => void }) => (
    <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-1">
        <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center overflow-hidden">
            {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-[10px] font-medium text-indigo-600">
                    {member.name.charAt(0)}
                </span>
            )}
        </div>
        <span className="text-xs font-medium text-indigo-700">{member.name}</span>
        <button
            type="button"
            onClick={onRemove}
            className="hover:bg-indigo-100 rounded-full p-0.5 transition"
        >
            <X size={12} className="text-indigo-500" />
        </button>
    </div>
);

const MemberListItem = ({
    member,
    isSelected,
    onToggle,
    isTeamLead,
    onTeamLeadSelect,
}: {
    member: MemberOption;
    isSelected: boolean;
    onToggle: () => void;
    isTeamLead: boolean;
    onTeamLeadSelect: () => void;
}) => (
    <div className={`flex items-center justify-between p-2 rounded-lg transition-all duration-150 ${isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
        }`}>
        <div className="flex items-center gap-3 flex-1">
            <button
                type="button"
                onClick={onToggle}
                className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${isSelected
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-slate-300 hover:border-indigo-400"
                    }`}
            >
                {isSelected && <Check size={10} className="text-white" />}
            </button>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs font-medium text-slate-600">
                        {member.name.charAt(0)}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                    {member.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {member.role} • {member.email}
                </p>
            </div>
        </div>

        <button
            type="button"
            onClick={onTeamLeadSelect}
            disabled={!isSelected}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${isTeamLead
                ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                : isSelected
                    ? "bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
                }`}
        >
            {isTeamLead ? "Team Lead" : "Set as Lead"}
        </button>
    </div>
);

export default function AddTeamForm({ teamId, onClose, onSubmit, existingMembers }: AddTeamFormProps) {
    const [formData, setFormData] = useState<AddTeamFormData>({
        teamName: "",
        teamType: "",
        description: "",
        teamLeadId: null,
        memberIds: [],
    });

    const [members, setMembers] = useState<MemberOption[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
    const [isFetchingTeam, setIsFetchingTeam] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const [teamTypes, setTeamTypes] = useState<any[]>([]);
    const [loadingTeamTypes, setLoadingTeamTypes] = useState(false);
    const [isAddTeamTypeOpen, setIsAddTeamTypeOpen] = useState(false);
    const memberDropdownRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {

        const fetchTeamDetails = async () => {

            if (!teamId) return;

            try {

                setIsFetchingTeam(true);

                const response: any = await getTeamById(teamId);

                const team = response.data || response;



                setFormData({
                    teamName: team.teamName || "",
                    teamType: team.teamType || "",
                    description: team.description || "",
                    teamLeadId: team.teamLeadId || null,
                    memberIds:
                        team.memberIds?.map((id: any) =>
                            String(id)
                        ) || [],
                });

            } catch (error) {

                console.error(error);

                toast.error(
                    "Failed to fetch team details"
                );

            } finally {

                setIsFetchingTeam(false);
            }
        };

        fetchTeamDetails();

    }, [teamId]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoadingMembers(true);
                const res = await getAllTeamMembers();

                const formattedMembers: MemberOption[] = res.data.map((m: any) => ({
                    id: String(m.teamMemberId || m.id),
                    name: m.fullName || m.name,
                    email: m.email,
                    role: m.role || "Team Member",
                    avatar: m.photoBase64 || "",
                }));

                setMembers(formattedMembers);
            } catch (err) {
                console.error("Failed to fetch team members:", err);
                toast.error("Failed to load team members");
                setMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        };

        // Use existingMembers if provided, otherwise fetch from backend
        if (existingMembers && existingMembers.length > 0) {
            setMembers(existingMembers);
            setLoadingMembers(false);
        } else {
            fetchMembers();
        }
    }, [existingMembers]);

    const fetchTeamTypes = async () => {
        try {
            setLoadingTeamTypes(true);
            const res = await getAllTeamTypes();

            // Transform the API response to match what the dropdown expects
            const transformedTypes = (res.data || []).map((type: any) => ({
                value: type.name,     // Use name as the value
                label: type.name,     // Use name as the label
                color: "slate"        // Default color (you can make this dynamic)
            }));

            setTeamTypes(transformedTypes);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load team types");
        } finally {
            setLoadingTeamTypes(false);
        }
    };


    useEffect(() => {
        fetchTeamTypes();
    }, []);

    const filteredMembers = members.filter(
        (member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedMembers = members.filter((m) => formData.memberIds.includes(m.id));
    const teamLead = members.find((m) => m.id === formData.teamLeadId);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
            if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
                setIsMemberDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleTypeSelect = (typeValue: string) => {
        setFormData({ ...formData, teamType: typeValue });
        setIsTypeDropdownOpen(false);
        const selectedType = teamTypes.find(t => t.value === typeValue);
        toast.success(`${selectedType?.label} team type selected`);
    };

    const toggleMember = (memberId: string) => {
        setFormData((prev) => {
            const newMemberIds = prev.memberIds.includes(memberId)
                ? prev.memberIds.filter((id) => id !== memberId)
                : [...prev.memberIds, memberId];

            const newTeamLeadId = prev.teamLeadId === memberId && !newMemberIds.includes(memberId)
                ? null
                : prev.teamLeadId;

            const member = members.find(m => m.id === memberId);
            if (newMemberIds.includes(memberId)) {
                toast.success(`${member?.name} added to team`);
            } else if (prev.memberIds.includes(memberId)) {
                toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm`}>
                        {member?.name} removed from team
                    </div>
                ));
            }

            return {
                ...prev,
                memberIds: newMemberIds,
                teamLeadId: newTeamLeadId,
            };
        });
    };

    const setTeamLead = (memberId: string) => {
        if (formData.memberIds.includes(memberId)) {
            setFormData({ ...formData, teamLeadId: memberId });
            const member = members.find(m => m.id === memberId);
            toast.success(`${member?.name} is now the team lead`);
        } else {
            toast.error('Please add this member to the team first before setting as lead');
        }
    };

    const getTypeLabel = (typeValue: string) => {
        // Since value is the name, just return it
        return typeValue;
    };

    const getTypeColor = (typeValue: string) => {
        // Generate color based on the type name
        const colors = ["blue", "purple", "pink", "green", "amber", "indigo", "teal", "slate"];
        const colorIndex = typeValue.length % colors.length;
        const color = colors[colorIndex];

        const colorStyles: Record<string, string> = {
            blue: "bg-blue-50 text-blue-700 border-blue-200",
            purple: "bg-purple-50 text-purple-700 border-purple-200",
            pink: "bg-pink-50 text-pink-700 border-pink-200",
            green: "bg-green-50 text-green-700 border-green-200",
            amber: "bg-amber-50 text-amber-700 border-amber-200",
            indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
            slate: "bg-slate-100 text-slate-700 border-slate-200",
            teal: "bg-teal-50 text-teal-700 border-teal-200",
        };

        return colorStyles[color] || colorStyles.slate;
    };

    const showValidationErrors = () => {
        if (!formData.teamName.trim()) {
            toast.error('Please enter a team name');
            return false;
        }

        if (!formData.teamType) {
            toast.error('Please select a team type');
            return false;
        }

        if (!formData.teamLeadId) {
            toast.error('Please assign a Team Lead');
            return false;
        }

        return true;
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!showValidationErrors()) {
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                teamName: formData.teamName,
                teamType: formData.teamType,
                description: formData.description,
                teamLeadId: formData.teamLeadId,
                memberIds: formData.memberIds,
            };

            if (teamId) {
                await updateTeam(teamId, payload);

                toast.success(
                    `Team "${formData.teamName}" updated successfully!`
                );
            } else {
                await createTeam(payload);

                toast.success(
                    `Team "${formData.teamName}" created successfully!`
                );
            }

            if (onSubmit) {
                onSubmit(formData);
            }

            onClose();

        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.message ||
                (teamId
                    ? "Failed to update team"
                    : "Failed to create team")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingMembers) {
        return (
            <div className="space-y-5">
                <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                        <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Loading team members...</p>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (isFetchingTeam) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-3">
                    <Loader size={40} className="animate-spin text-indigo-600 mx-auto mb-3" />

                    <p className="text-sm text-slate-500">
                        Loading team details...
                    </p>
                </div>
            </div>
        );
    }



    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Team Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Team Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            name="teamName"
                            placeholder="e.g., Frontend Warriors"
                            value={formData.teamName}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 group-hover:border-slate-300"
                        />
                    </div>
                </div>

                {/* Team Type Dropdown */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Team Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={typeDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className={`w-full rounded-lg border bg-white py-2 px-3 text-sm outline-none transition-all duration-200 flex items-center justify-between hover:border-slate-300 ${formData.teamType
                                ? 'border-indigo-300 ring-1 ring-indigo-200'
                                : 'border-slate-200'
                                } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
                        >
                            <div className="flex items-center gap-2">
                                <Tag size={14} className={`${formData.teamType ? 'text-indigo-500' : 'text-slate-400'}`} />
                                {formData.teamType ? (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(formData.teamType)}`}>
                                        {getTypeLabel(formData.teamType)}
                                    </span>
                                ) : (
                                    <span className="text-slate-500">Select team type</span>
                                )}
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isTypeDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="py-1 max-h-64 overflow-y-auto">
                                    {teamTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => handleTypeSelect(type.value)}
                                            className={`w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 ${formData.teamType === type.value ? 'bg-indigo-50' : ''
                                                }`}
                                        >
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(type.value)}`}>
                                                {type.label}
                                            </span>
                                            {formData.teamType === type.value && (
                                                <Check size={14} className="text-indigo-600 ml-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Always show the add button, but only show warning if no type selected */}
                    <div className="flex items-center justify-between mt-2">
                        {!formData.teamType && (
                            <p className="text-[11px] text-amber-600 flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-amber-500"></span>
                                Please select a team type
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setIsTypeDropdownOpen(false);
                                setIsAddTeamTypeOpen(true);
                            }}
                            className={`inline-flex items-center gap-1 text-xs font-medium transition ${!formData.teamType
                                ? 'text-indigo-600 hover:text-indigo-700'
                                : 'text-slate-500 hover:text-indigo-600'
                                }`}
                        >
                            <span className="text-base">+</span>
                            Add Team Type
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        name="description"
                        placeholder="Describe the team's purpose, goals, and responsibilities..."
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none placeholder:text-slate-400"
                    />
                </div>

                {/* Team Members Selection */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                        Team Members
                    </label>

                    {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {selectedMembers.map((member) => (
                                <SelectedMemberChip
                                    key={member.id}
                                    member={member}
                                    onRemove={() => toggleMember(member.id)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="relative" ref={memberDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-none transition-all duration-200 flex items-center justify-between hover:border-slate-300"
                        >
                            <div className="flex items-center gap-2">
                                <UserPlus size={14} className="text-slate-400" />
                                <span className="text-slate-500">
                                    {selectedMembers.length > 0
                                        ? `${selectedMembers.length} member${selectedMembers.length !== 1 ? "s" : ""} selected`
                                        : "Add team members"}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMemberDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isMemberDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                                <div className="p-2 border-b border-slate-100">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {filteredMembers.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                            No members found
                                        </div>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <MemberListItem
                                                key={member.id}
                                                member={member}
                                                isSelected={formData.memberIds.includes(member.id)}
                                                onToggle={() => toggleMember(member.id)}
                                                isTeamLead={formData.teamLeadId === member.id}
                                                onTeamLeadSelect={() => setTeamLead(member.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-slate-400">
                            Select members and choose a team lead
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsAddMemberOpen(true)}
                            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
                        >
                            <UserPlus size={12} />
                            Add Team Member
                        </button>
                    </div>
                </div>

                {teamLead && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center">
                                <Briefcase size={12} className="text-amber-700" />
                            </div>
                            <span className="text-xs font-medium text-amber-700">Team Lead:</span>
                            <span className="text-xs text-amber-800">{teamLead.name}</span>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-indigo-700"
                    >
                        {isSubmitting
                            ? teamId
                                ? "Updating..."
                                : "Creating..."
                            : teamId
                                ? "Update Team"
                                : "Create Team"}
                    </button>
                </div>
            </form>

            <Modal
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                title="Add Team Member"
            >
                <AddTeamMember
                    onClose={async () => {
                        setIsAddMemberOpen(false);

                        // Refresh members after adding
                        try {
                            const res = await getAllTeamMembers();

                            const formattedMembers: MemberOption[] = res.data.map((m: any) => ({
                                id: String(m.teamMemberId || m.id),
                                name: m.fullName || m.name,
                                email: m.email,
                                role: m.role || "Team Member",
                                avatar: m.photoBase64 || "",
                            }));

                            setMembers(formattedMembers);

                            toast.success("Team members refreshed");
                        } catch (err) {
                            console.error(err);
                            toast.error("Failed to refresh members");
                        }
                    }}
                />
            </Modal>

            <Modal
                isOpen={isAddTeamTypeOpen}
                onClose={() =>
                    setIsAddTeamTypeOpen(false)
                }
                title="Add Team Type"
            >
                <AddTeamTypeForm
                    onClose={async () => {
                        setIsAddTeamTypeOpen(false);

                        await fetchTeamTypes();

                        toast.success(
                            "Team types refreshed"
                        );
                    }}
                />
            </Modal>
        </>
    );
}