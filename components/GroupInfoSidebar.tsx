"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { X, Users, Loader2, Camera, ShieldAlert } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn-ui/avatar";
import { Button } from "@shadcn-ui/button";
import { ScrollArea } from "@shadcn-ui/scroll-area";
import { toast } from "sonner";
import { Input } from "@shadcn-ui/input";

export function GroupInfoSidebar({
    conversationId,
    onClose,
}: {
    conversationId: Id<"conversations">;
    onClose: () => void;
}) {
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [avatarUrlInput, setAvatarUrlInput] = useState("");
    const [showAvatarInput, setShowAvatarInput] = useState(false);

    // Queries
    const currentUser = useQuery(api.users.getCurrentUser);
    const conversations = useQuery(api.conversations.getConversations);
    const members = useQuery(api.conversations.getGroupMembers, { conversationId });
    const updateAvatar = useMutation(api.conversations.updateGroupAvatar);

    // Get current group details
    const group = conversations?.find((c) => c._id === conversationId);

    if (!group || !group.isGroup) return null;

    const isAdmin = currentUser?._id === group.adminId;

    const handleUpdateAvatar = async () => {
        if (!avatarUrlInput.trim()) return;

        setIsUpdatingAvatar(true);
        try {
            await updateAvatar({
                conversationId,
                avatarUrl: avatarUrlInput.trim(),
            });
            toast.success("Group avatar updated");
            setShowAvatarInput(false);
        } catch (error: any) {
            console.error("Failed to update avatar", error);
            toast.error(error.message || "Failed to update avatar");
        } finally {
            setIsUpdatingAvatar(false);
            setAvatarUrlInput("");
        }
    };

    return (
        <div className="w-full md:w-[350px] lg:w-[400px] h-full bg-[var(--wa-sidebar-bg)] border-l border-[var(--wa-border)] flex flex-col shrink-0 transform transition-transform duration-300 animate-in slide-in-from-right relative z-20">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 h-16 bg-[var(--wa-sidebar-header)] shrink-0 shadow-sm z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="w-9 h-9 -ml-2 rounded-lg text-[var(--wa-text-light)] hover:bg-[var(--wa-hover)]"
                >
                    <X className="w-5 h-5" />
                </Button>
                <h2 className="text-[16px] font-semibold text-[var(--wa-text-primary)] tracking-tight">
                    Group Info
                </h2>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
                {/* Profile Section */}
                <div className="flex flex-col items-center py-8 px-6 bg-[var(--wa-sidebar-bg)] shadow-sm mb-2 relative">
                    <div className="relative group/avatar cursor-pointer w-40 h-40 mb-5">
                        <Avatar className="w-full h-full shadow-md transition-transform duration-200 group-hover/avatar:scale-[1.02]">
                            {group.groupAvatar ? (
                                <AvatarImage src={group.groupAvatar} className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#00A884]/20 flex items-center justify-center">
                                    <Users className="w-20 h-20 text-[var(--wa-green)]" />
                                </div>
                            )}
                        </Avatar>

                        {/* Admin Avatar Overlay */}
                        {isAdmin && (
                            <div
                                onClick={() => setShowAvatarInput(!showAvatarInput)}
                                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200"
                            >
                                <Camera className="w-8 h-8 text-white mb-2" />
                                <span className="text-white text-xs font-medium uppercase tracking-wider">Change DP</span>
                            </div>
                        )}
                    </div>

                    {showAvatarInput && isAdmin && (
                        <div className="w-full bg-[var(--wa-hover)] rounded-xl p-3 mb-4 animate-in fade-in zoom-in-95 duration-200 border border-[var(--wa-border)]">
                            <p className="text-xs text-[var(--wa-text-secondary)] mb-2 uppercase font-medium tracking-wide">Enter Image URL</p>
                            <div className="flex flex-col gap-2">
                                <Input
                                    placeholder="https://..."
                                    className="h-9 text-sm bg-[var(--wa-input-bg)] border-none focus-visible:ring-1 focus-visible:ring-[var(--wa-green)]"
                                    value={avatarUrlInput}
                                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setShowAvatarInput(false)} className="h-8 text-xs hover:bg-[var(--wa-input-bg)]">Cancel</Button>
                                    <Button size="sm" onClick={handleUpdateAvatar} disabled={isUpdatingAvatar || !avatarUrlInput.trim()} className="h-8 text-xs bg-[var(--wa-green)] hover:bg-[var(--wa-green-dark)] text-white">
                                        {isUpdatingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <h1 className="text-2xl font-bold text-[var(--wa-text-primary)] tracking-tight mb-1 text-center">
                        {group.groupName}
                    </h1>
                    <p className="text-[15px] text-[var(--wa-text-secondary)]">
                        Group • {group.participantIds.length} members
                    </p>
                </div>

                {/* Members List */}
                <div className="bg-[var(--wa-sidebar-bg)] shadow-sm min-h-full pb-8">
                    <div className="px-5 py-4 border-b border-[var(--wa-border)]/50">
                        <p className="text-[13px] text-[var(--wa-green)] font-semibold uppercase tracking-wider">
                            {members?.length || 0} participants
                        </p>
                    </div>

                    <div className="flex flex-col">
                        {members === undefined ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--wa-text-light)]/50" />
                            </div>
                        ) : (
                            members.map((member) => {
                                const isMemberAdmin = member._id === group.adminId;
                                const isMe = currentUser?._id === member._id;

                                return (
                                    <div
                                        key={member._id}
                                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--wa-hover)] transition-colors group/member relative overflow-hidden"
                                    >
                                        <div className="relative shrink-0 z-10">
                                            <Avatar className="w-12 h-12">
                                                {member.avatar ? (
                                                    <AvatarImage src={member.avatar} />
                                                ) : null}
                                                <AvatarFallback className="bg-[var(--wa-input-bg)] text-base font-semibold text-[var(--wa-text-light)]">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {member.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--wa-online)] border-[2.5px] border-[var(--wa-sidebar-bg)] rounded-full z-10 group-hover/member:border-[var(--wa-hover)] transition-colors" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 z-10 flex flex-col justify-center border-b border-[var(--wa-border)]/20 pb-1 group-last/member:border-none">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[16px] font-medium text-[var(--wa-text-primary)] truncate block">
                                                    {isMe ? "You" : member.name}
                                                </span>
                                                {isMemberAdmin && (
                                                    <div className="flex items-center gap-1 bg-[#00A884]/10 text-[#00A884] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider float-right uppercase">
                                                        <span>Admin</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[13px] text-[var(--wa-text-secondary)] truncate">
                                                {member.username ? `@${member.username}` : (member.isOnline ? "Online" : "Offline")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
