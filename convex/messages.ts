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
