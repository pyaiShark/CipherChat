"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Search, Loader2, X, MessageCircle, Plus, Users } from "lucide-react";
import Image from "next/image";
import { formatMessageTimestamp } from "../lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Id } from "../convex/_generated/dataModel";
import { Input } from "@shadcn-ui/input";
import { Badge } from "@shadcn-ui/badge";
import { ScrollArea } from "@shadcn-ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn-ui/avatar";
import { Button } from "@shadcn-ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { CreateGroupModal } from "./CreateGroupModal";

export function Sidebar({
    onSelectUser,
    onSelectConversation,
    activeConversationId,
}: {
    onSelectUser: (userId: string) => void;
    onSelectConversation: (convId: Id<"conversations">) => void;
    activeConversationId: Id<"conversations"> | null;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const users = useQuery(api.users.getUsers);
    const conversations = useQuery(api.conversations.getConversations);

    const filteredUsers = users?.filter((user) => {
        const q = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(q) ||
            (user.username && user.username.toLowerCase().includes(q))
        );
    });

    return (
        <div className="flex flex-col h-full bg-[var(--wa-sidebar-bg)] border-r border-[var(--wa-border)]">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 h-16 shrink-0 bg-[var(--wa-sidebar-header)]">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <h1 className="text-[17px] font-semibold text-[var(--wa-text-primary)] tracking-tight">
                        Chats
                    </h1>
                </div>
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchFocused(true)}
                        className="w-9 h-9 rounded-lg text-[var(--wa-text-light)] hover:bg-[var(--wa-hover)]"
                        aria-label="New chat"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="px-4 py-2.5 shrink-0 flex flex-col gap-2">
                <div
                    className={`relative flex items-center rounded-lg transition-all duration-200 bg-[var(--wa-input-bg)] ${searchFocused ? "ring-1 ring-[var(--wa-search-ring)]/40" : ""
                        }`}
                >
                    <Search
                        className={`absolute left-3.5 w-[15px] h-[15px] transition-colors pointer-events-none z-10 ${searchFocused ? "text-[var(--wa-green)]" : "text-[var(--wa-text-light)]"
                            }`}
                    />
                    <Input
                        type="text"
                        placeholder="Search or start new chat"
                        className="w-full h-10 pl-11 pr-10 text-sm bg-transparent text-[var(--wa-text-primary)] border-none shadow-none outline-none placeholder:text-[var(--wa-text-light)] focus-visible:ring-0 focus-visible:border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => !searchQuery && setSearchFocused(false)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSearchFocused(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-[var(--wa-text-light)] hover:text-[var(--wa-text-primary)] transition-colors" />
                        </button>
                    )}
                </div>
                {!searchFocused && searchQuery.trim() === "" && (
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] px-2 py-1 h-10"
                        onClick={() => setIsCreateGroupOpen(true)}
                    >
                        <div className="w-8 h-8 rounded-full bg-[var(--wa-green)] flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-[15px]">New Group</span>
                    </Button>
                )}
            </div>

            {/* ── List ── */}
            <ScrollArea className="flex-1">
                {!searchFocused && searchQuery.trim() === "" ? (
                    /* ── Conversations ── */
                    conversations === undefined ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-[var(--wa-text-light)]" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--wa-green)]/10 flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-[var(--wa-green)]/40" />
                            </div>
                            <p className="text-sm font-medium text-[var(--wa-text-primary)]/80">
                                No conversations yet
                            </p>
                            <p className="text-xs text-[var(--wa-text-secondary)] mt-1.5 max-w-[200px]">
                                Search for someone above to start a new chat.
                            </p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const isActive = activeConversationId === conv._id;
                            const isGroup = conv.isGroup;
                            const groupName = conv.groupName;

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => onSelectConversation(conv._id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-150 text-left relative group ${isActive
                                        ? "bg-[var(--wa-hover)]"
                                        : "hover:bg-[var(--wa-hover)]"
                                        }`}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[var(--wa-active-indicator)] rounded-r-full" />
                                    )}

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <Avatar className="w-12 h-12">
                                            {isGroup ? (
                                                conv.groupAvatar ? (
                                                    <AvatarImage src={conv.groupAvatar} className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-[#00A884]/20 flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-[var(--wa-green)]" />
                                                    </div>
                                                )
                                            ) : conv.otherUser?.avatar ? (
                                                <AvatarImage src={conv.otherUser.avatar} alt="" />
                                            ) : null}
                                            {!isGroup && (
                                                <AvatarFallback className="bg-[var(--wa-input-bg)] text-base font-semibold text-[var(--wa-text-light)]">
                                                    {conv.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        {/* Group tag badge or Online badge */}
                                        {isGroup ? (
                                            <div className="absolute -bottom-1 -right-1 bg-[var(--wa-sidebar-bg)] rounded-full p-[2px] z-10 flex items-center justify-center shadow-sm">
                                                <div className="bg-[var(--wa-green)] text-white rounded-full p-[3px]">
                                                    <Users className="w-2.5 h-2.5" />
                                                </div>
                                            </div>
                                        ) : conv.otherUser?.isOnline ? (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--wa-online)] border-[2.5px] border-[var(--wa-sidebar-bg)] rounded-full animate-online-pulse z-10" />
                                        ) : null}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 border-b border-[var(--wa-border)]/40 pb-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[15px] font-medium text-[var(--wa-text-primary)] truncate">
                                                {isGroup ? groupName : conv.otherUser?.name}
                                            </span>
                                            {conv.lastMessage && (
                                                <span
                                                    className={`text-[11px] ml-2 shrink-0 ${(conv as any).unreadCount > 0
                                                        ? "text-[var(--wa-green)] font-medium"
                                                        : "text-[var(--wa-text-light)]"
                                                        }`}
                                                >
                                                    {formatMessageTimestamp(
                                                        conv.lastMessage._creationTime
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-[13px] text-[var(--wa-text-secondary)] truncate flex-1 min-w-0 pr-2">
                                                {conv.lastMessage?.content || "No messages yet"}
                                            </p>
                                            {(conv as any).unreadCount > 0 && (
                                                <Badge className="ml-2 bg-[var(--wa-unread-badge)] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 shrink-0 border-none hover:bg-[var(--wa-unread-badge)]">
                                                    {(conv as any).unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )
                ) : (
                    /* ── Search Results ── */
                    users === undefined ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-[var(--wa-text-light)]" />
                        </div>
                    ) : filteredUsers?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <Search className="w-10 h-10 text-[var(--wa-text-light)]/30 mb-3" />
                            <p className="text-sm font-medium text-[var(--wa-text-primary)]/80">
                                No results found
                            </p>
                            <p className="text-xs text-[var(--wa-text-secondary)] mt-1.5">
                                Try a different name or username.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-2">
                                <p className="text-[11px] text-[var(--wa-green)] font-semibold uppercase tracking-wider">
                                    Contacts
                                </p>
                            </div>
                            {filteredUsers?.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => {
                                        onSelectUser(user._id);
                                        setSearchQuery("");
                                        setSearchFocused(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--wa-hover)] transition-colors text-left"
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="w-12 h-12">
                                            {user.avatar ? (
                                                <AvatarImage src={user.avatar} alt="" />
                                            ) : null}
                                            <AvatarFallback className="bg-[var(--wa-input-bg)] text-base font-semibold text-[var(--wa-text-light)]">
                                                {user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {user.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--wa-online)] border-[2.5px] border-[var(--wa-sidebar-bg)] rounded-full z-10" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 border-b border-[var(--wa-border)]/40 pb-3">
                                        <span className="text-[15px] font-medium text-[var(--wa-text-primary)] truncate block">
                                            {user.name}
                                        </span>
                                        <span className="text-[13px] text-[var(--wa-text-secondary)]">
                                            {user.username
                                                ? `@${user.username}`
                                                : user.isOnline
                                                    ? "Online"
                                                    : "Offline"}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </>
                    )
                )}
            </ScrollArea>
            <CreateGroupModal
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                onGroupCreated={(convId) => {
                    onSelectConversation(convId);
                    setSearchFocused(false);
                    setSearchQuery("");
                }}
            />
        </div>
    );
}
