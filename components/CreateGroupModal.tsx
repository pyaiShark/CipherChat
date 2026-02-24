"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { X, Loader2, Users } from "lucide-react";
import { Button } from "@shadcn-ui/button";
import { Input } from "@shadcn-ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@shadcn-ui/avatar";
import { toast } from "sonner";

export function CreateGroupModal({
    isOpen,
    onClose,
    onGroupCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: (convId: Id<"conversations">) => void;
}) {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(new Set());
    const [isCreating, setIsCreating] = useState(false);

    const users = useQuery(api.users.getUsers);
    const createGroup = useMutation(api.conversations.createGroup);

    if (!isOpen) return null;

    const toggleUser = (userId: Id<"users">) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        // Wait, minimum of 3 participants means admin + 2 selected members.
        if (selectedUsers.size < 2) {
            toast.error("Please select at least 2 members for the group");
            return;
        }

        setIsCreating(true);
        try {
            const convId = await createGroup({
                name: groupName.trim(),
                members: Array.from(selectedUsers),
            });
            toast.success("Group created successfully!");
            onGroupCreated(convId);
            onClose();
            setGroupName("");
            setSelectedUsers(new Set());
        } catch (error: any) {
            console.error("Failed to create group", error);
            toast.error(error.message || "Failed to create group");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--wa-bg)] w-full max-w-md rounded-2xl shadow-xl border border-[var(--wa-border)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--wa-border)]">
                    <h2 className="text-lg font-semibold text-[var(--wa-text-primary)]">Create Group</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-[var(--wa-text-light)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] rounded-full h-8 w-8"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-[var(--wa-text-secondary)] mb-1.5 block">
                            Group Name
                        </label>
                        <Input
                            placeholder="Enter group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-[var(--wa-input-bg)] border-none text-[var(--wa-text-primary)] h-11"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-[var(--wa-text-secondary)] mb-1.5 block">
                            Select Members ({selectedUsers.size} selected)
                        </label>
                        <div className="border border-[var(--wa-border)] rounded-xl overflow-hidden bg-[var(--wa-sidebar-bg)]">
                            <div className="max-h-60 overflow-y-auto w-full">
                                {users === undefined ? (
                                    <div className="flex justify-center p-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-[var(--wa-text-light)]" />
                                    </div>
                                ) : users.length === 0 ? (
                                    <p className="text-center text-sm text-[var(--wa-text-light)] p-6">No users found</p>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleUser(user._id)}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--wa-hover)] cursor-pointer transition-colors border-b border-[var(--wa-border)]/50 last:border-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user._id)}
                                                onChange={() => { }}
                                                className="w-4 h-4 rounded-sm border-[var(--wa-border)] text-[var(--wa-green)] focus:ring-[var(--wa-green)] focus:ring-offset-0 bg-transparent"
                                            />
                                            <Avatar className="w-9 h-9">
                                                {user.avatar ? (
                                                    <AvatarImage src={user.avatar} />
                                                ) : null}
                                                <AvatarFallback className="bg-[var(--wa-input-bg)] text-xs text-[var(--wa-text-primary)]">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-medium text-[var(--wa-text-primary)] truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-[12px] text-[var(--wa-text-secondary)] truncate">
                                                    {user.username ? `@${user.username}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {selectedUsers.size > 0 && selectedUsers.size < 2 && (
                            <p className="text-xs text-[var(--wa-danger)] mt-2">
                                Please select at least 2 members to create a group.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--wa-border)] bg-[var(--wa-sidebar-header)] rounded-b-2xl flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating || selectedUsers.size < 2 || !groupName.trim()}
                        className="bg-[var(--wa-green)] hover:bg-[var(--wa-green-dark)] text-white gap-2"
                    >
                        {isCreating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Users className="w-4 h-4" />
                        )}
                        Create Group
                    </Button>
                </div>
            </div>
        </div>
    );
}
