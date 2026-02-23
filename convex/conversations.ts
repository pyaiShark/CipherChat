import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        // Fix: We don't have an index for participantIds, so we'll query all conversations
        // Alternatively, we can add an index, but an array query works for small scale
        const allConversations = await ctx.db.query("conversations").collect();

        const existing = allConversations.find(
            (c) =>
                c.participantIds.includes(currentUser._id) &&
                c.participantIds.includes(args.otherUserId) &&
                c.participantIds.length === 2
        );

        if (existing) {
            return existing._id;
        }

        // Create new conversation
        const newConvId = await ctx.db.insert("conversations", {
            participantIds: [currentUser._id, args.otherUserId],
            updatedAt: Date.now(),
        });

        return newConvId;
    },
});

export const markAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        const unreadRecord = await ctx.db
            .query("unreadCounts")
            .withIndex("by_user_conversation", (q) =>
                q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
            )
            .first();

        if (unreadRecord) {
            await ctx.db.patch(unreadRecord._id, { count: 0 });
        }
    },
});

export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const conversations = await ctx.db.query("conversations").collect();

        // Filter conversations where current user is a participant
        const myConversations = conversations.filter((c) =>
            c.participantIds.includes(currentUser._id)
        );

        // Fetch related users and last message
        return await Promise.all(
            myConversations.map(async (conv) => {
                const otherUserId = conv.participantIds.find((id) => id !== currentUser._id);
                const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
                const lastMessage = conv.lastMessageId ? await ctx.db.get(conv.lastMessageId) : null;

                const unreadRecord = await ctx.db
                    .query("unreadCounts")
                    .withIndex("by_user_conversation", (q) =>
                        q.eq("userId", currentUser._id).eq("conversationId", conv._id)
                    )
                    .first();

                return {
                    ...conv,
                    otherUser,
                    lastMessage,
                    unreadCount: unreadRecord?.count || 0,
                };
            })
        );
    }
});
