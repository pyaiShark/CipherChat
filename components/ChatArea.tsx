"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
    Send,
    ArrowLeft,
    Loader2,
    ChevronDown,
    Trash2,
    Smile,
    Paperclip,
    Mic,
    Users,
    Check,
    CheckCircle2,
    Circle,
} from "lucide-react";
import { formatMessageTimestamp } from "../lib/utils";
import { Input } from "@shadcn-ui/input";
import { Button } from "@shadcn-ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@shadcn-ui/avatar";
import { toast } from "sonner";
import { GroupInfoSidebar } from "./GroupInfoSidebar";

// Utility to check if a string contains ONLY emojis
const isOnlyEmojis = (text: string) => /^\p{Emoji_Presentation}+$/u.test(text);

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export function ChatArea({
    conversationId,
    onBack,
}: {
    conversationId: Id<"conversations">;
    onBack: () => void;
}) {
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [reactionsPopupMessageId, setReactionsPopupMessageId] = useState<Id<"messages"> | null>(null);
    const [swipedMessageId, setSwipedMessageId] = useState<Id<"messages"> | null>(null);
    const touchStartXRef = useRef<number>(0);
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const sendMessage = useMutation(api.messages.sendMessage);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const currentUser = useQuery(api.users.getCurrentUser);
    const markAsRead = useMutation(api.messages.markAsRead);
    const markAsDelivered = useMutation(api.messages.markAsDelivered);
    const conversations = useQuery(api.conversations.getConversations);

    // Find the other user or group info from conversations
    const currentConv = conversations?.find((c) => c._id === conversationId);
    const isGroup = currentConv?.isGroup;
    const groupName = currentConv?.groupName;
    const otherUser = currentConv?.otherUser;
    const participantCount = currentConv?.participantIds?.length || 0;

    // Typing indicators
    const setTyping = useMutation(api.typing.setTyping);
    const typingUsers = useQuery(api.typing.getTypingUsers, { conversationId });
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
    };

    const handleTyping = (text: string) => {
        setNewMessage(text);
        if (!text.trim()) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            setTyping({ conversationId, isTyping: false }).catch(console.error);
            return;
        }
        if (!typingTimeoutRef.current) {
            setTyping({ conversationId, isTyping: true }).catch(console.error);
        } else {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setTyping({ conversationId, isTyping: false }).catch(console.error);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    // Create a mutable ref to track if user just sent a message
    const isSendingRef = useRef(false);

    // Auto-scroll logic
    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const container = scrollContainerRef.current;
        const bottom = bottomRef.current;
        if (!container || !bottom) return;

        // On initial load or new message, wait a tiny bit for React 
        // to finish calculating DOM heights before jumping.
        const timer = setTimeout(() => {
            requestAnimationFrame(() => {
                bottom.scrollIntoView({ behavior: "instant" });
                isSendingRef.current = false;
            });
        }, 100);

        if (conversationId) {
            markAsRead({ conversationId }).catch(console.error);
        }

        // Check for undelivered messages and mark them as delivered
        if (currentUser && messages) {
            const undeliveredIds = messages
                .filter(m => m.senderId !== currentUser._id && !(m.deliveredTo || []).includes(currentUser._id))
                .map(m => m._id);
            if (undeliveredIds.length > 0) {
                markAsDelivered({ messageIds: undeliveredIds }).catch(console.error);
            }
        }

        return () => clearTimeout(timer);
    }, [messages?.length, conversationId, markAsRead, markAsDelivered, currentUser]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;
        const content = newMessage.trim();
        setNewMessage("");
        setIsSending(true);

        // Mark that user is sending a message right now to force auto-scroll
        isSendingRef.current = true;
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        setTyping({ conversationId, isTyping: false }).catch(console.error);
        try {
            await sendMessage({ conversationId, content });
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message. Please check your connection and try again.");
            // Optionally restore the message text so user doesn't lose it
            setNewMessage(content);
        } finally {
            setIsSending(false);
        }
    };

    const handleSendEmojiDirectly = async (emoji: string) => {
        setIsSending(true);

        // Mark that user is sending a message right now to force auto-scroll
        isSendingRef.current = true;
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        setTyping({ conversationId, isTyping: false }).catch(console.error);

        try {
            await sendMessage({
                conversationId,
                content: emoji,
            });
            setShowInputEmojiPicker(false);
        } catch (error) {
            console.error("Failed to send emoji", error);
            toast.error("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleReaction = async (messageId: Id<"messages">, emoji: string) => {
        try {
            await toggleReaction({ messageId, emoji });
            setReactionsPopupMessageId(null);
        } catch (error) {
            console.error("Failed to toggle reaction", error);
            toast.error("Failed to add reaction.");
        }
    };

    const handleDeleteMessage = async (messageId: Id<"messages">) => {
        try {
            await deleteMessage({ messageId });
            setSwipedMessageId(null);
        } catch (error) {
            console.error("Failed to delete message", error);
            toast.error("Failed to delete message.");
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden relative">
            {/* Main Chat Area */}
            <div className={`flex flex-col h-full bg-[var(--wa-chat-bg)] relative transition-all duration-300 ${showGroupInfo && isGroup ? "hidden lg:flex lg:flex-1" : "flex-1"}`}>
                {/* ── Header ── */}
                <div
                    className={`flex items-center justify-between px-3 h-14 bg-[var(--wa-header)] shrink-0 z-10 ${isGroup ? 'cursor-pointer hover:bg-[var(--wa-hover)]' : ''}`}
                    onClick={() => {
                        if (isGroup) setShowGroupInfo(!showGroupInfo);
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Back button (mobile) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="md:hidden p-1.5 -ml-1 rounded-lg text-[var(--wa-text-on-header)] hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        {/* User avatar */}
                        <Avatar className="w-10 h-10">
                            {isGroup ? (
                                groupName === currentConv?.groupName && currentConv.groupAvatar ? (
                                    <AvatarImage src={currentConv.groupAvatar} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#00A884]/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-[var(--wa-green)]" />
                                    </div>
                                )
                            ) : otherUser?.avatar ? (
                                <AvatarImage src={otherUser.avatar} alt="" />
                            ) : null}
                            {!isGroup && (
                                <AvatarFallback className="bg-[var(--wa-input-bg)] text-sm font-semibold text-[var(--wa-text-light)]">
                                    {otherUser?.name?.charAt(0).toUpperCase() || "C"}
                                </AvatarFallback>
                            )}
                        </Avatar>

                        {/* Name & status */}
                        <div className="min-w-0">
                            <p className="text-[15px] font-medium text-[var(--wa-text-on-header)] truncate">
                                {isGroup ? groupName : (otherUser?.name || "Conversation")}
                            </p>
                            {typingUsers && typingUsers.length > 0 ? (
                                <p className="text-xs text-[var(--wa-green-light)] font-medium">typing...</p>
                            ) : isGroup ? (
                                <p className="text-xs text-[var(--wa-text-on-header)]/70">{participantCount} members</p>
                            ) : otherUser?.isOnline ? (
                                <p className="text-xs text-[var(--wa-text-on-header)]/70">online</p>
                            ) : (
                                <p className="text-xs text-[var(--wa-text-on-header)]/70">offline</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Messages ── */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-16 py-3 wa-chat-bg wa-scrollbar relative"
                >
                    {messages === undefined ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--wa-text-light)]/40" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="bg-[var(--wa-system-msg)] px-4 py-2 rounded-lg shadow-sm text-center max-w-[280px]">
                                <p className="text-xs text-[var(--wa-text-secondary)] leading-relaxed">
                                    Messages are end-to-end encrypted. No one outside of this
                                    chat can read them. Say hi! 👋
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {messages.map((msg, index) => {
                                const isOwn = msg.senderId === currentUser?._id;
                                const isFirstInGroup =
                                    index === 0 ||
                                    messages[index - 1].senderId !== msg.senderId;

                                // Check if the message is purely emojis
                                // This regex strips out common emoji ranges and checks if anything is left over besides whitespace
                                const strippedText = msg.content.replace(/[\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\uFE0F\u200D]/gu, '');
                                const isOnlyEmoji = strippedText.trim().length === 0 && msg.content.trim().length > 0;

                                // Emoji animation classes based on content
                                let emojiAnimation = "animate-bounce-in";
                                if (isOnlyEmoji) {
                                    if (msg.content.includes("❤️")) emojiAnimation = "animate-heartbeat";
                                    else if (msg.content.includes("🔥")) emojiAnimation = "animate-pulse";
                                }

                                return (
                                    <div
                                        key={msg._id}
                                        className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in-up`}
                                        style={{ animationDuration: "0.2s" }}
                                    >
                                        {msg.isDeleted ? (
                                            <div className={`max-w-[65%] px-3 py-1.5 rounded-lg text-[var(--wa-text-light)] text-[13px] italic border border-[var(--wa-border)] my-0.5 ${isOwn ? "bg-[var(--wa-bubble-sent)]/50 text-[var(--wa-text-primary)]/70" : "bg-[var(--wa-bubble-received)]/50"}`}>
                                                🚫 This message was deleted
                                            </div>
                                        ) : (
                                            <div className="relative flex items-center group max-w-[65%]">
                                                {/* Swipe-to-Reveal Delete button (Mobile) */}
                                                {isOwn && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteMessage(msg._id);
                                                        }}
                                                        className={`absolute left-0 w-8 h-8 bg-[var(--wa-danger)] rounded-full flex md:hidden items-center justify-center shadow-md transition-all duration-200 z-0 ${swipedMessageId === msg._id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white" />
                                                    </button>
                                                )}

                                                {/* Main Bubble */}
                                                <div
                                                    className={`relative w-full px-3 pt-1.5 pb-1 rounded-lg shadow-sm my-[1px] transition-transform duration-200 z-10 cursor-pointer ${isOnlyEmoji
                                                        ? `bg-transparent shadow-none text-4xl ${emojiAnimation}` // Big transparent emojis
                                                        : isOwn
                                                            ? `bg-[var(--wa-bubble-sent)] text-[var(--wa-text-primary)] ${isFirstInGroup ? "bubble-tail-sent rounded-tr-none px-4 pt-2 pb-1.5 shadow-md" : ""}`
                                                            : `bg-[var(--wa-bubble-received)] text-[var(--wa-text-primary)] ${isFirstInGroup ? "bubble-tail-received rounded-tl-none px-4 pt-2 pb-1.5 shadow-md" : ""}`
                                                        } ${swipedMessageId === msg._id ? 'translate-x-12' : 'translate-x-0'}`}
                                                    onClick={(e) => {
                                                        // Only toggle reaction picker if not swiped
                                                        if (swipedMessageId === msg._id) {
                                                            setSwipedMessageId(null);
                                                        } else {
                                                            setReactionsPopupMessageId(reactionsPopupMessageId === msg._id ? null : msg._id);
                                                        }
                                                    }}
                                                    onTouchStart={(e) => {
                                                        touchStartXRef.current = e.changedTouches[0].clientX;
                                                    }}
                                                    onTouchEnd={(e) => {
                                                        const touchEndX = e.changedTouches[0].clientX;
                                                        const diff = touchEndX - touchStartXRef.current;
                                                        if (diff > 40 && isOwn) { // Swipe right
                                                            setSwipedMessageId(msg._id);
                                                            setReactionsPopupMessageId(null);
                                                        } else if (diff < -30) { // Swipe left
                                                            setSwipedMessageId(null);
                                                        }
                                                    }}
                                                >
                                                    {/* Sender name (for received, first in group) */}
                                                    {!isOwn && isFirstInGroup && (
                                                        <p className="text-[12.5px] font-semibold text-[var(--wa-green)] mb-0.5">
                                                            {msg.senderName}
                                                        </p>
                                                    )}

                                                    {/* Message content + timestamp row */}
                                                    <div className={`flex items-end gap-2 ${isOnlyEmoji ? 'mt-1' : ''}`}>
                                                        <p className={`break-words flex-1 ${isOnlyEmoji ? 'text-5xl leading-none' : 'text-[14.2px] leading-[19px]'}`}>
                                                            {msg.content}
                                                        </p>
                                                        <div className="flex items-center gap-1 shrink-0 self-end pb-[1px] mt-1">
                                                            <span className={`text-[11px] ${isOnlyEmoji ? 'opacity-50 drop-shadow-md text-white' : 'text-[var(--wa-text-secondary)]'}`}>
                                                                {formatMessageTimestamp(msg._creationTime)}
                                                            </span>
                                                            {isOwn && (
                                                                <span className="shrink-0 text-[var(--wa-text-secondary)] flex items-center justify-center">
                                                                    {!isGroup && msg.seenBy && msg.seenBy.length > 0 ? (
                                                                        <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#34B7F1] flex shrink-0 items-center justify-center bg-transparent">
                                                                            <div className="w-[10px] h-[10px] rounded-full bg-[#34B7F1]" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-gray-400 opacity-70 shrink-0 bg-transparent" />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Display Reactions */}
                                                    {msg.reactions && msg.reactions.length > 0 && (
                                                        <div className={`flex flex-wrap gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                                                            {msg.reactions.map(r => {
                                                                const userHasReacted = currentUser && r.users.includes(currentUser._id);
                                                                return (
                                                                    <button
                                                                        key={r.emoji}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReaction(msg._id, r.emoji);
                                                                        }}
                                                                        className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border shadow-sm transition-colors ${userHasReacted ? 'bg-[var(--wa-green-light)]/20 border-[var(--wa-green-light)]/30 text-[var(--wa-text-primary)]' : 'bg-[var(--wa-header)]/80 border-white/10 hover:bg-[var(--wa-hover)] text-[var(--wa-text-secondary)]'}`}
                                                                    >
                                                                        <span>{r.emoji}</span>
                                                                        {r.users.length > 1 && <span className="opacity-80 font-medium">{r.users.length}</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Add Reaction Button (Desktop Hover) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReactionsPopupMessageId(reactionsPopupMessageId === msg._id ? null : msg._id);
                                                        }}
                                                        className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-10' : '-right-10'} w-8 h-8 bg-[var(--wa-header)] rounded-full hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md border hover:bg-[var(--wa-hover)] border-white/10 z-10`}
                                                    >
                                                        <Smile className="w-5 h-5 text-[var(--wa-text-light)]" />
                                                    </button>

                                                    {/* Reaction Picker Popup */}
                                                    {reactionsPopupMessageId === msg._id && (
                                                        <div className={`absolute top-1/2 -translate-y-1/2 z-50 bg-[var(--wa-header)] rounded-full px-3 py-2 shadow-2xl border border-white/15 flex items-center gap-2 animate-in zoom-in-95 duration-200 ${isOwn ? 'right-full mr-[0.4rem]' : 'left-full ml-[0.4rem]'}`}
                                                            onMouseLeave={() => setReactionsPopupMessageId(null)}
                                                        >
                                                            {EMOJIS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleReaction(msg._id, emoji);
                                                                        setReactionsPopupMessageId(null);
                                                                    }}
                                                                    className="text-2xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 cursor-pointer px-1"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Delete button (Desktop Hover) */}
                                                    {isOwn && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteMessage(msg._id);
                                                            }}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--wa-header)] rounded-full hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[var(--wa-danger)] shadow-md"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-white" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Typing indicator */}
                    {typingUsers && typingUsers.length > 0 && (
                        <div className="flex justify-start mt-1">
                            <div className="bg-[var(--wa-bubble-received)] px-4 py-2.5 rounded-lg shadow-sm bubble-tail-received rounded-tl-none flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-[7px] h-[7px] bg-[var(--wa-text-light)] rounded-full typing-dot" />
                                    <span className="w-[7px] h-[7px] bg-[var(--wa-text-light)] rounded-full typing-dot" />
                                    <span className="w-[7px] h-[7px] bg-[var(--wa-text-light)] rounded-full typing-dot" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Scroll-to-bottom button */}
                {showScrollButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="absolute bottom-[72px] right-5 w-10 h-10 bg-[var(--wa-header)] rounded-full shadow-lg hover:bg-[var(--wa-hover)] z-20"
                    >
                        <ChevronDown className="w-5 h-5 text-[var(--wa-text-light)]" />
                    </Button>
                )}

                {/* ── Input Area ── */}
                <div className="px-3 py-2 bg-[var(--wa-sidebar-header)] shrink-0">
                    <form onSubmit={handleSend} className="flex items-end gap-2">
                        {/* Emoji */}
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                                className={`w-10 h-10 shrink-0 rounded-full transition-colors ${showInputEmojiPicker ? 'bg-[var(--wa-hover)] text-[var(--wa-text-primary)]' : 'text-[var(--wa-text-light)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)]'}`}
                            >
                                <Smile className="w-6 h-6" />
                            </Button>

                            {/* Input Emoji Picker Popup */}
                            {showInputEmojiPicker && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowInputEmojiPicker(false)}
                                    />
                                    <div className="absolute bottom-full left-0 mb-2 z-50 bg-[var(--wa-header)] rounded-full px-3 py-2 shadow-2xl border border-white/15 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
                                        {EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => handleSendEmojiDirectly(emoji)}
                                                className="text-2xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 cursor-pointer px-1"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Text input */}
                        <div className="flex-1 relative">
                            <Input
                                type="text"
                                value={newMessage}
                                onChange={(e) => handleTyping(e.target.value)}
                                placeholder="Type a message"
                                className="w-full h-[42px] px-4 text-[15px] bg-[var(--wa-input-bg)] text-[var(--wa-text-primary)] rounded-lg border-none shadow-none outline-none placeholder:text-[var(--wa-text-light)] focus-visible:ring-0 focus-visible:border-none"
                            />
                        </div>

                        {/* Send / Mic */}
                        {newMessage.trim() || isSending ? (
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isSending}
                                className="w-10 h-10 bg-[var(--wa-green)] rounded-full text-white hover:bg-[var(--wa-green-dark)] active:scale-95 shrink-0 disabled:opacity-70"
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="w-10 h-10 shrink-0 rounded-full text-[var(--wa-text-light)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)]"
                            >
                                <Mic className="w-6 h-6" />
                            </Button>
                        )}
                    </form>
                </div>
            </div>{/* End Main Chat Area */}

            {/* Group Info Sidebar */}
            {isGroup && showGroupInfo && (
                <GroupInfoSidebar
                    conversationId={conversationId}
                    onClose={() => setShowGroupInfo(false)}
                />
            )}
        </div>
    );
}
