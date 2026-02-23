import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: currentUser._id,
            content: args.content,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
            updatedAt: Date.now(),
        });

        // Increment unread counts for all participants except sender
        const conversation = await ctx.db.get(args.conversationId);
        if (conversation) {
            for (const participantId of conversation.participantIds) {
                if (participantId !== currentUser._id) {
                    const unreadRecord = await ctx.db
                        .query("unreadCounts")
                        .withIndex("by_user_conversation", (q) =>
                            q.eq("userId", participantId).eq("conversationId", args.conversationId)
                        )
                        .first();

                    if (unreadRecord) {
                        await ctx.db.patch(unreadRecord._id, { count: unreadRecord.count + 1 });
                    } else {
                        await ctx.db.insert("unreadCounts", {
                            conversationId: args.conversationId,
                            userId: participantId,
                            count: 1,
                        });
                    }
                }
            }
        }

        return messageId;
    },
});

export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        return Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    senderName: sender?.name || "Unknown",
                    senderAvatar: sender?.avatar,
                    isCurrentUserId: sender?._id, // Will match on client
                };
            })
        );
    },
});

export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        const message = await ctx.db.get(args.messageId);
        if (!message || message.senderId !== currentUser._id) return;
        await ctx.db.patch(args.messageId, {
            isDeleted: true,
        });
    },
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        let currentReactions = message.reactions || [];

        // Find if this emoji already has reactions
        const existingEmojiIndex = currentReactions.findIndex(r => r.emoji === args.emoji);

        if (existingEmojiIndex !== -1) {
            // Emoji exists, check if user has reacted with it
            const existingReaction = currentReactions[existingEmojiIndex];
            const userIndex = existingReaction.users.findIndex(id => id === currentUser._id);

            if (userIndex !== -1) {
                // User has reacted with this emoji, so remove their reaction (toggle off)
                existingReaction.users.splice(userIndex, 1);

                // If no users left for this emoji, remove the emoji object entirely
                if (existingReaction.users.length === 0) {
                    currentReactions.splice(existingEmojiIndex, 1);
                }
            } else {
                // User hasn't reacted with this emoji, add them
                existingReaction.users.push(currentUser._id);
            }
        } else {
            // First time this emoji is used on this message
            currentReactions.push({
                emoji: args.emoji,
                users: [currentUser._id]
            });
        }

        await ctx.db.patch(args.messageId, {
            reactions: currentReactions
        });
    },
});
