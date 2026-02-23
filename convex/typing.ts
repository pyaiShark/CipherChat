import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        // Remove existing
        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.eq(q.field("userId"), currentUser._id))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
        }

        if (args.isTyping) {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: currentUser._id,
                expiresAt: Date.now() + 3000, // 3 seconds expiry
            });
        }
    },
});

export const getTypingUsers = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // Filter expired and current user
        const now = Date.now();
        const activeIndicators = indicators.filter(
            (ind) => ind.expiresAt > now && ind.userId !== currentUser._id
        );

        const userIds = activeIndicators.map((ind) => ind.userId);
        // Deduplicate array
        const uniqueUserIds = [...new Set(userIds)];

        // Fetch user details
        const typingUsers = await Promise.all(
            uniqueUserIds.map((id) => ctx.db.get(id))
        );

        return typingUsers.filter(Boolean);
    },
});
